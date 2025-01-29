import React, { useRef } from "react";
import Navbar from "../components/Navbar"; // Import Navbar
import "./stylehome.css"; // Import styles
import gothie from "../assets/gothie.jpg";
import blondie from "../assets/blondie.jpg";
import brunette from "../assets/brunette.jpg";
import jstate from "../assets/jstate.jpg";


const Home = () => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <Navbar /> {/* Include Navbar */}
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1 className="logo">
            <span className="touch">Touch</span>
            <span className="grass">Grass</span>
            <span className="now">Now</span>
          </h1>
        </header>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <button className="search-button">🔍 Search</button>
            <input type="text" placeholder="Lights on or Lights off? SEXXXXXX" className="search-input" />
          </div>

          {/* Buttons Section */}
          <div className="button-container">
            <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} />
            <button onClick={handleUploadClick} className="upload-button">Upload your CV</button>
            <button className="post-button">Post a Job</button>
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

        {/* Recommended Jobs */}
        <div className="recommended-section">
          <h3 className="recommended-title">Recommended</h3>
          <div className="job-list">
            <div className="job-card">
            <img src={gothie} alt="Bank Teller" className="job-image" />
              <p className="job-title">Averardo Bank Teller</p>
            </div>
            <div className="job-card">
            <img src={blondie} alt="Bank Teller" className="job-image" />
              <p className="job-title">Averardo Bank Teller</p>
            </div>
            <div className="job-card">
            <img src={brunette} alt="Bank Teller" className="job-image" />
              <p className="job-title">Averardo Bank Teller</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
