import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../Styles/register.css";
import AlertModal from "../components/AlertModal"; // ✅ Alert modal component added

const provider = new GoogleAuthProvider();

const CreateAccount = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  // ✅ Show and close alert modal
  const showAlert = (message, callback = null) => {
    setAlertMessage(message);
    setAlertCallback(() => callback);
  };

  const closeAlert = () => {
    setAlertMessage("");
    if (typeof alertCallback === "function") alertCallback();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Register using Email and Password
  const handleRegister = async () => {
    try {
      const { email, password } = formData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      showAlert("A verification email has been sent. Please verify it, then return to this page.");
      setPendingUser(user);

      let retries = 0;
      const maxRetries = 20;

      const checkVerification = setInterval(async () => {
        await user.reload();
        const updatedUser = auth.currentUser;

        if (updatedUser.emailVerified) {
          clearInterval(checkVerification);

          await setDoc(doc(db, "Users", updatedUser.uid), {
            gmail: updatedUser.email,
            verified: true,
            createdAt: serverTimestamp(),
          });

          showAlert("✅ Email verified! Proceeding to complete your profile.", () => {
            navigate("/complete-profile", { state: { password } });
          });
        }

        if (++retries >= maxRetries) {
          clearInterval(checkVerification);
          showAlert("⏰ Email verification timed out. Please refresh and try again.");
        }
      }, 4000);

    } catch (error) {
      console.error("Registration Error:", error);
      showAlert(error.message || "Registration failed!");
    }
  };

  // 🔹 Register using Google
  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await sendEmailVerification(user);
        showAlert("A verification email has been sent to your Google account. Please verify it before continuing.");
        setPendingUser(user);

        let retries = 0;
        const maxRetries = 20;

        const checkVerification = setInterval(async () => {
          await user.reload();
          const updatedUser = auth.currentUser;

          if (updatedUser.emailVerified) {
            clearInterval(checkVerification);

            await setDoc(userRef, {
              gmail: updatedUser.email,
              verified: true,
              createdAt: serverTimestamp(),
            });

            showAlert("✅ Email verified! Proceeding to complete your profile.", () => {
              navigate("/complete-profile");
            });
          }

          if (++retries >= maxRetries) {
            clearInterval(checkVerification);
            showAlert("⏰ Email verification timed out. Please refresh and try again.");
          }
        }, 4000);
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      showAlert(error.message || "Google sign-in failed!");
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <h1>Create an Account</h1>

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button onClick={handleRegister}>Register</button>
        <button onClick={handleGoogleSignUp}>Register with Google</button>

        {pendingUser && (
          <p style={{ marginTop: "1rem", color: "#ccc", fontStyle: "italic" }}>
            ⏳ Waiting for email verification...
          </p>
        )}

        <p>Already have an account? <a href="/login">Login</a></p>
      </div>

      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
};

export default CreateAccount;