import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../Styles/jobdetail.css";
import { useLocation } from "react-router-dom";

const JobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [cvLink, setCvLink] = useState("");
  const [cvSubmitted, setCvSubmitted] = useState(false);
  const [reportOpenJobs, setReportOpenJobs] = useState(null);
  const [reportReasons, setReportReasons] = useState({});
  const [userRole, setUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [likedJobs, setLikedJobs] = useState({});
  const location = useLocation();
  const reportOptions = ["Scam", "Unresponsive", "Fake Listing", "Spam", "Others"];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search");
    if (query) setSearchTerm(query);
  }, [location.search]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserCv(user.uid);
        checkIfCvSubmitted(user.uid, id);
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role || "");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const fetchUserCv = async (userId) => {
    try {
      const snapshot = await getDocs(collection(db, "submissions"));
      let latestCv = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId && data.pdfUrl) latestCv = data.pdfUrl;
      });
      if (latestCv) setCvLink(latestCv);
    } catch (error) {
      console.error("Error fetching CV:", error);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      const snapshot = await getDocs(collection(db, "jobs"));
      const jobList = snapshot.docs.map((doc) => ({
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

  const checkIfCvSubmitted = async (userId, jobId) => {
    try {
      const snapshot = await getDocs(collection(db, "submissions"));
      const hasSubmitted = snapshot.docs.some(
        (docSnap) => docSnap.data().userId === userId && docSnap.data().jobId === jobId
      );
      setCvSubmitted(hasSubmitted);
    } catch (error) {
      console.error("Error checking CV submission:", error);
    }
  };

  useEffect(() => {
    if (userId && selectedJob?.id) checkIfCvSubmitted(userId, selectedJob.id);
  }, [userId, selectedJob?.id]);

  const handleCvSubmit = async () => {
    if (!cvLink) return alert("Please upload a CV first.");
    if (!userId) return alert("You must be logged in.");
    if (cvSubmitted) return alert("CV already submitted.");

    try {
      await addDoc(collection(db, "submissions"), {
        userId,
        jobId: selectedJob.id,
        pdfUrl: cvLink,
        submittedAt: new Date(),
      });
      alert("CV submitted successfully!");
      setCvSubmitted(true);
    } catch (error) {
      console.error("Error submitting CV:", error);
      alert("Submission failed.");
    }
  };

  const handleLike = async (jobId) => {
    if (!userId) return alert("You must be logged in to like.");
    if (likedJobs[jobId]) return alert("You've already liked this job.");

    const jobRef = doc(db, "jobs", jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) return;

    const jobData = jobSnap.data();
    await updateDoc(jobRef, {
      likes: (jobData.likes || 0) + 1,
    });

    const hirerRef = doc(db, "users", jobData.hirerId);
    const hirerSnap = await getDoc(hirerRef);
    if (hirerSnap.exists()) {
      await updateDoc(hirerRef, {
        totalLikes: (hirerSnap.data().totalLikes || 0) + 1,
      });
    }

    setLikedJobs((prev) => ({ ...prev, [jobId]: true }));
    alert("Job liked successfully!");
  };

  const handleReportSubmit = async (jobId) => {
    if (!reportReasons[jobId]?.length) return alert("Select at least one reason.");

    const jobDoc = await getDoc(doc(db, "jobs", jobId));
    if (!jobDoc.exists()) return;

    await addDoc(collection(db, "reports"), {
      jobId,
      hirerId: jobDoc.data().hirerId,
      reportedBy: userId,
      reasons: reportReasons[jobId],
      submittedAt: new Date(),
    });

    alert("Report submitted!");
    setReportOpenJobs(null);
  };

  const toggleReportPopup = (jobId) => {
    setReportOpenJobs((prev) => (prev === jobId ? null : jobId));
  };

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    return (
      job.position.toLowerCase().includes(term) ||
      job.companyName.toLowerCase().includes(term) ||
      job.location.toLowerCase().includes(term)
    );
  });

  return (
    <div className="job-detail-container">
      {/* 🔹 Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>All Jobs</h3>
          <input
            type="text"
            className="search-bar"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Scrollable Job List */}
        <div className="sidebar-job-list">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`job-item ${selectedJob?.id === job.id ? "selected" : ""}`}
              style={{
                backgroundImage: job.jobImage ? `url(${job.jobImage})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="job-overlay">
                <p>{job.companyName} | {job.location}</p>
                <h4>{job.position}</h4>
                <p className="salary">Php {job.salary.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 Job Details */}
      {selectedJob && (
        <div className="detail-container">
          <h2>{selectedJob.position}</h2>
          <p><strong>Company:</strong> {selectedJob.companyName}</p>
          <p><strong>Location:</strong> {selectedJob.location}</p>
          <p>
            <strong>Hirer Account:</strong>{" "}
            <span
              onClick={() => navigate(`/hirer/${selectedJob.hirerId}`)}
              style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
            >
              View Profile
            </span>
          </p>
          <h3>Job Summary</h3>
          <p>{selectedJob.description}</p>

          <h3>Base Pay Range</h3>
          <p className="salary">Php {selectedJob.salary.toLocaleString()}</p>

          {userRole === "applicant" && (
            <>
              <h3>Submit Your CV</h3>
              {cvSubmitted ? (
                <p>✅ CV already submitted.</p>
              ) : (
                <>
                  <p>Your pre-uploaded CV link:</p>
                  <a href={cvLink} target="_blank" rel="noopener noreferrer">{cvLink}</a>
                  <button className="apply-button" onClick={handleCvSubmit}>Submit CV</button>
                </>
              )}
            </>
          )}

          {userRole !== "admin" && (
            <div className="button-container">
              <button className={`like-button ${likedJobs[selectedJob.id] ? "liked" : ""}`} onClick={() => handleLike(selectedJob.id)}>
                ❤️ Like
              </button>
              <button className="report-button" onClick={() => toggleReportPopup(selectedJob.id)}>🚩 Report</button>
            </div>
          )}
        </div>
      )}

      {reportOpenJobs && (
        <div className="report-modal">
          <div className="report-content">
            <h3>Report Job Listing</h3>
            <p>Select reasons:</p>
            {reportOptions.map((reason) => (
              <label key={reason} className="report-option">
                <input
                  type="checkbox"
                  checked={reportReasons[reportOpenJobs]?.includes(reason) || false}
                  onChange={() =>
                    setReportReasons((prev) => ({
                      ...prev,
                      [reportOpenJobs]: prev[reportOpenJobs]?.includes(reason)
                        ? prev[reportOpenJobs].filter((r) => r !== reason)
                        : [...(prev[reportOpenJobs] || []), reason],
                    }))
                  }
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
