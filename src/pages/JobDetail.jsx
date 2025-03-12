import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Styles/jobdetail.css";

const jobsData = [
  { id: 1, title: "Averardo Bank Teller", company: "Ragunna & Co.", location: "Ragunna City", salary: "Php500 - Php600/hr", summary: "Short job summary here", responsibilities: ["Task 1", "Task 2", "Task 3"] },
  { id: 2, title: "Software Engineer", company: "Google", location: "Remote", salary: "Php1000 - Php1200/hr", summary: "Another job summary", responsibilities: ["Coding", "Testing", "Debugging"] },
  { id: 3, title: "Graphic Designer", company: "Canva", location: "Manila", salary: "Php800 - Php1000/hr", summary: "Design things", responsibilities: ["Illustration", "Branding", "Creativity"] },
];

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(jobsData.find(job => job.id === parseInt(id)) || jobsData[0]);

  // 🔹 Ensure job details update when URL changes
  useEffect(() => {
    const job = jobsData.find(job => job.id === parseInt(id));
    if (job) {
      setSelectedJob(job);
    }
  }, [id]);

  // 🔹 Filter jobs based on search input
  const filteredJobs = jobsData.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="job-detail-container">
      {/* Sidebar with Search and Job List */}
      <div className="sidebar">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => navigate(`/job/${job.id}`)} // 🔹 Updates URL when clicking a job
            className={`job-item ${selectedJob.id === job.id ? "selected" : ""}`}
          >
            <h4>{job.title}</h4>
            <p>{job.company} | {job.location}</p>
            <p className="salary">{job.salary}</p>
          </div>
        ))}
      </div>

      {/* Job Details Section */}
      <div className="detail-container">
        <div className="detail-header">
          <span className="time-tag">1 Day Ago</span>
        </div>
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
        <div className="salary-box">
          <p className="salary">{selectedJob.salary}</p>
          <p className="location">{selectedJob.location}</p>
        </div>

        <div className="button-container">
          <button className="apply-button">Submit CV</button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
