import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC8m_eWg8abbvi3P6YpqYpXS06wdTyFTug",
    authDomain: "account-979a1.firebaseapp.com",
    databaseURL: "https://account-979a1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "account-979a1",
    storageBucket: "account-979a1.firebasestorage.app",
    messagingSenderId: "846315698123",
    appId: "1:846315698123:web:d4376a0d4e28e473d8284e",
    measurementId: "G-JWRK40ECSE"
};

//  Prevent multiple initializations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

//  Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
