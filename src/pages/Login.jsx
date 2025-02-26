import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, getDoc, serverTimestamp 
} from "firebase/firestore";
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

function LoginRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("applicant"); // Default role is "applicant"
  const navigate = useNavigate();

  // 🔹 Register New User
  const handleRegister = async () => {
    try {
      // Ensure only 'applicant' and 'hirer' are valid roles
      if (role !== "applicant" && role !== "hirer") {
        alert("Invalid role selected!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Define user data
      const userData = {
        email: user.email,
        role: role, // Assign role
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "Users", user.uid), userData);

      alert("Registration successful!");
      navigate("/home");
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message);
    }
  };

  // 🔹 Login User with Role Verification
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "Users", user.uid));

      if (userDoc.exists()) {
        alert("Login successful!");
        navigate("/home");
      } else {
        alert("User data not found.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Invalid credentials! Please try again.");
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
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Register as:</label>
          <select onChange={(e) => setRole(e.target.value)} value={role}>
            <option value="applicant">Applicant</option>
            <option value="hirer">Hirer</option>
          </select>
        </div>

        {/* 🔹 Buttons Section */}
        <div className="button-container">
          <button className="register-btn" onClick={handleRegister}>Register</button>
          <button className="login-btn" onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
