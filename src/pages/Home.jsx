import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, jobId } = useParams(); // 🔥 jobId included for dynamic return

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (id) {
      const fetchHirerProfile = async () => {
        const hirerRef = doc(db, "Users", id);
        const hirerSnap = await getDoc(hirerRef);

        if (hirerSnap.exists()) {
          setProfileData(hirerSnap.data());
        } else {
          console.error("❌ Hirer not found in Users collection");
        }
      };

      fetchHirerProfile();
    }
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (!id) setProfileData(data);
          setUserRole(data.role);

          if (data.role === "hirer" && data.statusStep && data.statusStep !== "none") {
            setNotice(data.statusStep);
          }
        }
      } else {
        setUser(null);
        if (!id) setProfileData(null);
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(10)); // 🔄 slight bump in limit to give room for filtering
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((job) => !job.frozen); // ✅ Exclude frozen jobs
  
      setRecommendedJobs(jobList.slice(0, 5)); // ✅ Keep only 5 visible
      setLoadingJobs(false);
    });
  
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    if (!id && user) {
      const fetchLoggedInUser = async () => {
        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfileData(userSnap.data());
        }
      };
      fetchLoggedInUser();
    }
  }, [id, user]);

  const handleCloseNotice = () => {
    setNotice(null);
  };

  const scrollCarousel = (direction) => {
    const container = document.getElementById("job-carousel");
    const scrollAmount = 320;
    if (container) {
      container.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  {/*View Hirer Profile*/}
  if (id && profileData) {
    return (
      <>
        <Navbar />
        <div className="hirer-profile-container">
          <h2>{profileData.firstName} {profileData.lastName}</h2>
          <div className="profile-image-wrapper">
            <img
              src={profileData.profileImage || "/default-profile.png"}
              alt="Profile"
              className={`profile-image ${profileData.role === "hirer" && profileData.certified ? "certified-border" : ""}`}
            />
            {profileData.role === "hirer" && profileData.certified && (
              <div className="verified-badge">✅ Verified</div>
            )}
          </div>
          <p className="about-profile"><strong>About:</strong> {profileData.about || "No description available."}</p>
          <div className="socials">
            <p><strong>Email:</strong> {profileData.gmail}</p>
            <p><strong>Facebook:</strong> {profileData.facebook || "N/A"}</p>
            <p><strong>Instagram:</strong> {profileData.instagram || "N/A"}</p>
            <p><strong>X (Twitter):</strong> {profileData.xLink || "N/A"}</p>
          </div>
          

          <button
            onClick={() => {
              setProfileData(null);
              navigate(jobId ? `/job/${jobId}` : "/home"); // ✅ Return to job if coming from one
            }}
            className="home-back-button"
          >
            ⬅ back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {notice && (
        <div className="notice-popup">
          <div className="notice-content">
            <h2>⚠ Important Notice</h2>
            {notice === "notice" && <p>🚨 Your job posts have received multiple reports. Please review and fix them.</p>}
            {notice === "deletion" && <p>⚠️ Your job posts have been <strong>deleted</strong> due to repeated reports.</p>}
            {notice === "ban" && <p>❌ Your account has been <strong>banned</strong> due to excessive reports.</p>}
            <button onClick={handleCloseNotice} className="notice-button">Acknowledge</button>
          </div>
        </div>
      )}

      <div className="page-wrapper">
        {/* 🔍 Search Section */}
        <div className="search-section">
          <div className="search-bar-container">
            <button className="search-button" onClick={() => navigate(`/jobdetails?search=${encodeURIComponent(searchInput)}`)}>Search</button>
            <div className="search-container">
              <input
                type="text"
                placeholder="Enter job title, company, or keyword"
                className="search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/jobdetails?search=${encodeURIComponent(searchInput)}`);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 👤 User Profile Card */}
        {profileData && (
          <div className="profile-card">
            <div className="profile-image-container">
              <img src={profileData.profileImage || "/default-profile.png"} alt="Profile" className="profile-image" />

              {userRole === "applicant" && (
                <div className="button-wrapper">
                  <button onClick={() => navigate("/upload-cv")} className="upload-button">Upload CV</button>
                </div>
              )}

              {userRole === "hirer" && (
                <div className="button-wrapper">
                  <button onClick={() => navigate("/post-job")} className="post-button">Post a Job</button>
                </div>
              )}
            </div>

            <div className="profile-info-container">
              <h2 className="profile-name">{profileData.firstName} {profileData.lastName}</h2>
              <div className="profile-divider" />
              <div className="badge">{profileData.role === "admin" ? "Admin" : profileData.role === "hirer" ? "Hirer" : "Applicant"}</div>
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

        {/* 💼 Recommended Jobs Carousel */}
        <div className="recommended-section">
          <h3 className="recommended-title">Recommended Jobs</h3>
          <div className="recommended-background">
            {loadingJobs ? (
              <p>Loading recommended jobs...</p>
            ) : recommendedJobs.length > 0 ? (
              <div className="carousel-wrapper">
                <button className="carousel-button left" onClick={() => scrollCarousel("left")}>←</button>
                <div className="carousel-track" id="job-carousel">
                  {recommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="job-card"
                      onClick={() => navigate(`/job/${job.id}`)}
                      style={{ backgroundImage: job.jobImage ? `url(${job.jobImage})` : "none" }}
                    >
                      <div className="job-overlay-home">
                        <h3>{job.position}</h3>
                        <p>{job.companyName} | {job.location}</p>
                        <p className="salary">Php {job.salary.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="carousel-button right" onClick={() => scrollCarousel("right")}>→</button>
              </div>
            ) : (
              <p>No jobs available at the moment.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-left">
            <p className="footer-title">Our Story</p>
            <p className="footer-text">
              InternItUp is a work application site developed for a useful group of LPU students as a requirement for their course program, Software Engineering.
            </p>
          </div>
          <div className="footer-right">
            <p><a href="#">Lyceum of Subic Bay, Inc.</a></p>
            <p><a href="#">LSB Official FB Page</a></p>
            <p><a href="#">LSB Pinnacle</a></p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
