import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api.js';

function showdate(d) {
  return new Date(d).toLocaleDateString('en-IN');
}

function showdatetime(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setapp] = useState(null);
  const [newstatus, setnewstatus] = useState('');
  const [error, seterror] = useState('');
  const [msg, setmsg] = useState('');
  const [busy, setbusy] = useState(false);

  useEffect(() => {
    api
      .get('/' + id)
      .then((res) => setapp(res.data.data))
      .catch((err) => seterror(err.response ? err.response.data.message : 'Could not connect to server'));
  }, [id]);

  function changestatus() {
    if (!newstatus) return;
    setbusy(true);
    seterror('');
    setmsg('');
    api
      .patch('/' + id + '/status', { status: newstatus })
      .then((res) => {
        setapp(res.data.data);
        setmsg(res.data.message);
        setnewstatus('');
      })
      .catch((err) => seterror(err.response ? err.response.data.message : 'Could not connect to server'))
      .finally(() => setbusy(false));
  }

  function deleteapp() {
    if (!window.confirm('Are you sure you want to delete ' + app.appid + '?')) return;
    setbusy(true);
    api
      .delete('/' + id)
      .then(() => navigate('/'))
      .catch((err) => {
        seterror(err.response ? err.response.data.message : 'Could not connect to server');
        setbusy(false);
      });
  }

  if (!app) {
    return (
      <div>
        {error ? <div className="errorbox">{error}</div> : <p className="muted">Loading...</p>}
        <Link to="/" className="btn btngrey">Back</Link>
      </div>
    );
  }

  const candelete = app.status !== 'Interview' && app.status !== 'Offer';
  const nextlist = app.nextstatuses || [];

  return (
    <div className="details">
      <Link to="/" className="backlink">&larr; Back to applications</Link>

      {error && <div className="errorbox">{error}</div>}
      {msg && <div className="successbox">{msg}</div>}

      <div className="detailcard">
        <div className="cardtop">
          <span className="appid">{app.appid}</span>
          <span className={'badge ' + app.status.toLowerCase()}>{app.status}</span>
        </div>
        <h2>{app.company}</h2>
        <p className="role">{app.role}</p>
        {app.isOverdue && <span className="overdue">Follow-up Overdue</span>}

        <div className="infogrid">
          <div>
            <span className="muted">Job Type</span>
            <p>{app.jobtype}</p>
          </div>
          <div>
            <span className="muted">Applied Date</span>
            <p>{showdate(app.applieddate)}</p>
          </div>
          <div>
            <span className="muted">Follow-up Date</span>
            <p>{showdate(app.followupdate)}</p>
          </div>
          <div>
            <span className="muted">Expected Salary</span>
            <p>{app.salary !== undefined && app.salary !== null ? '₹ ' + app.salary : '-'}</p>
          </div>
        </div>

        <div>
          <span className="muted">Notes</span>
          <p>{app.notes ? app.notes : '-'}</p>
        </div>

        <div className="actions">
          <Link to={'/edit/' + app._id} className="btn btnprimary">Edit</Link>
          <button
            className="btn btnred"
            onClick={deleteapp}
            disabled={!candelete || busy}
            title={candelete ? '' : 'Cannot delete while in ' + app.status}
          >
            Delete
          </button>
        </div>
        {!candelete && <p className="muted">Applications in Interview or Offer status cannot be deleted.</p>}
      </div>

      <div className="detailcard">
        <h3>Change Status</h3>
        {nextlist.length === 0 ? (
          <p className="muted">{app.status} is a final status and cannot be changed.</p>
        ) : (
          <div className="statusrow">
            <select value={newstatus} onChange={(e) => setnewstatus(e.target.value)}>
              <option value="">-- Select next status --</option>
              {nextlist.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn btnprimary" onClick={changestatus} disabled={!newstatus || busy}>
              Update Status
            </button>
          </div>
        )}
      </div>

      <div className="detailcard">
        <h3>Status History</h3>
        <div className="timeline">
          {app.statushistory.map((h, i) => (
            <div className="tlitem" key={i}>
              <div className={'tldot ' + h.status.toLowerCase()}></div>
              <div>
                <strong>{h.status}</strong>
                <p className="muted">{showdatetime(h.changedat)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Details;
