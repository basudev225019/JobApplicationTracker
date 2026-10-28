import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/home.jsx';

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
        </Routes>
      </div>
    </div>
  );
}

export default App;
