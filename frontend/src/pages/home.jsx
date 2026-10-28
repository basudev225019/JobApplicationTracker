import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const statuses = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Declined'];

function Home() {
  const [apps, setapps] = useState([]);
  const [counts, setcounts] = useState({});
  const [status, setstatus] = useState('All');
  const [search, setsearch] = useState('');
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState('');

  useEffect(() => {
    let old = false;
    setloading(true);
    seterror('');
    api
      .get('/', { params: { status: status, search: search } })
      .then((res) => {
        if (old) return;
        setapps(res.data.data.applications);
        setcounts(res.data.data.counts);
      })
      .catch((err) => {
        if (old) return;
        seterror(err.response ? err.response.data.message : 'Could not connect to server');
      })
      .finally(() => {
        if (!old) setloading(false);
      });
    return () => {
      old = true;
    };
  }, [status, search]);

  return (
    <div>
      <div className="countbar">
        {statuses.map((s) => (
          <div
            key={s}
            className={'countbox ' + (status === s ? 'active' : '')}
            onClick={() => setstatus(s)}
          >
            <div className="countnum">{counts[s] || 0}</div>
            <div className="countlabel">{s}</div>
          </div>
        ))}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by company..."
          value={search}
          onChange={(e) => setsearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setstatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Statuses' : s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="errorbox">{error}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && apps.length === 0 && (
        <div className="empty">No applications found. Add one to get started!</div>
      )}

      <div className="cardgrid">
        {apps.map((a) => (
          <Link to={'/app/' + a._id} key={a._id} className="card">
            <div className="cardtop">
              <span className="appid">{a.appid}</span>
              <span className={'badge ' + a.status.toLowerCase()}>{a.status}</span>
            </div>
            <h3>{a.company}</h3>
            <p className="role">{a.role}</p>
            <div className="cardbottom">
              <span className="muted">Applied: {new Date(a.applieddate).toLocaleDateString('en-IN')}</span>
              <span className="muted">{a.jobtype}</span>
            </div>
            {a.isOverdue && <span className="overdue">Follow-up Overdue</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
