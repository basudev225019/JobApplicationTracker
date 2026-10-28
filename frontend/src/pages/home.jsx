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
      <div className="pagehead">
        <h1>Applications</h1>
        <input
          type="text"
          className="search"
          placeholder="Search company"
          value={search}
          onChange={(e) => setsearch(e.target.value)}
        />
      </div>

      <div className="tabs">
        {statuses.map((s) => (
          <button
            key={s}
            className={'tab ' + (status === s ? 'active' : '')}
            onClick={() => setstatus(s)}
          >
            {s}
            <span className="tabcount">{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="errorbox">{error}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && apps.length === 0 && (
        <div className="empty">No applications here yet.</div>
      )}

      {apps.length > 0 && (
        <div className="list">
          <div className="listhead">
            <span>ID</span>
            <span>Company</span>
            <span>Type</span>
            <span>Applied</span>
            <span>Status</span>
          </div>
          {apps.map((a) => (
            <Link to={'/app/' + a._id} key={a._id} className="listrow">
              <span className="appid">{a.appid}</span>
              <span className="company">
                <strong>{a.company}</strong>
                <span className="muted">{a.role}</span>
              </span>
              <span className="muted jobtype">{a.jobtype}</span>
              <span className="muted date">{new Date(a.applieddate).toLocaleDateString('en-IN')}</span>
              <span className="statuscell">
                <span className={'badge ' + a.status.toLowerCase()}>{a.status}</span>
                {a.isOverdue && <span className="overdue">Follow-up Overdue</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
