import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import "../Styles/completeProfile.css";

const auth = getAuth();
const db = getFirestore();

const CompleteProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", about: "", facebook: "", gmail: "",
    xLink: "", instagram: "", role: "applicant", profileImage: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        alert("You must be logged in to complete your profile.");
        navigate("/login");
      } else {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          setFormData((prev) => ({ ...prev, ...userDoc.data() }));
        }
      }
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 700 * 1024) { // Limit file size (~700KB max)
      alert("Image too large! Please use an image under 700KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "Users", user.uid), {
        ...formData,
        updatedAt: new Date(),
      }, { merge: true });

      alert("Profile updated successfully!");
      navigate("/home");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try again.");
    }
  };

  return (
    <div className="complete-profile-page">
      <div className="container">
        <h1>Complete Your Profile</h1>

        {/* 🔹 Profile Picture Upload */}
        <div className="profile-pic-container">
          {formData.profileImage ? (
            <img src={formData.profileImage} alt="Profile" className="profile-preview" />
          ) : (
            <p>No profile picture uploaded</p>
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <small>⚠️ Max file size: 700KB (Base64 storage limit)</small>
        </div>

        <label>First Name</label>
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />

        <label>Last Name</label>
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />

        <label>About You</label>
        <textarea name="about" value={formData.about} onChange={handleChange} />

        <label>Facebook</label>
        <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} />

        <label>Gmail</label>
        <input type="text" name="gmail" value={formData.gmail} onChange={handleChange} />

        <label>X (Twitter)</label>
        <input type="text" name="xLink" value={formData.xLink} onChange={handleChange} />

        <label>Instagram</label>
        <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} />

        <label>Register as:</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="applicant">Applicant</option>
          <option value="hirer">Hirer</option>
        </select>

        <button onClick={handleSubmit}>Save Profile</button>
      </div>
    </div>
  );
};

export default CompleteProfile;
