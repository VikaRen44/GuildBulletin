import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
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
const googleProvider = new GoogleAuthProvider();

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔹 Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User detected:", user);
        await handleUserRedirect(user);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Login with Email/Password
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Login successful:", user);
      await handleUserRedirect(user);
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.message || "Invalid credentials! Please try again.");
    }
  };

  // 🔹 Login with Google & Redirect to Complete Profile if Needed
  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      console.log("Google Login successful:", user);

      // 🔹 Check if user exists in Firestore
      const userRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // 🔹 New user, create Firestore document with default values
        await setDoc(userRef, {
          email: user.email,
          firstName: user.displayName ? user.displayName.split(" ")[0] : "",
          lastName: user.displayName ? user.displayName.split(" ")[1] || "" : "",
          profileImage: user.photoURL || "",
          role: "applicant", // Default role
          about: "",
          facebook: "",
          gmail: user.email,
          xLink: "",
          instagram: "",
        });

        // 🔹 Redirect to Complete Profile page
        console.log("Redirecting new user to Complete Profile...");
        navigate("/complete-profile");
      } else {
        // 🔹 Existing user, redirect based on role
        console.log("User exists, redirecting...");
        await handleUserRedirect(user);
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed. Try again.");
    }
  };

  // 🔹 Handle Redirect After Login
  const handleUserRedirect = async (user) => {
    try {
      console.log("Fetching user data...");
      const userDoc = await getDoc(doc(db, "Users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        // ✅ Store role and user ID in localStorage
        localStorage.setItem("role", userRole);
        localStorage.setItem("userId", user.uid);

        console.log("User Role:", userRole);
        navigateBasedOnRole(userRole);
      } else {
        alert("User data not found. Please complete your profile.");
        navigate("/complete-profile"); // Redirect if no profile data exists
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("Failed to fetch user data.");
    }
  };

  // 🔹 Function to Redirect Based on Role
  const navigateBasedOnRole = (role) => {
    console.log("Navigating based on role:", role);
    if (role === "admin") {
      navigate("/admin");
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
