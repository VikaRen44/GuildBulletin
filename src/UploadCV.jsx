import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    <div className="upload-container">
      <h2>Submit Your CV</h2>
      <p>Upload your CV to **Google Drive**, make it **public**, and paste the link below.</p>
      <input
        type="url"
        placeholder="Enter PDF link..."
        value={pdfLink}
        onChange={(e) => setPdfLink(e.target.value)}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Submit"}
      </button>
    </div>
  );
};

export default UploadCV;
