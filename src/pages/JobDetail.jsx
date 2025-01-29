import { useState } from "react";
import { useParams } from "react-router-dom";
import "./stylehome.css"; // Import styles

const jobsData = [
  { id: 1, title: "Averardo Bank Teller", company: "Ragunna & Co.", location: "Ragunna City", salary: "Php500 - Php600/hr", summary: "Short job summary here", responsibilities: ["Responsibility 1", "Responsibility 2", "Responsibility 3"] },
  { id: 2, title: "Software Engineer", company: "Google", location: "Remote", salary: "Php1000 - Php1200/hr", summary: "Another job summary", responsibilities: ["Coding", "Testing", "Debugging"] },
  { id: 3, title: "Graphic Designer", company: "Canva", location: "Manila", salary: "Php800 - Php1000/hr", summary: "Design things", responsibilities: ["Illustration", "Branding", "Creativity"] },
];

const JobDetail = () => {
  const { id } = useParams();
  const [selectedJob, setSelectedJob] = useState(jobsData.find(job => job.id === parseInt(id)) || jobsData[0]);

  return (
    <div style={styles.container}>
      {/* Job List Sidebar */}
      <div style={styles.sidebar}>
        {jobsData.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            style={{ ...styles.jobItem, backgroundColor: selectedJob.id === job.id ? "#FFE0B2" : "#FFF" }}
          >
            <h4 style={styles.textDark}>{job.title}</h4>
            <p style={styles.textDark}>{job.company} | {job.location}</p>
            <p style={styles.salary}>{job.salary}</p>
          </div>
        ))}
      </div>

      {/* Job Details Section */}
      <div style={styles.detailContainer}>
        <div style={styles.detailHeader}>
          <span style={styles.timeTag}>1 Day Ago</span>
        </div>
        <h2 style={styles.textDark}>{selectedJob.title}</h2>
        <p style={styles.textDark}><strong>Company:</strong> {selectedJob.company}</p>
        <p style={styles.textDark}><strong>Location:</strong> {selectedJob.location}</p>
        <h3 style={styles.textDark}>Job Summary</h3>
        <p style={styles.textDark}>{selectedJob.summary}</p>
        
        <h3 style={styles.textDark}>Responsibilities</h3>
        <ul>
          {selectedJob.responsibilities.map((resp, index) => (
            <li key={index} style={styles.textDark}>{resp}</li>
          ))}
        </ul>

        <h3 style={styles.textDark}>Base Pay Range</h3>
        <div style={styles.salaryBox}>
          <p style={styles.salary}>{selectedJob.salary}</p>
          <p style={styles.location}>{selectedJob.location}</p>
        </div>

        <div style={styles.buttonContainer}>
          <button style={styles.applyButton}>Submit CV</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    backgroundColor: "#FAFAFA",
    paddingTop: "80px", // ✅ Pushes content below the navbar
    minHeight: "100vh", // ✅ Ensures full-page height
    padding: "20px",
  },
  sidebar: {
    width: "30%",
    height: "calc(100vh - 100px)", // ✅ Prevents overlapping with navbar
    overflowY: "auto",
    backgroundColor: "#FFF",
    padding: "15px",
    borderRight: "1px solid #ddd",
    scrollbarWidth: "thin",
    msOverflowStyle: "none",
  },
  jobItem: {
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
    border: "1px solid #ddd",
  },
  textDark: {
    color: "#444",
  },
  salary: {
    fontWeight: "bold",
    color: "#E67E22",
  },
  detailContainer: {
    width: "70%",
    padding: "40px", // ✅ Increased padding for better spacing
    backgroundColor: "#FFF3E0",
    borderRadius: "8px",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "10px",
  },
  timeTag: {
    backgroundColor: "#FFA726",
    color: "#FFF",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "12px",
  },
  salaryBox: {
    backgroundColor: "#FFF",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #E67E22",
    marginBottom: "20px",
  },
  buttonContainer: {
    marginTop: "10px",
  },
  location: {
    color: "#777",
  },
  applyButton: {
    backgroundColor: "#E67E22",
    color: "white",
    padding: "12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
};


export default JobDetail;
