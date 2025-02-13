import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../Styles/navbar.css"; // Import Navbar styling

const Navbar = () => {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Retrieve user role from local storage
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role);
    }
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">Job Bulletin</h1>
        <div className="nav-links">
          <Link to="/home" className="nav-link">Home</Link>

          {/* Conditionally Render Based on Role */}
          {userRole === "hire" && (
            <Link to="/post-job" className="nav-link">Post a Job</Link>
          )}
          
          {userRole === "applicant" && (
            <Link to="/upload-cv" className="nav-link">Upload CV</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

