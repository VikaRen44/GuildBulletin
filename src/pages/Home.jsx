import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";
import { useParams } from "react-router-dom";


const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  

  const { id } = useParams(); // ✅ Detects if we are viewing a hirer's profile
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (id) {
      console.log("🌐 Navigating to /hirer/:id →", id);
  
      const fetchHirerProfile = async () => {
        const hirerRef = doc(db, "Users", id);
        const hirerSnap = await getDoc(hirerRef);
  
        if (hirerSnap.exists()) {
          console.log("✅ Hirer Data Found:", hirerSnap.data());
          setProfileData(hirerSnap.data()); // ✅ Sets hirer profile
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
  
          if (!id) { // ✅ Prevent overwriting hirer data
            setProfileData(data);
          }
  
          setUserRole(data.role);
  
          // ✅ Check for any notices (Only for hirers)
          if (data.role === "hirer" && data.statusStep && data.statusStep !== "none") {
            setNotice(data.statusStep);
          }
        }
      } else {
        setUser(null);
  
        if (!id) { // ✅ Only reset if not in hirer profile mode
          setProfileData(null);
        }
  
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

  useEffect(() => {
    if (!id && user) {
      // You're not in hirer mode, load logged-in user
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
  

   // ✅ Function to hide the popup but NOT change statusStep
   const handleCloseNotice = () => {
    setNotice(null);
  };

  if (id && profileData) {
    return (
      <>
        <Navbar />
        <div className="hirer-profile-container">
          <h2>{profileData.firstName} {profileData.lastName}'s Profile</h2>
          <img src={profileData.profileImage || "/default-profile.png"} alt="Profile" className="profile-image" />
          <p><strong>About:</strong> {profileData.about || "No description available."}</p>
          <p><strong>Email:</strong> {profileData.email}</p>
          <p><strong>Facebook:</strong> {profileData.facebook || "N/A"}</p>
          <p><strong>Instagram:</strong> {profileData.instagram || "N/A"}</p>
          <p><strong>X (Twitter):</strong> {profileData.xLink || "N/A"}</p>
  
          <button
            onClick={() => {
              setProfileData(null); // ✅ Reset profile data before navigating
              navigate("/home");    // ✅ Go to actual home
            }}
            className="back-button"
          >
            ⬅ Go Back
          </button>
        </div>
      </>
    );
  }

  const scrollCarousel = (direction) => {
    const container = document.getElementById("job-carousel");
    const scrollAmount = 320;
  
    if (container) {
      container.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
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
            <button onClick={handleCloseNotice} className="notice-button">Acknowledge</button>
          </div>
        </div>
      )}

<div className="page-wrapper">
      <div className="search-section">
        <div className="search-bar-container">
          <button className="search-button"  onClick={() => navigate(`/jobdetails?search=${encodeURIComponent(searchInput)}`)}>Search</button>
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

      {profileData && (
        <div className="profile-card">
          <div className="profile-image-container">
            <img src={profileData.profileImage || "/default-profile.png"} alt="Profile" className="profile-image" />

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

          <div className="profile-info-container">
            <h2 className="profile-name">
              {profileData.firstName} {profileData.lastName}
            </h2>

            
            {/* Divider line */}
            <div className="profile-divider" />
            
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
      {/* 🔹 Recommended Jobs Section - Carousel Version */}
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
                    <div className="job-overlay">
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
        InternItUp is a work application site developed for a useful group of LPU students as requirement for their course program, Software Engineering.
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
