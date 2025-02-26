import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, GoogleAuthProvider,
  signInWithPopup, sendEmailVerification
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import "../Styles/register.css";

const firebaseConfig = { apiKey: "AIzaSyC8m_eWg8abbvi3P6YpqYpXS06wdTyFTug",
  authDomain: "account-979a1.firebaseapp.com",
  databaseURL: "https://account-979a1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "account-979a1",
  storageBucket: "account-979a1.firebasestorage.app",
  messagingSenderId: "846315698123",
  appId: "1:846315698123:web:d4376a0d4e28e473d8284e", };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const CreateAccount = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Register User with Email & Password
  const handleRegister = async () => {
    try {
      const { email, password } = formData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      alert("A verification email has been sent. Please check your inbox.");

      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        verified: false,
        createdAt: serverTimestamp(),
      });

      navigate("/complete-profile");
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message || "Registration failed!");
    }
  };

  // 🔹 Register with Google
  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          verified: user.emailVerified,
          createdAt: serverTimestamp(),
        });

        alert("Google Sign-In successful! Please complete your profile.");
        navigate("/complete-profile");
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(error.message || "Google sign-in failed!");
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <h1>Create an Account</h1>

        <label>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />

        <button onClick={handleRegister}>Register</button>
        <button onClick={handleGoogleSignUp}>Sign Up with Google</button>

        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default CreateAccount;
