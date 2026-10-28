const counter = require('../models/Counter');

async function generateappid(company) {
  let prefix = company.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  if (prefix.length < 3) {
    prefix = prefix.padEnd(3, 'X');
  }
  const doc = await counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const num = String(doc.seq).padStart(3, '0');
  return 'JA-' + prefix + '-' + num;
}

function getfollowupdate(applieddate) {
  const d = new Date(applieddate);
  d.setDate(d.getDate() + 7);
  return d;
}

function addoverdue(app) {
  const obj = app.toObject ? app.toObject() : app;
  let overdue = false;
  if (obj.status === 'Applied' && obj.followupdate && new Date() > new Date(obj.followupdate)) {
    overdue = true;
  }
  obj.isOverdue = overdue;
  return obj;
}

module.exports = { generateappid, getfollowupdate, addoverdue };
