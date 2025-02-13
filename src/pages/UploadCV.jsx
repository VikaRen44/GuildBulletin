import React from "react";

const UploadCV = () => {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Upload Your CV</h2>
      <p>Submit your resume to apply for job opportunities.</p>
      <input type="file" accept=".pdf, .doc, .docx" />
      <br />
      <button style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}>
        Upload CV
      </button>
    </div>
  );
};

export default UploadCV;
