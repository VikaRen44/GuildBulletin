import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // ✅ Import Firebase
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../Styles/login.css"; // Import CSS file
import googleLogo from "../assets/google.png";
import AlertModal from "../components/AlertModal"; // ✅ Import AlertModal

const googleProvider = new GoogleAuthProvider();

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState(""); // ✅ Modal state
  const [nextAction, setNextAction] = useState(null); // ✅ Optional callback after alert
  const navigate = useNavigate();

  const showAlert = (msg, callback = null) => {
    setAlertMessage(msg);
    setNextAction(() => callback);
  };

  const closeAlert = () => {
    setAlertMessage("");
    if (nextAction) nextAction();
  };

  // 🔹 Email/Password Login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (!userDoc.exists()) {
        showAlert("User data not found in database.");
        return;
      }

      const userData = userDoc.data();
      if (userData.banned) {
        await auth.signOut();
        showAlert("🚫 Your account has been banned. You cannot log in.");
        return;
      }

      await handleUserRedirect(user);
    } catch (error) {
      console.error("❌ Login Error:", error);
      showAlert(error.message || "Invalid credentials! Please try again.");
    }
  };

  // 🔹 Google Login
  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      const userRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        showAlert("No account found. Please create an account first.", () => navigate("/register"));
        return;
      }

      const userData = userDoc.data();
      if (userData.banned) {
        await auth.signOut();
        showAlert("🚫 Your account has been banned. You cannot log in.");
        return;
      }

      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userId", user.uid);
      window.dispatchEvent(new Event("storage"));

      showAlert("Login successful!", () => redirectUser(userData.role));
    } catch (error) {
      console.error("❌ Google Login Error:", error);
      showAlert("Google Login Failed. Try again.");
    }
  };

  // 🔹 Redirect Handler
  const handleUserRedirect = async (user) => {
    const userDoc = await getDoc(doc(db, "Users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userRole = userData.role;

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", user.uid);
      window.dispatchEvent(new Event("storage"));

      showAlert("Login successful!", () => redirectUser(userRole));
    } else {
      showAlert("User data not found in database.");
    }
  };

  const redirectUser = (role) => {
    navigate("/home");
  };

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="login-page">
      <div className="container">
        <h1 className="title">InternItUp</h1>
        <p className="subtitle">Get Jobs, <i>Touch Grass</i></p>

        {/* 🔹 Inputs Section */}
        <div className="input-container">
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

        {/* 🔹 Buttons Section */}
        <div className="button-container">
          <button className="login-btn" onClick={handleLogin}>Login</button>
          <button className="google-btn" onClick={handleGoogleLogin}>
            <img src={googleLogo} alt="Google Logo" style={{ width: "20px", marginRight: "10px" }} />
            Sign in with Google
          </button>
        </div>

        {/* 🔹 Redirect to Register */}
        <p>Don't have an account? <a href="/register">Create one</a></p>
      </div>

      {/* ✅ Alert Modal Renderer */}
      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
}

export default Login;