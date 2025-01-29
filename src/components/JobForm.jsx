import { useState } from "react";

const JobForm = () => {
  const [job, setJob] = useState({
    companyName: "",
    employerName: "",
    location: "",
    position: "",
    salary: "",
    description: "",
  });

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Job Posted:", job);
    alert("Job Posted Successfully! (This will be saved in Firebase later)");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Post a Job</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.column}>
            <label>Company Name</label>
            <input type="text" name="companyName" onChange={handleChange} required />
          </div>
          <div style={styles.column}>
            <label>Employer Name</label>
            <input type="text" name="employerName" onChange={handleChange} required />
          </div>
        </div>

        <label>Location</label>
        <input type="text" name="location" onChange={handleChange} required />

        <label>Position</label>
        <input type="text" name="position" onChange={handleChange} required />

        <label>Offered Salary</label>
        <input type="text" name="salary" onChange={handleChange} required />

        <label>Job Description</label>
        <textarea name="description" placeholder="Job Summary, Job Responsibilities, etc..." onChange={handleChange} required></textarea>

        <button type="submit" style={styles.button}>Post Listing</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    width: "48%",
  },
  button: {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#E8A04C",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default JobForm;
