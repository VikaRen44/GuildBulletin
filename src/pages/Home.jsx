import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [notice, setNotice] = useState(null);

  const auth = getAuth();
  const db = getFirestore();

  // 🔹 Fetch user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setUserRole(data.role);

          // ✅ Check for any notices (Only for hirers)
          if (data.role === "hirer" && data.statusStep && data.statusStep !== "none") {
            setNotice(data.statusStep);
          }
        }
      } else {
        setUser(null);
        setProfileData(null);
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Fetch the latest 5 recommended jobs dynamically (real-time updates)
  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(5));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecommendedJobs(jobList);
      setLoadingJobs(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Function to acknowledge the notice and remove the popup
  const handleAcknowledgeNotice = async () => {
    if (user) {
      const userRef = doc(db, "Users", user.uid);
      await updateDoc(userRef, { statusStep: "none" });
      setNotice(null);
    }
  };

  return (
    <>
      <Navbar />

      {/* ✅ Notice Popup (Only for Hirers) */}
      {notice && (
        <div className="notice-popup">
          <div className="notice-content">
            <h2>⚠ Important Notice</h2>
            {notice === "notice" && <p>🚨 Your job posts have received multiple reports. Please review and fix them.</p>}
            {notice === "deletion" && <p>⚠️ Your job posts have been **deleted** due to repeated reports.</p>}
            {notice === "ban" && <p>❌ Your account has been **banned** due to excessive reports.</p>}
            <button onClick={handleAcknowledgeNotice} className="notice-button">Acknowledge</button>
          </div>
        </div>
      )}

      <div className="container">
        <header className="header">
          <h1 className="logo">
            <span className="touch">Touch</span>
            <span className="grass">Grass</span>
            <span className="now">Now</span>
          </h1>
        </header>
      </div>

      <div className="search-section">
        <div className="search-bar-container">
          <button className="search-button">Search</button>
          <div className="search-container">
            <input type="text" placeholder="Enter job title, company, or keyword" className="search-input" />
          </div>
        </div>

        {userRole === "applicant" && (
          <div className="button-wrapper">
            <button onClick={() => navigate("/upload-cv")} className="upload-button">
              Upload CV
            </button>
          </div>
        )}

        {userRole === "hirer" && (
          <div className="button-wrapper">
            <button onClick={() => navigate("/post-job")} className="post-button">
              Post a Job
            </button>
          </div>
        )}
      </div>

      {profileData && (
        <div className="profile-card">
          <div className="profile-image-container">
            <img src={profileData.profileImage || "/default-profile.png"} alt="Profile" className="profile-image" />
          </div>

          <div className="profile-info-container">
            <h2 className="profile-name">
              {profileData.firstName} {profileData.lastName}
            </h2>
            <div className="badge">
              {profileData.role === "admin"
                ? "Admin"
                : profileData.role === "hirer"
                ? "Hirer"
                : "Applicant"}
            </div>
            <p className="profile-info">{profileData.about}</p>

            <button onClick={() => navigate("/complete-profile", { state: { editMode: true } })} className="edit-profile">
              Edit Profile
            </button>
          </div>

          <div className="social-icons">
            <a href={profileData.gmail || "#"} aria-label="Gmail"><FaEnvelope className="icon" /></a>
            <a href={profileData.facebook || "#"} aria-label="Facebook"><FaFacebook className="icon" /></a>
            <a href={profileData.instagram || "#"} aria-label="Instagram"><FaInstagram className="icon" /></a>
            <a href={profileData.xLink || "#"} aria-label="Twitter"><FaTwitter className="icon" /></a>
          </div>
        </div>
      )}

      {/* 🔹 Recommended Jobs Section */}
      <div className="recommended-section">
        <h3 className="recommended-title">Recommended Jobs</h3>

        {loadingJobs ? (
          <p>Loading recommended jobs...</p>
        ) : recommendedJobs.length > 0 ? (
          <div className="job-list">
            {recommendedJobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => navigate(`/job/${job.id}`)}
                style={{ backgroundImage: job.jobImage ? `url(${job.jobImage})` : "none" }}
              >
                <div className="job-overlay">
                  <h3>{job.position}</h3>
                  <p>{job.companyName} | {job.location}</p>
                  <p className="salary">Php {job.salary.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No jobs available at the moment.</p>
        )}
      </div>
    </>
  );
};

export default Home;
