import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/home.jsx';
import AppForm from './pages/appform.jsx';
import Details from './pages/details.jsx';

function App() {
  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="logo">JobTracker</Link>
        <Link to="/add" className="btn btnprimary">+ Add Application</Link>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AppForm />} />
          <Route path="/edit/:id" element={<AppForm />} />
          <Route path="/app/:id" element={<Details />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
