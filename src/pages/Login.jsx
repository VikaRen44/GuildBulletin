import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import "../Styles/auth-bg.css";
import "../Styles/login.css";

import googleLogo from "../assets/google.png";
import bg from "../assets/auth_bg1.jpg";          // ✅ background image
import AlertModal from "../components/AlertModal";

const googleProvider = new GoogleAuthProvider();

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [nextAction, setNextAction] = useState(null);
  const navigate = useNavigate();

  const showAlert = (msg, cb = null) => { setAlertMessage(msg); setNextAction(() => cb); };
  const closeAlert = () => { setAlertMessage(""); if (nextAction) nextAction(); };

  const handleLogin = async () => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "Users", user.uid));
      if (!snap.exists()) return showAlert("User data not found in database.");

      const data = snap.data();
      if (data.banned) {
        await auth.signOut();
        return showAlert("🚫 Your account has been banned. You cannot log in.");
      }

      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", user.uid);
      window.dispatchEvent(new Event("storage"));
      showAlert("Login successful!", () => navigate("/home"));
    } catch (e) {
      console.error("❌ Login Error:", e);
      showAlert(e.message || "Invalid credentials! Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, "Users", user.uid));
      if (!snap.exists()) {
        return showAlert("No account found. Please create an account first.", () => navigate("/register"));
      }

      const data = snap.data();
      if (data.banned) {
        await auth.signOut();
        return showAlert("🚫 Your account has been banned. You cannot log in.");
      }

      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", user.uid);
      window.dispatchEvent(new Event("storage"));
      showAlert("Login successful!", () => navigate("/home"));
    } catch {
      showAlert("Google Login Failed. Try again.");
    }
  };

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onPop = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    // ✅ set CSS variable so auth-bg.css can read it
    <div className="auth-bg" style={{ "--auth-bg": `url(${bg})` }}>
      <div className="login-page">
        <div className="container">
          <h1 className="title">InternItUp</h1>
          <p className="subtitle">Get Jobs, <i>Touch Grass</i></p>

          <div className="login-inputs">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login_input"
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login_input"
            />
          </div>

          <div className="login-buttons">
            <button className="login-btn" onClick={handleLogin}>Login</button>
            <button className="google-btn" onClick={handleGoogleLogin}>
              <img src={googleLogo} alt="Google" className="google-icon" />
              Sign in with Google
            </button>
          </div>

          <p>Don't have an account? <a href="/register">Create one</a></p>
        </div>

        <AlertModal message={alertMessage} onClose={closeAlert} />
      </div>
    </div>
  );
}

export default Login;
