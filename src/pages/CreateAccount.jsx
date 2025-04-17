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

const provider = new GoogleAuthProvider();

const CreateAccount = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

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
      alert("A verification email has been sent. Please verify it, then return to this page.");
  
      let retries = 0;
      const maxRetries = 20; // ~80 seconds if interval is 4000ms
  
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
  
          alert("✅ Email verified! Proceeding to complete your profile.");
          navigate("/complete-profile", { state: { password } });
        }
  
        if (++retries >= maxRetries) {
          clearInterval(checkVerification);
          alert("⏰ Email verification timed out. Please refresh and try again.");
        }
      }, 4000); // Check every 4 seconds
  
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message || "Registration failed!");
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
        alert("A verification email has been sent to your Google account. Please verify it before continuing.");
  
        let retries = 0;
        const maxRetries = 20; // ~80 seconds
  
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
  
            alert("✅ Email verified! Proceeding to complete your profile.");
            navigate("/complete-profile");
          }
  
          if (++retries >= maxRetries) {
            clearInterval(checkVerification);
            alert("⏰ Email verification timed out. Please refresh and try again.");
          }
        }, 4000); // every 4 seconds
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

        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default CreateAccount;
