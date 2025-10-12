import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import "../Styles/auth-bg.css";
import "../Styles/register.css";

import AlertModal from "../components/AlertModal";
import googleLogo from "../assets/google.png";
import bg from "../assets/auth_bg1.jpg";          // ✅ background image

const provider = new GoogleAuthProvider();

const CreateAccount = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  const showAlert = (msg, cb = null) => { setAlertMessage(msg); setAlertCallback(() => cb); };
  const closeAlert = () => { setAlertMessage(""); if (typeof alertCallback === "function") alertCallback(); };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    try {
      const { email, password } = formData;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await sendEmailVerification(user);
      showAlert("A verification email has been sent. Please verify it, then return to this page.");
      setPendingUser(user);

      let retries = 0; const max = 20;
      const t = setInterval(async () => {
        await user.reload();
        const updated = auth.currentUser;

        if (updated?.emailVerified) {
          clearInterval(t);
          await setDoc(doc(db, "Users", updated.uid), {
            gmail: updated.email,
            verified: true,
            createdAt: serverTimestamp(),
          });
          showAlert("✅ Email verified! Proceeding to complete your profile.", () =>
            navigate("/complete-profile", { state: { password } })
          );
        }

        if (++retries >= max) {
          clearInterval(t);
          showAlert("⏰ Email verification timed out. Please refresh and try again.");
        }
      }, 4000);
    } catch (e) {
      console.error("Registration Error:", e);
      showAlert(e.message || "Registration failed!");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { user } = await signInWithPopup(auth, provider);
      const userRef = doc(db, "Users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await sendEmailVerification(user);
        showAlert("A verification email has been sent to your Google account. Please verify it before continuing.");
        setPendingUser(user);

        let retries = 0; const max = 20;
        const t = setInterval(async () => {
          await user.reload();
          const updated = auth.currentUser;
          if (updated?.emailVerified) {
            clearInterval(t);
            await setDoc(userRef, {
              gmail: updated.email,
              verified: true,
              createdAt: serverTimestamp(),
            });
            showAlert("✅ Email verified! Proceeding to complete your profile.", () =>
              navigate("/complete-profile")
            );
          }
          if (++retries >= max) {
            clearInterval(t);
            showAlert("⏰ Email verification timed out. Please refresh and try again.");
          }
        }, 4000);
      } else {
        navigate("/home");
      }
    } catch (e) {
      console.error("Google Sign-In Error:", e);
      showAlert(e.message || "Google sign-in failed!");
    }
  };

  return (
    // ✅ set CSS variable so auth-bg.css can read it
    <div className="auth-bg" style={{ "--auth-bg": `url(${bg})` }}>
      <div className="register-page">
        <div className="container">
          <h1>Create an Account</h1>

          <div className="reg-inputs">
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
          </div>

          <div className="reg-buttons">
            <button className="register-btn" onClick={handleRegister}>Register</button>
            <button className="google-btn" onClick={handleGoogleSignUp}>
              <img src={googleLogo} alt="Google" className="google-icon" />
              Register with Google
            </button>
          </div>

          {pendingUser && (
            <p style={{ marginTop: "1rem", color: "#ccc", fontStyle: "italic" }}>
              ⏳ Waiting for email verification...
            </p>
          )}

          <p>Already have an account? <a href="/login">Login</a></p>
        </div>

        <AlertModal message={alertMessage} onClose={closeAlert} />
      </div>
    </div>
  );
};

export default CreateAccount;
