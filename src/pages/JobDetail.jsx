import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; 
import "../Styles/jobdetail.css";

const JobDetail = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedJobs, setLikedJobs] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [reportOpenJobs, setReportOpenJobs] = useState(null);
  const [reportReasons, setReportReasons] = useState({});
  const reportOptions = ["Scam", "Unresponsive", "Fake Listing", "Spam", "Others"];

  // ✅ Detect user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchLikedJobs(user.uid);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch liked jobs from Firestore for the logged-in user
  const fetchLikedJobs = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setLikedJobs(new Set(userDoc.data().likedJobs || []));
      }
    } catch (error) {
      console.error("Error fetching liked jobs:", error);
    }
  };

  // ✅ Fetch jobs from Firestore
  useEffect(() => {
    const fetchJobs = async () => {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const jobList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobList);

      const foundJob = jobList.find((job) => job.id === id) || jobList[0];
      setSelectedJob(foundJob);
      setLoading(false);
    };

    fetchJobs();
  }, [id]);

  // ✅ Update filtered jobs based on search term
  useEffect(() => {
    setFilteredJobs(
      jobs.filter((job) =>
        job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, jobs]);

  if (loading || authLoading) return <p>Loading job details...</p>;

  // ✅ Like Button Toggle (Per Job & Persistent)
  const handleLike = async (jobId) => {
    if (!userId) {
      alert("You must be logged in to like a job.");
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const updatedLikes = new Set(likedJobs);

    if (likedJobs.has(jobId)) {
      updatedLikes.delete(jobId);
    } else {
      updatedLikes.add(jobId);
    }

    setLikedJobs(updatedLikes);

    // Update Firestore
    try {
      await setDoc(userDocRef, { likedJobs: Array.from(updatedLikes) }, { merge: true });
    } catch (error) {
      console.error("Error updating liked jobs:", error);
    }
  };

  // ✅ Toggle Report Popup (Per Job)
  const toggleReportPopup = (jobId) => {
    setReportOpenJobs((prev) => (prev === jobId ? null : jobId));
  };

  // ✅ Handle Report Reason Selection
  const handleReportReasonChange = (jobId, reason) => {
    setReportReasons((prev) => {
      const updatedReasons = prev[jobId] ? [...prev[jobId]] : [];
      if (updatedReasons.includes(reason)) {
        updatedReasons.splice(updatedReasons.indexOf(reason), 1);
      } else {
        updatedReasons.push(reason);
      }
      return { ...prev, [jobId]: updatedReasons };
    });
  };

  // ✅ Handle Report Submission
  const handleReportSubmit = (jobId) => {
    if (!reportReasons[jobId] || reportReasons[jobId].length === 0) {
      alert("Please select at least one reason.");
      return;
    }

    console.log(`Reported Issues for Job ID ${jobId}:`, reportReasons[jobId]);
    alert("Your report has been submitted.");

    // Close modal after submission
    setReportOpenJobs(null);

    // Clear reasons after submission
    setReportReasons((prev) => ({
      ...prev,
      [jobId]: [],
    }));
  };

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
            style={{
              backgroundImage: job.jobImage ? `url(${job.jobImage})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Overlay for Readability */}
            <div className="job-overlay"></div>

            {/* Job Info */}
            <h4>{job.position}</h4>
            <p>{job.companyName} | {job.location}</p>
            <p className="salary">Php {job.salary.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {selectedJob && (
        <div className="detail-container">
          <div className="detail-header">
            <span className="time-tag">Posted recently</span>
          </div>

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

          {/* BUTTONS ROW */}
          <div className="button-container single-row">
            <button
              className={`like-button ${likedJobs.has(selectedJob.id) ? "liked" : ""}`}
              onClick={() => handleLike(selectedJob.id)}
            >
              {likedJobs.has(selectedJob.id) ? "❤️ Liked" : "🤍 Like"}
            </button>
            <button className="report-button" onClick={() => toggleReportPopup(selectedJob.id)}>
              🚩 Report
            </button>
            <button className="apply-button">Submit CV</button>
          </div>
        </div>
      )}

      {/* Report Modal (Integrated Correctly) */}
      {reportOpenJobs && (
        <div className="report-modal">
          <div className="report-content">
            <h3>Report Job Listing</h3>
            <p>Select the reasons for reporting this job.</p>

            {reportOptions.map((reason) => (
              <label key={reason} className="report-option">
                <input
                  type="checkbox"
                  checked={reportReasons[reportOpenJobs]?.includes(reason) || false}
                  onChange={() => handleReportReasonChange(reportOpenJobs, reason)}
                />
                {reason}
              </label>
            ))}

            <div className="report-buttons">
              <button onClick={() => handleReportSubmit(reportOpenJobs)}>Submit Report</button>
              <button onClick={() => setReportOpenJobs(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
