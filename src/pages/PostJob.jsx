import { useState } from "react";
import "./stylehome.css"; // Import styles

const JobForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    employerName: "",
    location: "",
    position: "",
    salary: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Job Posted:", formData);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h1 style={styles.header}>Post a New Job</h1>
      </div>
      <div style={styles.formContainer}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.row}>
            <input 
              type="text" 
              name="companyName" 
              placeholder="Company Name" 
              value={formData.companyName} 
              onChange={handleChange} 
              style={styles.input} 
            />
            <input 
              type="text" 
              name="employerName" 
              placeholder="Employer Name" 
              value={formData.employerName} 
              onChange={handleChange} 
              style={styles.input} 
            />
          </div>
          <input 
            type="text" 
            name="location" 
            placeholder="Location" 
            value={formData.location} 
            onChange={handleChange} 
            style={styles.fullInput} 
          />
          <input 
            type="text" 
            name="position" 
            placeholder="Position" 
            value={formData.position} 
            onChange={handleChange} 
            style={styles.fullInput} 
          />
          <input 
            type="text" 
            name="salary" 
            placeholder="Offered Salary" 
            value={formData.salary} 
            onChange={handleChange} 
            style={styles.fullInput} 
          />
          <textarea 
            name="description" 
            placeholder="Job Summary, Job Responsibilities, etc..." 
            value={formData.description} 
            onChange={handleChange} 
            style={styles.textArea} 
          />
          <button type="submit" style={styles.submitButton}>Post Listing</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f8f8f8",
    paddingTop: "80px", // ✅ Push content below fixed navbar
  },
  headerContainer: {
    width: "100%",
    backgroundColor: "#E8A04C",
    padding: "20px 0",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    width: "600px",
    marginTop: "20px", // ✅ Adds more space below navbar
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  input: {
    width: "48%",
    padding: "12px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#f0f0f0",
  },
  fullInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#f0f0f0",
  },
  textArea: {
    width: "100%",
    height: "180px",
    padding: "12px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#f0f0f0",
  },
  submitButton: {
    backgroundColor: "#E8A04C",
    color: "white",
    padding: "14px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    transition: "transform 0.2s ease-in-out",
  },
  "submitButton:hover": {
    transform: "scale(1.05)",
  },
};


export default JobForm;

