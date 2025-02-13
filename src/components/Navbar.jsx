import { Link } from "react-router-dom";
import "../Styles/navbar.css"; // Import Navbar styling


const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">Job Bulletin</h1>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/post-job" className="nav-link">Post a Job</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
