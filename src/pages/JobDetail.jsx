import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "../Styles/jobdetail.css";

const JobDetail = () => {
  const { id } = useParams(); // Get job ID from URL
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from Firestore
  useEffect(() => {
    const fetchJobs = async () => {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const jobList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Firestore document ID
        ...doc.data(),
      }));
      setJobs(jobList);

      // Find the selected job based on URL id
      const foundJob = jobList.find((job) => job.id === id) || jobList[0];
      setSelectedJob(foundJob);
      setLoading(false);
    };

    fetchJobs();
  }, [id]);

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(
    (job) =>
      job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading job details...</p>;

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
            onClick={() => setSelectedJob(job)}
            className={`job-item ${selectedJob?.id === job.id ? "selected" : ""}`}
          >
            <h4>{job.position}</h4>
            <p>{job.companyName} | {job.location}</p>
            <p className="salary">Php {job.salary.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Job Details Section */}
      {selectedJob && (
        <div className="detail-container">
          <div className="detail-header">
            <span className="time-tag">Posted recently</span>
          </div>

          {/* Job Image (if available) */}
          {selectedJob.jobImage && (
            <img src={selectedJob.jobImage} alt="Job Image" className="job-image" />
          )}

          <h2>{selectedJob.position}</h2>
          <p><strong>Company:</strong> {selectedJob.companyName}</p>
          <p><strong>Location:</strong> {selectedJob.location}</p>

          <h3>Job Summary</h3>
          <p>{selectedJob.description}</p>

          <h3>Base Pay Range</h3>
          <div className="salary-box">
            <p className="salary">Php {selectedJob.salary.toLocaleString()}</p>
            <p className="location">{selectedJob.location}</p>
          </div>

          <div className="button-container">
            <button className="apply-button">Submit CV</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
