import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api.js';

function gettoday() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function AppForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isedit = Boolean(id);

  const [form, setform] = useState({
    company: '',
    role: '',
    jobtype: '',
    applieddate: '',
    salary: '',
    notes: '',
  });
  const [appid, setappid] = useState('');
  const [errors, seterrors] = useState({});
  const [servererror, setservererror] = useState('');
  const [saving, setsaving] = useState(false);

  useEffect(() => {
    if (!isedit) return;
    api
      .get('/' + id)
      .then((res) => {
        const a = res.data.data;
        setform({
          company: a.company,
          role: a.role,
          jobtype: a.jobtype,
          applieddate: a.applieddate.slice(0, 10),
          salary: a.salary !== undefined && a.salary !== null ? a.salary : '',
          notes: a.notes || '',
        });
        setappid(a.appid);
      })
      .catch((err) => {
        setservererror(err.response ? err.response.data.message : 'Could not load application');
      });
  }, [id, isedit]);

  function handlechange(e) {
    setform({ ...form, [e.target.name]: e.target.value });
    seterrors({ ...errors, [e.target.name]: '' });
  }

  function validate() {
    const errs = {};
    if (!form.company.trim()) errs.company = 'Company name is required';
    if (!form.role.trim()) errs.role = 'Job role is required';
    if (!form.jobtype) errs.jobtype = 'Select a job type';
    if (!isedit) {
      if (!form.applieddate) {
        errs.applieddate = 'Applied date is required';
      } else if (form.applieddate > gettoday()) {
        errs.applieddate = 'Applied date cannot be a future date';
      }
    }
    if (form.salary !== '' && (isNaN(form.salary) || Number(form.salary) < 0)) {
      errs.salary = 'Salary must be a positive number';
    }
    return errs;
  }

  function handlesubmit(e) {
    e.preventDefault();
    setservererror('');
    const errs = validate();
    seterrors(errs);
    if (Object.keys(errs).length > 0) return;

    setsaving(true);
    let req;
    if (isedit) {
      req = api.put('/' + id, {
        company: form.company,
        role: form.role,
        jobtype: form.jobtype,
        salary: form.salary,
        notes: form.notes,
      });
    } else {
      req = api.post('/', form);
    }
    req
      .then(() => {
        navigate(isedit ? '/app/' + id : '/');
      })
      .catch((err) => {
        setservererror(err.response ? err.response.data.message : 'Could not connect to server');
      })
      .finally(() => setsaving(false));
  }

  return (
    <div className="formcard">
      <h2>{isedit ? 'Edit Application' : 'Add Application'}</h2>

      {servererror && <div className="errorbox">{servererror}</div>}

      <form onSubmit={handlesubmit} noValidate>
        {isedit && (
          <div className="field">
            <label>Application ID</label>
            <input type="text" value={appid} disabled />
          </div>
        )}

        <div className="row">
          <div className="field">
            <label>Company Name *</label>
            <input type="text" name="company" value={form.company} onChange={handlechange} />
            {errors.company && <span className="fielderror">{errors.company}</span>}
          </div>
          <div className="field">
            <label>Job Role *</label>
            <input type="text" name="role" value={form.role} onChange={handlechange} />
            {errors.role && <span className="fielderror">{errors.role}</span>}
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Job Type *</label>
            <select name="jobtype" value={form.jobtype} onChange={handlechange}>
              <option value="">-- Select --</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
            {errors.jobtype && <span className="fielderror">{errors.jobtype}</span>}
          </div>
          <div className="field">
            <label>Applied Date *</label>
            <input
              type="date"
              name="applieddate"
              value={form.applieddate}
              max={gettoday()}
              onChange={handlechange}
              disabled={isedit}
            />
            {errors.applieddate && <span className="fielderror">{errors.applieddate}</span>}
          </div>
        </div>

        <div className="field">
          <label>Expected Salary (optional)</label>
          <input type="number" name="salary" min="0" value={form.salary} onChange={handlechange} />
          {errors.salary && <span className="fielderror">{errors.salary}</span>}
        </div>

        <div className="field">
          <label>Notes (optional)</label>
          <textarea name="notes" rows="3" value={form.notes} onChange={handlechange}></textarea>
        </div>

        <div className="formbtns">
          <Link to={isedit ? '/app/' + id : '/'} className="btn btngrey">Cancel</Link>
          <button type="submit" className="btn btnprimary" disabled={saving}>
            {saving ? 'Saving...' : isedit ? 'Update' : 'Add Application'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AppForm;
