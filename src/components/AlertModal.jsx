import React from "react";
import "../Styles/alertModal.css"; // ✅ CSS file must exist

const AlertModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-box">
        <p>{message}</p>
        <button className="alert-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AlertModal;