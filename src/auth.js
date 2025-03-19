import { auth, db } from "./firebase";  // Ensure correct path
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Register User
export const registerUser = async (email, password, role) => {
  try {
    // Register in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user details in Firestore (without password)
    await setDoc(doc(db, "users", user.uid), { email, role });

    return user;
  } catch (error) {
    console.error("Registration Error:", error.message);
    return null;
  }
};


// Login User
export const loginUser = async (email, password) => {
  try {
    // Firebase Authentication login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch the user's role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    } else {
      console.error("User role not found in Firestore!");
      return null;
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    return null;
  }
};


