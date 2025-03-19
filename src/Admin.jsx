import React from "react";
import "../Styles/Admin.css";

const Admin = () => {
  const users = [
    {
      id: 1,
      image: "https://example.com/image1.jpg", // Replace with actual image URL
      companyName: "",
      jobTitle: "",
      payRange: "",
      email: "",
      cause: "",
      borderColor: "red",
    },
    {
      id: 2,
      image: "https://example.com/image2.jpg", // Replace with actual image URL
      companyName: "",
      jobTitle: "",
      payRange: "",
      email: "",
      cause: "",
      borderColor: "green",
    },
  ];

  return (
    <div className="admin-container">
      <h2 className="admin-title">Account Activity Reports</h2>
      {users.map((user) => (
        <div
          key={user.id}
          className="user-card"
          style={{ borderColor: user.borderColor }}
        >
          <img src={user.image} alt="User" className="user-image" />
          <div className="user-info">
            <p><strong>Company Name:</strong> {user.companyName}</p>
            <p><strong>Job Title:</strong> {user.jobTitle}</p>
            <p><strong>Pay Range:</strong> {user.payRange}</p>
            <p><strong>Email:</strong> <input type="text" className="input-box" /></p>
            <p><strong>Cause:</strong> <input type="text" className="input-box" /></p>
          </div>
          <div className="action-buttons">
            <button className="green-btn"></button>
            <button className="red-btn"></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;
