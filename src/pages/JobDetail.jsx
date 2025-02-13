import { useState } from "react";
import { useParams } from "react-router-dom";
import "../Styles/stylehome.css"; // Keep existing styles if needed
import "../Styles/jobDetail.css"; // Import the new CSS file

const jobsData = [
  { id: 1, title: "Averardo Bank Teller", company: "Ragunna & Co.", location: "Ragunna City", salary: "Php500 - Php600/hr", summary: "Short job summary here", responsibilities: ["Responsibility 1", "Responsibility 2", "Responsibility 3"] },
  { id: 2, title: "Software Engineer", company: "Google", location: "Remote", salary: "Php1000 - Php1200/hr", summary: "Another job summary", responsibilities: ["Coding", "Testing", "Debugging"] },
  { id: 3, title: "Graphic Designer", company: "Canva", location: "Manila", salary: "Php800 - Php1000/hr", summary: "Design things", responsibilities: ["Illustration", "Branding", "Creativity"] },
];

const JobDetail = () => {
  const { id } = useParams();
  const [selectedJob, setSelectedJob] = useState(jobsData.find(job => job.id === parseInt(id)) || jobsData[0]);

  return (
    <div className="job-detail-container">
      {/* Job List Sidebar */}
      <div className="sidebar">
        {jobsData.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className={`job-item ${selectedJob.id === job.id ? "selected" : ""}`}
          >
            <h4 className="text-dark">{job.title}</h4>
            <p className="text-dark">{job.company} | {job.location}</p>
            <p className="salary">{job.salary}</p>
          </div>
        ))}
      </div>

      {/* Job Details Section */}
      <div className="detail-container">
        <div className="detail-header">
          <span className="time-tag">1 Day Ago</span>
        </div>
        <h2 className="text-dark">{selectedJob.title}</h2>
        <p className="text-dark"><strong>Company:</strong> {selectedJob.company}</p>
        <p className="text-dark"><strong>Location:</strong> {selectedJob.location}</p>
        <h3 className="text-dark">Job Summary</h3>
        <p className="text-dark">{selectedJob.summary}</p>
        
        <h3 className="text-dark">Responsibilities</h3>
        <ul>
          {selectedJob.responsibilities.map((resp, index) => (
            <li key={index} className="text-dark">{resp}</li>
          ))}
        </ul>

        <h3 className="text-dark">Base Pay Range</h3>
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
