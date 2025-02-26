import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "../Styles/login.css"; // Import CSS file

// 🔹 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8m_eWg8abbvi3P6YpqYpXS06wdTyFTug",
  authDomain: "account-979a1.firebaseapp.com",
  databaseURL: "https://account-979a1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "account-979a1",
  storageBucket: "account-979a1.firebasestorage.app",
  messagingSenderId: "846315698123",
  appId: "1:846315698123:web:d4376a0d4e28e473d8284e",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔹 Handle Login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Fetch User Role from Firestore
      const userDoc = await getDoc(doc(db, "Users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // 🔹 Redirect Based on Role
        if (userData.role === "hirer") {
          navigate("/hirer-dashboard");
        } else {
          navigate("/applicant-dashboard");
        }

        alert("Login successful!");
      } else {
        alert("User data not found in database.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.message || "Invalid credentials! Please try again.");
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
        </div>

        {/* 🔹 Redirect to Register */}
        <p>Don't have an account? <a href="/register">Create one</a></p>
      </div>
    </div>
  );
}

export default Login;
