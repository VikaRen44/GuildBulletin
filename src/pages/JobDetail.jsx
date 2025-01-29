import { useState } from "react";
import { useParams } from "react-router-dom";

const jobsData = [
  { id: 1, title: "Averardo Bank Teller", company: "Ragunna & Co.", location: "Ragunna City", salary: "Php500 - Php600/hr", summary: "Short job summary here", responsibilities: ["Responsibility 1", "Responsibility 2", "Responsibility 3"] },
  { id: 2, title: "Software Engineer", company: "Google", location: "Remote", salary: "Php1000 - Php1200/hr", summary: "Another job summary", responsibilities: ["Coding", "Testing", "Debugging"] },
  { id: 3, title: "Graphic Designer", company: "Canva", location: "Manila", salary: "Php800 - Php1000/hr", summary: "Design things", responsibilities: ["Illustration", "Branding", "Creativity"] },
  // Add more jobs here...
];

const JobDetail = () => {
  const { id } = useParams();
  const [selectedJob, setSelectedJob] = useState(jobsData.find(job => job.id === parseInt(id)) || jobsData[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = jobsData.slice(indexOfFirstJob, indexOfLastJob);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div style={styles.container}>
      {/* Left Sidebar - Job List */}
      <div style={styles.sidebar}>
        {currentJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            style={{ ...styles.jobItem, backgroundColor: selectedJob.id === job.id ? "#E8A04C" : "#f0f0f0" }}
          >
            <h4>{job.title}</h4>
            <p>{job.company} | {job.location}</p>
            <p style={styles.salary}>{job.salary}</p>
          </div>
        ))}

        {/* Pagination */}
        <div style={styles.pagination}>
          {Array.from({ length: Math.ceil(jobsData.length / jobsPerPage) }, (_, i) => (
            <button key={i} onClick={() => paginate(i + 1)} style={styles.pageButton}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Right Section - Job Details */}
      <div style={styles.detailContainer}>
        <h2>{selectedJob.title}</h2>
        <p><strong>Company:</strong> {selectedJob.company}</p>
        <p><strong>Location:</strong> {selectedJob.location}</p>
        <h3>Job Summary</h3>
        <p>{selectedJob.summary}</p>
        
        <h3>Responsibilities</h3>
        <ul>
          {selectedJob.responsibilities.map((resp, index) => (
            <li key={index}>{resp}</li>
          ))}
        </ul>

        <h3>Base Pay Range</h3>
        <p style={styles.salary}>{selectedJob.salary}</p>

        <button style={styles.applyButton}>Submit CV</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
  },
  sidebar: {
    width: "30%",
    overflowY: "scroll",
    borderRight: "1px solid #ddd",
    padding: "10px",
    backgroundColor: "#f9f9f9",
  },
  jobItem: {
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  salary: {
    fontWeight: "bold",
    color: "#E8A04C",
  },
  detailContainer: {
    width: "70%",
    padding: "20px",
  },
  applyButton: {
    backgroundColor: "#E8A04C",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: "10px",
  },
  pageButton: {
    margin: "5px",
    padding: "5px 10px",
    border: "none",
    cursor: "pointer",
  },
};

export default JobDetail;
