import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestores, doc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import gothie from "../assets/gothie.jpg";
import blondie from "../assets/blondie.jpg";
import brunette from "../assets/brunette.jpg";

const jobData = [
  { id: 1, title: "Averardo Bank Teller", image: gothie },
  { id: 2, title: "Software Engineer", image: blondie },
  { id: 3, title: "Graphic Designer", image: brunette },
];

const Home = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfileData(userSnap.data());
        }
      } else {
        setUser(null);
        setProfileData(null);
      }
    });
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

        {/* Profile Section */}
        <div className="profile-section">
          {profileData ? (
            <>
              <img src={profileData.profileImage || "default-profile.png"} alt="Profile" className="profile-image" />
              <h2 className="profile-name">{profileData.firstName} {profileData.lastName}</h2>
              <p className="profile-info">{profileData.about}</p>
              <div className="badge">{profileData.role === "hirer" ? "Hirer" : "Applicant"}</div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
