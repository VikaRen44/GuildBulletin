import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import gothie from "../assets/gothie.jpg";
import blondie from "../assets/blondie.jpg";
import brunette from "../assets/brunette.jpg";
import jstate from "../assets/jstate.jpg";

const jobData = [
  { id: 1, title: "Averardo Bank Teller", image: gothie },
  { id: 2, title: "Software Engineer", image: blondie },
  { id: 3, title: "Graphic Designer", image: brunette },
];

const Home = () => {
  const fileInputRef = useRef(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Retrieve user role from local storage
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role);
    }
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

        {/* Search & Buttons Section */}
        <div className="search-section">
          <div className="search-bar">
            <button className="search-button">🔍 Search</button>
            <input type="text" placeholder="Enter key word, name of job or company" className="search-input" />
          </div>

          {/* Conditionally Render Buttons Based on User Role */}
          <div className="button-container">
            <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} />

            {userRole === "applicant" && (
              <button onClick={handleUploadClick} className="upload-button">
                Upload your CV
              </button>
            )}

            {userRole === "hire" && (
              <button className="post-button">Post a Job</button>
            )}

            <div className="mail-icon">M</div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <img src={jstate} alt="Jay Statesman" className="profile-image" />
          <h2 className="profile-name">Jay Statesman</h2>
          <p className="profile-info">Starred in 25+ action films</p>
          <p className="profile-info">Proficient in stunt driving and parkour</p>
          <p className="profile-info">Strong public speaking skills</p>
          <p className="profile-info">Expert in hand-to-hand combat choreography</p>
          <div className="badge">Single father of 2 sweet girls</div>
        </div>

        {/* Recommended Jobs Section */}
        <div className="recommended-section">
          <h3 className="recommended-title">Recommended</h3>
          <div className="job-list">
            {jobData.map((job) => (
              <Link to={`/job/${job.id}`} key={job.id} className="job-card">
                <img src={job.image} alt={job.title} className="job-image" />
                <p className="job-title">{job.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;


