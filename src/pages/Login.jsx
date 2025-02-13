import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  getFirestore, doc, setDoc, getDoc, serverTimestamp 
} from "firebase/firestore";

// 🔹 Firebase Configuration (Replace with your own project settings)
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
  const [role, setRole] = useState("applicant");
  const navigate = useNavigate();

  // 🔹 Register New User
  const handleRegister = async () => {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user details in Firestore
      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        role: role,
        createdAt: serverTimestamp(),
      });

      localStorage.setItem("userRole", role);
      alert("Registration successful!");
      navigate("/home"); // Redirect after registration
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message);
    }
  };

  // 🔹 Login User
  const handleLogin = async () => {
    try {
      // Sign in user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Retrieve user role from Firestore
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        localStorage.setItem("userRole", userRole);
        alert("Login successful!");
        navigate("/home"); // Redirect after login
      } else {
        alert("User data not found.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Invalid credentials! Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Account Management</h1>
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <br />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <br />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="applicant">Applicant</option>
        <option value="hire">Hire</option>
        <option value="admin">Admin</option>
      </select>
      <br />
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginRegister;
