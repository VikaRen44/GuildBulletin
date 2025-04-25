import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
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
        if (!querySnapshot.empty) {
          setFirstJobId(querySnapshot.docs[0].id);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
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
    } catch (error) {
      console.error("❌ Error logging out:", error.message);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <h1 className="navbar-title">InternItUp</h1>
          <div className="nav-links">
            <Link to="/home" className="nav-link">Home</Link>

            {firstJobId ? (
              <Link to={`/job/${firstJobId}`} className="nav-link"> Find a Job</Link>
            ) : (
              <span className="nav-link disabled">🔍 Find a Job</span>
            )}

            {!loading && userRole === "hirer" && (
              <>
                <Link to="/post-job" className="nav-link">Post a Job</Link>
                <Link to="/submissions" className="nav-link"> View Submissions</Link>
              </>
            )}

            {!loading && userRole === "applicant" && (
              <Link to="/upload-cv" className="nav-link">Upload CV</Link>
            )}

            {!loading && userRole === "admin" && (
              <Link to="/admin" className="nav-link">🛠 Admin Dash</Link>
            )}

            {!loading && userRole && (
              <button onClick={() => setShowLogoutModal(true)} className="nav-link-logout-btn">
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ✅ Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              <span>Confirmation</span> Are you sure you want to log out?
            </h2>

            <div className="logout-button-group">
              <button onClick={() => setShowLogoutModal(false)} className="logout-cancel-btn">
              ✖
              </button>
              <button onClick={handleLogout} className="logout-confirm-btn">
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
