const express = require('express');
const mongoose = require('mongoose');
const application = require('../models/Application');
const { generateappid, getfollowupdate, addoverdue } = require('../utils/helpers');

const router = express.Router();

const transitions = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Rejected: [],
  Accepted: [],
  Declined: [],
};
const finalstatuses = ['Rejected', 'Accepted', 'Declined'];
const jobtypes = ['Full-time', 'Internship', 'Contract'];

function escaperegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function send(res, code, success, message, data) {
  return res.status(code).json({ success: success, message: message, data: data });
}

async function findduplicate(company, role, skipid) {
  const query = {
    company: { $regex: '^' + escaperegex(company) + '$', $options: 'i' },
    role: { $regex: '^' + escaperegex(role) + '$', $options: 'i' },
    status: { $nin: finalstatuses },
  };
  if (skipid) {
    query._id = { $ne: skipid };
  }
  return await application.findOne(query);
}

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const company = (body.company || '').trim();
    const role = (body.role || '').trim();
    const jobtype = body.jobtype;
    const applieddate = body.applieddate;

    if (!company || !role || !jobtype || !applieddate) {
      return send(res, 400, false, 'Company, role, job type and applied date are required', null);
    }
    if (!jobtypes.includes(jobtype)) {
      return send(res, 400, false, 'Job type must be Full-time, Internship or Contract', null);
    }
    const date = new Date(applieddate);
    if (isNaN(date.getTime())) {
      return send(res, 400, false, 'Applied date is not valid', null);
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      return send(res, 400, false, 'Applied date cannot be a future date', null);
    }
    let salary = undefined;
    if (body.salary !== undefined && body.salary !== null && body.salary !== '') {
      salary = Number(body.salary);
      if (isNaN(salary) || salary < 0) {
        return send(res, 400, false, 'Expected salary must be a positive number', null);
      }
    }

    const dup = await findduplicate(company, role);
    if (dup) {
      return send(res, 409, false, 'An active application for ' + company + ' - ' + role + ' already exists (' + dup.appid + ')', null);
    }

    const appid = await generateappid(company);
    const newapp = await application.create({
      appid: appid,
      company: company,
      role: role,
      jobtype: jobtype,
      applieddate: date,
      salary: salary,
      notes: body.notes || '',
      status: 'Applied',
      statushistory: [{ status: 'Applied', changedat: new Date() }],
      followupdate: getfollowupdate(date),
    });

    return send(res, 201, true, 'Application added', addoverdue(newapp));
  } catch (err) {
    return send(res, 500, false, err.message, null);
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    const status = req.query.status;
    const search = req.query.search;
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.company = { $regex: escaperegex(search.trim()), $options: 'i' };
    }
    const apps = await application.find(filter).sort({ createdAt: -1 });

    const counts = { All: 0, Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Accepted: 0, Declined: 0 };
    const grouped = await application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    grouped.forEach((g) => {
      counts[g._id] = g.count;
      counts.All = counts.All + g.count;
    });

    const list = apps.map((a) => addoverdue(a));
    return send(res, 200, true, 'Applications fetched', { applications: list, counts: counts });
  } catch (err) {
    return send(res, 500, false, err.message, null);
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return send(res, 404, false, 'Application not found', null);
    }
    const app = await application.findById(req.params.id);
    if (!app) {
      return send(res, 404, false, 'Application not found', null);
    }
    const obj = addoverdue(app);
    obj.nextstatuses = transitions[app.status];
    return send(res, 200, true, 'Application fetched', obj);
  } catch (err) {
    return send(res, 500, false, err.message, null);
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return send(res, 404, false, 'Application not found', null);
    }
    const app = await application.findById(req.params.id);
    if (!app) {
      return send(res, 404, false, 'Application not found', null);
    }
    const body = req.body || {};
    const company = (body.company || '').trim();
    const role = (body.role || '').trim();
    const jobtype = body.jobtype;

    if (!company || !role || !jobtype) {
      return send(res, 400, false, 'Company, role and job type are required', null);
    }
    if (!jobtypes.includes(jobtype)) {
      return send(res, 400, false, 'Job type must be Full-time, Internship or Contract', null);
    }
    let salary = undefined;
    if (body.salary !== undefined && body.salary !== null && body.salary !== '') {
      salary = Number(body.salary);
      if (isNaN(salary) || salary < 0) {
        return send(res, 400, false, 'Expected salary must be a positive number', null);
      }
    }

    if (!finalstatuses.includes(app.status)) {
      const dup = await findduplicate(company, role, app._id);
      if (dup) {
        return send(res, 409, false, 'An active application for ' + company + ' - ' + role + ' already exists (' + dup.appid + ')', null);
      }
    }

    app.company = company;
    app.role = role;
    app.jobtype = jobtype;
    app.salary = salary;
    app.notes = body.notes || '';
    await app.save();

    return send(res, 200, true, 'Application updated', addoverdue(app));
  } catch (err) {
    return send(res, 500, false, err.message, null);
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return send(res, 404, false, 'Application not found', null);
    }
    const app = await application.findById(req.params.id);
    if (!app) {
      return send(res, 404, false, 'Application not found', null);
    }
    const body = req.body || {};
    const newstatus = body.status;
    if (!newstatus) {
      return send(res, 400, false, 'New status is required', null);
    }
    if (finalstatuses.includes(app.status)) {
      return send(res, 400, false, 'Status ' + app.status + ' is final and cannot be changed', null);
    }
    const allowed = transitions[app.status] || [];
    if (!allowed.includes(newstatus)) {
      return send(res, 400, false, 'Invalid status change from ' + app.status + ' to ' + newstatus + '. Allowed: ' + allowed.join(', '), null);
    }

    app.status = newstatus;
    app.statushistory.push({ status: newstatus, changedat: new Date() });
    await app.save();

    const obj = addoverdue(app);
    obj.nextstatuses = transitions[app.status];
    return send(res, 200, true, 'Status changed to ' + newstatus, obj);
  } catch (err) {
    return send(res, 500, false, err.message, null);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return send(res, 404, false, 'Application not found', null);
    }
    const app = await application.findById(req.params.id);
    if (!app) {
      return send(res, 404, false, 'Application not found', null);
    }
    if (app.status === 'Interview' || app.status === 'Offer') {
      return send(res, 400, false, 'Cannot delete an application in ' + app.status + ' status', null);
    }
    await application.findByIdAndDelete(req.params.id);
    return send(res, 200, true, 'Application deleted', { id: req.params.id });
  } catch (err) {
    return send(res, 500, false, err.message, null);
  }
});

module.exports = router;
