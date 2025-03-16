import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
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

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

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
            <div className="badge">{profileData.role === "hirer" ? "Hirer" : "Applicant"}</div>
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

      {/* 🔹 Recommended Jobs Section (Now Dynamic) */}
      <div className="recommended-section">
        <h3 className="recommended-title">Recommended Jobs</h3>

        {loadingJobs ? (
          <p>Loading recommended jobs...</p>
        ) : recommendedJobs.length > 0 ? (
          <div className="job-list">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="job-item" onClick={() => navigate(`/job/${job.id}`)}>
                <h3>{job.position}</h3>
                <p>{job.companyName} | {job.location}</p>
                <p className="salary">Php {job.salary.toLocaleString()}</p>
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
