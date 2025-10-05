import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import "../Styles/UploadCV.css";
import AlertModal from "../components/AlertModal";

const PROFILE_JOB_ID = "__profile__"; // a sentinel id to store user's base CV in `submissions`

const UploadCV = () => {
  const auth = getAuth();
  const db = getFirestore();

  const [user, setUser] = useState(null);
  const [pdfLink, setPdfLink] = useState("");
  const [savedCvUrl, setSavedCvUrl] = useState("");   // display current saved link
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (msg) => setAlertMessage(msg);
  const closeAlert = () => setAlertMessage("");

  // Load current user and their saved CV link
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (!u) {
        setSavedCvUrl("");
        setPdfLink("");
        return;
      }
      try {
        const uRef = doc(db, "Users", u.uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const data = uSnap.data() || {};
          const link = data.cvUrl || data.resumeUrl || data.pdfUrl || "";
          setSavedCvUrl(link);
          // pre-fill the input with what we have
          setPdfLink(link || "");
        }

        // (Optional) also check if there’s an existing profile submission
        const qSub = query(
          collection(db, "submissions"),
          where("userId", "==", u.uid),
          where("jobId", "==", PROFILE_JOB_ID)
        );
        await getDocs(qSub); // we don’t need the data beyond existence here
      } catch {
        // ignore
      }
    });
    return () => unsub();
  }, [auth, db]);

  // Save to Users and upsert submissions(userId + "__profile__")
  const handleSave = async () => {
    if (!user) {
      showAlert("Please log in first.");
      return;
    }
    if (!pdfLink || !/^https?:\/\//i.test(pdfLink)) {
      showAlert("Please enter a valid public PDF URL (starting with http/https).");
      return;
    }

    setSaving(true);
    try {
      // 1) Save on the Users document
      const uRef = doc(db, "Users", user.uid);
      await updateDoc(uRef, { cvUrl: pdfLink });

      // 2) Upsert a profile CV record in submissions for auditing/admin
      const qSub = query(
        collection(db, "submissions"),
        where("userId", "==", user.uid),
        where("jobId", "==", PROFILE_JOB_ID)
      );
      const s = await getDocs(qSub);
      if (s.empty) {
        await addDoc(collection(db, "submissions"), {
          userId: user.uid,
          jobId: PROFILE_JOB_ID,
          pdfUrl: pdfLink,
          submittedAt: serverTimestamp(),
          type: "profileCv", // optional marker for admin tools
        });
      } else {
        // update the first matching doc
        const subId = s.docs[0].id;
        await setDoc(
          doc(db, "submissions", subId),
          {
            userId: user.uid,
            jobId: PROFILE_JOB_ID,
            pdfUrl: pdfLink,
            updatedAt: serverTimestamp(),
            type: "profileCv",
          },
          { merge: true }
        );
      }

      setSavedCvUrl(pdfLink);
      showAlert("Your CV link has been saved.");
    } catch (e) {
      console.error("CV save error:", e);
      showAlert("Could not save your CV link. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="uploadcv-wrapper">
      <div className="uploadcv-card">
        <h2>Submit Your CV</h2>
        <p>
          Upload your CV to <strong>Google Drive</strong> (or similar), make it{" "}
          <strong>public</strong>, and paste the link below.
        </p>

        {/* current saved link */}
        <div className="uploadcv-current">
          <p><strong>Current CV link:</strong></p>
          {savedCvUrl ? (
            <p>
              <a href={savedCvUrl} target="_blank" rel="noreferrer">
                {savedCvUrl}
              </a>
            </p>
          ) : (
            <p style={{ opacity: 0.7 }}>No CV saved yet.</p>
          )}
        </div>

        <div className="uploadcv-form">
          <input
            type="url"
            placeholder="Enter public PDF link..."
            value={pdfLink}
            onChange={(e) => setPdfLink(e.target.value)}
            className="uploadcv-input"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="uploadcv-btn"
          >
            {saving ? "Saving..." : savedCvUrl ? "Update CV Link" : "Save CV Link"}
          </button>
        </div>

        <small style={{ display: "block", marginTop: 8, opacity: 0.7 }}>
          Tip: after saving, go to a job and click <em>Submit CV</em> to send this link to that listing.
        </small>
      </div>

      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
};

export default UploadCV;
