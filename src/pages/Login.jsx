import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // ✅ Import Firebase
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../Styles/login.css"; // Import CSS file

const googleProvider = new GoogleAuthProvider(); // 🔹 Google Auth Provider

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔹 Handle Email/Password Login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await handleUserRedirect(user);
    } catch (error) {
      console.error("❌ Login Error:", error);
      alert(error.message || "Invalid credentials! Please try again.");
    }
  };

  // 🔹 Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
  
      // 🔹 Check if user exists in Firestore
      const userRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userRef);
  
      if (!userDoc.exists()) {
        // ❌ User is NOT registered → Redirect to CreateAccount.jsx
        alert("No account found. Please create an account first.");
        navigate("/register"); // Redirect to your registration page
        return;
      }
  
      const userData = userDoc.data();
  
      // 🔹 Store role in localStorage
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userId", user.uid);
      window.dispatchEvent(new Event("storage")); // Notify other components

      // ✅ Redirect user based on role
      redirectUser(userData.role);
      
      alert("Login successful!");
    } catch (error) {
      console.error("❌ Google Login Error:", error);
      alert("Google Login Failed. Try again.");
    }
  };

  // 🔹 Handle Redirect After Login
  const handleUserRedirect = async (user) => {
    const userDoc = await getDoc(doc(db, "Users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userRole = userData.role;

      // 🔹 Store role in localStorage for persistence
      localStorage.setItem("userRole", userRole); // ✅ Fixed key name
      localStorage.setItem("userId", user.uid);
      window.dispatchEvent(new Event("storage")); // Notify other components

      // 🔹 Redirect Based on Role
      redirectUser(userRole);
      alert("Login successful!");
    } else {
      alert("User data not found in database.");
    }
  };

  // 🔹 Redirect User Based on Role
  const redirectUser = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "hirer") {
      navigate("/post-job");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <h1 className="title">Touch Grass Now</h1>
        <p className="subtitle">Get Jobs, <i>Touch Grass</i></p>

        {/* 🔹 Inputs Section */}
        <div className="input-container">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* 🔹 Buttons Section */}
        <div className="button-container">
          <button className="login-btn" onClick={handleLogin}>Login</button>
          <button className="google-btn" onClick={handleGoogleLogin}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png" alt="Google Logo" style={{ width: "20px", marginRight: "10px" }} />
            Sign in with Google
          </button>
        </div>

        {/* 🔹 Redirect to Register */}
        <p>Don't have an account? <a href="/register">Create one</a></p>
      </div>
    </div>
  );
}

export default Login;
