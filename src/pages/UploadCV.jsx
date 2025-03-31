import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../Styles/UploadCV.css";

const UploadCV = ({ userId }) => {
  const [pdfLink, setPdfLink] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!pdfLink.startsWith("http")) {
      alert("Please enter a valid PDF URL.");
      return;
    }

    if (!userId) {
      alert("User ID is missing! Cannot upload.");
      return;
    }

    setUploading(true);

    try {
      await addDoc(collection(db, "submissions"), {
        userId,
        pdfUrl: pdfLink, // ✅ Store only the link
        submittedAt: serverTimestamp(),
      });

      alert("PDF link submitted successfully!");
      setPdfLink("");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploadcv-wrapper">
      <div className="uploadcv-card">
        <h2>Submit Your CV</h2>
        <p>
          Upload your CV to <strong>Google Drive</strong>, make it{" "}
          <strong>public</strong>, and paste the link below.
        </p>
  
        <div className="uploadcv-form">
          <input
            type="url"
            placeholder="Enter PDF link..."
            value={pdfLink}
            onChange={(e) => setPdfLink(e.target.value)}
            className="uploadcv-input"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="uploadcv-btn"
          >
            {uploading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );  
};

export default UploadCV;
