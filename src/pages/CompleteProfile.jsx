import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import "../Styles/completeProfile.css";

const auth = getAuth();
const db = getFirestore();

const CompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.state?.editMode || false;

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    about: "",
    facebook: "",
    gmail: "",
    xLink: "",
    instagram: "",
    role: "applicant",
    profileImage: "",
    password: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        alert("You must be logged in to complete your profile.");
        navigate("/login");
      } else {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          setFormData((prev) => ({ ...prev, ...userDoc.data(), password: "" }));
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 700 * 1024) {
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
      await setDoc(
        doc(db, "Users", user.uid),
        {
          ...formData,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      if (formData.password && !isEditMode) {
        await updatePassword(user, formData.password);
      }

      alert("Profile updated successfully!");
      navigate("/home");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try again.");
    }
  };

  return (
    <div className="complete-profile-wrapper">
      <div className="complete-profile-container">
        <h1>{isEditMode ? "Edit Your Profile" : "Complete Your Profile"}</h1>

        <div className="complete-profile-pic-container">
          {formData.profileImage ? (
            <img
              src={formData.profileImage}
              alt="Profile"
              className="complete-profile-preview"
            />
          ) : (
            <p>No profile picture uploaded</p>
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <small>⚠️ Max file size: 700KB (Base64 storage limit)</small>
        </div>

        <label>First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />

        <label>Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />

        <label>About You</label>
        <textarea name="about" value={formData.about} onChange={handleChange} />

        <label>Facebook</label>
        <input
          type="text"
          name="facebook"
          value={formData.facebook}
          onChange={handleChange}
        />

        <label>Gmail</label>
        <input
          type="text"
          name="gmail"
          value={formData.gmail}
          onChange={handleChange}
        />

        <label>X (Twitter)</label>
        <input
          type="text"
          name="xLink"
          value={formData.xLink}
          onChange={handleChange}
        />

        <label>Instagram</label>
        <input
          type="text"
          name="instagram"
          value={formData.instagram}
          onChange={handleChange}
        />

        {!isEditMode && (
          <>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            <small>⚠️ Choose a secure password</small>
          </>
        )}

        {!isEditMode && (
          <>
            <label>Register as:</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="applicant">Applicant</option>
              <option value="hirer">Hirer</option>
            </select>
          </>
        )}

        <button onClick={handleSubmit}>
          {isEditMode ? "Update Profile" : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default CompleteProfile;

