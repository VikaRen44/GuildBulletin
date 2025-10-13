import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import "../Styles/completeProfile.css";
import AlertModal from "../components/AlertModal"; // ✅ Custom modal for alerts

const auth = getAuth();
const db = getFirestore();

// --- simple inline SVG icons ---
const EyeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 5C6.5 5 2.5 9.2 1.3 10.7l-.3.4.3.4C2.5 13 6.5 17.2 12 17.2s9.5-4.2 10.7-5.7l.3-.4-.3-.4C21.5 9.2 17.5 5 12 5zm0 10.2c-2.5 0-4.6-2-4.6-4.6S9.5 6 12 6s4.6 2 4.6 4.6-2 4.6-4.6 4.6zm0-7.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z"/>
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M2.1 3.5 3.5 2.1 21.9 20.5 20.5 21.9 16.9 18.3c-1.5.6-3 .9-4.9.9-5.5 0-9.5-4.2-10.7-5.7l-.3-.4.3-.4c.8-1 2.5-2.9 5-4.3L2.1 3.5zm8.4 8.4 2 2a2.6 2.6 0 0 1-2-2zM12 6c1.8 0 3.2.5 4.5 1.2l-1.1 1.1A4.6 4.6 0 0 0 9.7 14l-1.1 1.1c.8.3 1.9.6 3.4.6 4.7 0 8.4-3.2 9.6-4.7l.3-.4-.3-.4C20.5 9.8 18 7.5 15 6.6l-1.1 1.1c-.5-.3-1.2-.7-1.9-.7z"/>
  </svg>
);

const CompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.state?.editMode || false;
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);

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

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const showAlert = (message, callback = null) => {
    setAlertMessage(message);
    setAlertCallback(() => callback);
  };
  const closeAlert = () => {
    setAlertMessage("");
    if (typeof alertCallback === "function") alertCallback();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        showAlert("You must be logged in to complete your profile.");
        navigate("/login");
      } else {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        const incomingPassword = location.state?.password || "";
        if (userDoc.exists()) {
          setFormData((prev) => ({
            ...prev,
            ...userDoc.data(),
            password: incomingPassword,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            password: incomingPassword,
          }));
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 700 * 1024) {
      showAlert("Image too large! Please use an image under 700KB.");
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

    // require matching passwords when creating (not edit mode)
    if (!isEditMode && formData.password !== confirmPassword) {
      showAlert("Passwords do not match. Please re-enter them.");
      return;
    }

    try {
      await setDoc(
        doc(db, "Users", user.uid),
        { ...formData, updatedAt: new Date() },
        { merge: true }
      );

      if (formData.password && !isEditMode) {
        await updatePassword(user, formData.password);
      }

      showAlert("Profile updated successfully!", () => navigate("/home"));
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert("Failed to update profile. Try again.");
    }
  };

  return (
    <div className="complete-profile-wrapper">
      <div className="complete-profile-container">
        <div className="button-h1">
          {isEditMode && (
            <button onClick={() => navigate("/home")} className="back-button">⬅</button>
          )}
          <h1>{isEditMode ? "Edit Your Profile" : "Complete Your Profile"}</h1>
        </div>

        <div className="complete-profile-pic-container">
          {formData.profileImage ? (
            <img src={formData.profileImage} alt="Profile" className="complete-profile-preview" />
          ) : (
            <p>No profile picture uploaded</p>
          )}
          <div className="choose-file">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <small>⚠️ Max file size: 700KB (Base64 storage limit)</small>
          </div>
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

        {!isEditMode && (
          <>
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <small>⚠️ Choose a secure password</small>

            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                title={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <small>Both passwords must match.</small>
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
      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
};

export default CompleteProfile;
