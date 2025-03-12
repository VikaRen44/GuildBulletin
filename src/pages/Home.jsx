import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";
import JobList from "../components/JobList";
import { useNavigate } from "react-router-dom"; // 🔹 Import useNavigate

const Home = () => {
  const navigate = useNavigate(); // 🔹 Hook for redirection
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    about: "",
    facebook: "",
    gmail: "",
    xLink: "",
    instagram: "",
    role: "applicant",
    profileImage: ""
  });

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
          setFormData(data); // Load user data for editing
        }
      } else {
        setUser(null);
        setProfileData(null);
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Handle Profile Update
  const handleSubmit = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "Users", user.uid),
        { ...formData, updatedAt: new Date() },
        { merge: true }
      );
      alert("Profile updated successfully!");
      setProfileData(formData); // Update local state
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try again.");
    }
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

      <div className="search-section">
        <div className="search-bar-container">
          <button className="search-button">Search</button>
          <div className="search-container">
            <input type="text" placeholder="Enter job title, company, or keyword" className="search-input" />
          </div>
        </div>

        {/* 🔹 Redirect to UploadCV page */}
        {userRole === "applicant" && (
          <div className="button-wrapper">
            <button onClick={() => navigate("/upload-cv")} className="upload-button">
              Upload CV
            </button>
          </div>
        )}

        {/* 🔹 Redirect to PostJob page */}
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

            {/* 🔹 Open Edit Form in a Modal */}
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

      <div className="recommended-section">
        <h3 className="recommended-title">Recommended Jobs</h3>
        <JobList />
      </div>
    </>
  );
};

export default Home;
