import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../Styles/UploadCV.css";
import AlertModal from "../components/AlertModal"; // ✅ Import modal

const UploadCV = ({ userId }) => {
  const [pdfLink, setPdfLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // ✅ Modal message state

  const showAlert = (msg) => setAlertMessage(msg);       // ✅ Show modal
  const closeAlert = () => setAlertMessage("");          // ✅ Hide modal

  const handleUpload = async () => {
    if (!pdfLink.startsWith("http")) {
      showAlert("Please enter a valid PDF URL."); // ✅ REPLACED
      return;
    }

    if (!userId) {
      showAlert("User ID is missing! Cannot upload."); // ✅ REPLACED
      return;
    }

    setUploading(true);

    try {
      await addDoc(collection(db, "submissions"), {
        userId,
        pdfUrl: pdfLink, // ✅ Store only the link
        submittedAt: serverTimestamp(),
      });

      showAlert("PDF link submitted successfully!"); // ✅ REPLACED
      setPdfLink("");
    } catch (error) {
      console.error("Upload error:", error);
      showAlert("Upload failed. Try again."); // ✅ REPLACED
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

      {/* ✅ Modal Renderer */}
      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
};

export default UploadCV;
