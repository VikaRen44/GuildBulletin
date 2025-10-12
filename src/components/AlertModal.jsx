import React from "react";
import "../Styles/alertModal.css";

const AlertModal = ({ message, onClose }) => {
  if (!message) return null;

  // Replace technical Firebase messages with user-friendly text
  const formatMessage = (msg) => {
    if (msg.toLowerCase().includes("invalid-credential")) {
      return "Incorrect email or password.";
    }
    if (msg.toLowerCase().includes("user-not-found")) {
      return "No account found with this email.";
    }
    if (msg.toLowerCase().includes("wrong-password")) {
      return "Incorrect email or password.";
    }
    if (msg.toLowerCase().includes("network-request-failed")) {
      return "Network error. Please check your connection.";
    }
    return msg; // fallback for any other messages
  };

  return (
    <div className="alert-overlay">
      <div className="alert-box fixed-alert">
        <p className="alert-message">{formatMessage(message)}</p>
        <button className="alert-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
