import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import gothie from "../assets/gothie.jpg";
import blondie from "../assets/blondie.jpg";
import brunette from "../assets/brunette.jpg";

const Home = () => {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const auth = getAuth();
  const db = getFirestore();

  // 🔹 Fetch User & Profile Data (Only for Profile Section)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch profile data from Firestore
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setUserRole(data.role); // Get role from Firestore instead of local storage
        }
      } else {
        setUser(null);
        setProfileData(null);
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <header className="header">
          <h1 className="logo">
            <span className="touch">Touch</span>
            <span className="grass">Grass</span>
            <span className="now">Now</span>
          </h1>
        </header>
      </div>

      {/* 🔹 Search & Buttons Section */}
      <div className="search-section">
        <div className="search-bar">
          <button className="search-button">🔍 Search</button>
          <input type="text" placeholder="Enter key word, name of job or company" className="search-input" />
        </div>

        {/* 🔹 Conditionally Render Buttons Based on User Role */}
        <div className="button-container">
          <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} />

          {userRole === "applicant" && (
            <button onClick={handleUploadClick} className="upload-button">
              Upload your CV
            </button>
          )}

          {userRole === "hirer" && (
            <Link to="/post-job">
              <button className="post-button">Post a Job</button>
            </Link>
          )}

          <div className="mail-icon">M</div>
        </div>
      </div>

      {/* 🔹 Profile Section (Dynamic) */}
      <div className="profile-section">
        {profileData ? (
          <>
            <img src={profileData.profileImage || gothie} alt="Profile" className="profile-image" />
            <h2 className="profile-name">{profileData.firstName} {profileData.lastName}</h2>
            <p className="profile-info">{profileData.about}</p>
            <div className={`badge ${userRole === "hirer" ? "hirer-badge" : "applicant-badge"}`}>
              {userRole === "hirer" ? "Hirer" : "Applicant"}
            </div>
          </>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>

      {/* 🔹 Recommended Jobs Section */}
      <div className="recommended-section">
        <h3 className="recommended-title">Recommended Jobs</h3>
        <div className="job-list">
          <div className="job-card">
            <img src={gothie} alt="Averardo Bank Teller" className="job-image" />
            <p className="job-title">Averardo Bank Teller</p>
          </div>
          <div className="job-card">
            <img src={blondie} alt="Software Engineer" className="job-image" />
            <p className="job-title">Software Engineer</p>
          </div>
          <div className="job-card">
            <img src={brunette} alt="Graphic Designer" className="job-image" />
            <p className="job-title">Graphic Designer</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
