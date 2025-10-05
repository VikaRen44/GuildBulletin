import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  FiHome,
  FiBriefcase,
  FiUploadCloud,
  FiLogOut,
  FiGrid,
  FiInbox
} from "react-icons/fi";
import "../Styles/navbar.css";

const Navbar = () => {
  const [userRole, setUserRole] = useState("");
  const [firstJobId, setFirstJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
          localStorage.setItem("userRole", role);
        }
      } else {
        setUserRole("");
        localStorage.removeItem("userRole");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFirstJob = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        if (!querySnapshot.empty) setFirstJobId(querySnapshot.docs[0].id);
      } catch (e) {
        console.error("Error fetching jobs:", e);
      }
    };
    fetchFirstJob();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole("");
      localStorage.removeItem("userRole");
      window.dispatchEvent(new Event("storage"));
      navigate("/login");
    } catch (e) {
      console.error("❌ Error logging out:", e.message);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo now links to /home */}
          <Link to="/home" className="navbar-brand" aria-label="InternItUp Home">
            InternItUp
          </Link>

          <div className="nav-links">
            <Link to="/home" className="nav-item">
              <FiHome className="nav-ic" />
              <span>Home</span>
            </Link>

            {firstJobId ? (
              <Link to={`/job/${firstJobId}`} className="nav-item">
                <FiBriefcase className="nav-ic" />
                <span>Find a Job</span>
              </Link>
            ) : (
              <span className="nav-item nav-item--disabled" title="No jobs yet">
                <FiBriefcase className="nav-ic" />
                <span>Find a Job</span>
              </span>
            )}

            {!loading && userRole === "hirer" && (
              <>
                <Link to="/post-job" className="nav-item">
                  <FiBriefcase className="nav-ic" />
                  <span>Post a Job</span>
                </Link>

                <Link to="/submissions" className="nav-item">
                  <FiInbox className="nav-ic" />
                  <span>View Submissions</span>
                </Link>
              </>
            )}

            {!loading && userRole === "applicant" && (
              <Link to="/upload-cv" className="nav-item">
                <FiUploadCloud className="nav-ic" />
                <span>Upload CV</span>
              </Link>
            )}

            {!loading && userRole === "admin" && (
              <Link to="/admin" className="nav-item">
                <FiGrid className="nav-ic" />
                <span>Admin Dash</span>
              </Link>
            )}

            {!loading && userRole && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="nav-item nav-item--logout"
              >
                <FiLogOut className="nav-ic" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="logout-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              <span>Confirmation</span> Are you sure you want to log out?
            </h2>

            <div className="logout-button-group">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="logout-cancel-btn"
                aria-label="Cancel logout"
              >
                ✖
              </button>
              <button
                onClick={handleLogout}
                className="logout-confirm-btn"
                aria-label="Confirm logout"
              >
                ✔
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
