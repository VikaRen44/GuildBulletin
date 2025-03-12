import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "../Styles/navbar.css";

const Navbar = () => {
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate(); // Hook for redirection

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Logout function with redirection
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole(""); // Reset role on logout
      navigate("/login"); // Redirect to Login page
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">Job Bulletin</h1>
        <div className="nav-links">
          <Link to="/home" className="nav-link">Home</Link>

          {!loading && userRole === "hirer" && (
            <Link to="/post-job" className="nav-link">Post a Job</Link>
          )}
          {!loading && userRole === "applicant" && (
            <Link to="/upload-cv" className="nav-link">Upload CV</Link>
          )}

          {/* Show logout button when user is logged in */}
          {!loading && userRole && (
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
