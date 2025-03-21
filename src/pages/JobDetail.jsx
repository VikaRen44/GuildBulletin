import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { useNavigate } from "react-router-dom"; 

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
  const [userRole, setUserRole] = useState(""); // ✅ new state
  const reportOptions = ["Scam", "Unresponsive", "Fake Listing", "Spam", "Others"];

  // ✅ Fetch user data and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserCv(user.uid);
        checkIfCvSubmitted(user.uid, id);

        // ✅ Get user role
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || "");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const fetchUserCv = async (userId) => {
    try {
      const submissionsRef = collection(db, "submissions");
      const querySnapshot = await getDocs(submissionsRef);
      let latestCv = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId && data.pdfUrl) {
          latestCv = data.pdfUrl;
        }
      });
      if (latestCv) setCvLink(latestCv);
    } catch (error) {
      console.error("Error fetching CV:", error);
    }
  };

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

  const checkIfCvSubmitted = async (userId, jobId) => {
    try {
      const submissionRef = collection(db, "submissions");
      const submissionDocs = await getDocs(submissionRef);

      const hasSubmitted = submissionDocs.docs.some((docSnap) => {
        const data = docSnap.data();
        return data.userId === userId && data.jobId === jobId;
      });

      setCvSubmitted(hasSubmitted);
    } catch (error) {
      console.error("Error checking CV submission:", error);
    }
  };

  useEffect(() => {
    if (userId && selectedJob?.id) {
      checkIfCvSubmitted(userId, selectedJob.id);
    }
  }, [userId, selectedJob?.id]);

  const handleCvSubmit = async () => {
    if (!cvLink) {
      alert("You haven't uploaded a CV yet. Please upload one on the home page.");
      return;
    }
    if (!userId) {
      alert("You must be logged in to submit a CV.");
      return;
    }
    if (cvSubmitted) {
      alert("You've already submitted a CV for this job.");
      return;
    }

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
      alert("Submission failed. Try again.");
    }
  };

  const handleLike = async (jobId) => {
    if (!userId) {
      alert("You must be logged in to like a job.");
      return;
    }

    const jobRef = doc(db, "jobs", jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return;

    const jobData = jobDoc.data();
    const hirerId = jobData.hirerId;

    await updateDoc(jobRef, {
      likes: (jobData.likes || 0) + 1,
    });

    const hirerRef = doc(db, "users", hirerId);
    const hirerDoc = await getDoc(hirerRef);
    if (hirerDoc.exists()) {
      await updateDoc(hirerRef, {
        totalLikes: (hirerDoc.data().totalLikes || 0) + 1,
      });
    }

    alert("Job liked successfully!");
  };

  const handleReportSubmit = async (jobId) => {
    if (!reportReasons[jobId] || reportReasons[jobId].length === 0) {
      alert("Please select at least one reason.");
      return;
    }

    const jobRef = doc(db, "jobs", jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return;

    const jobData = jobDoc.data();
    const hirerId = jobData.hirerId;

    await addDoc(collection(db, "reports"), {
      jobId,
      hirerId,
      reportedBy: userId,
      reasons: reportReasons[jobId],
      submittedAt: new Date(),
    });

    alert("Report submitted successfully!");
    setReportOpenJobs(null);
  };

  const toggleReportPopup = (jobId) => {
    setReportOpenJobs((prev) => (prev === jobId ? null : jobId));
  };


  

  return (
    <div className="job-detail-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>All Jobs</h3>
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className={`job-item ${selectedJob?.id === job.id ? "selected" : ""}`}
          >
            <h4>{job.position}</h4>
            <p>{job.companyName}</p>
            <p>{job.location}</p>
            <p className="salary">Php {job.salary.toLocaleString()}</p>
          </div>
        ))}
      </div>

    {/* Job Details */}
{selectedJob && (
   <div className="detail-container">
          <h2>{selectedJob.position}</h2>
          <p><strong>Company:</strong> {selectedJob.companyName}</p>
          <p><strong>Location:</strong> {selectedJob.location}</p>

          {/* ✅ Clickable Hirer Account */}
          <p>
  <strong>Hirer Account:</strong>{" "}
  <span
    className="hirer-link"
    onClick={() => {navigate(`/hirer/${selectedJob?.hirerId}`); // ✅ Pass only the hirerId
    }}
    style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
  >
    View Profile
  </span>
</p>



          <h3>Job Summary</h3>
          <p>{selectedJob.description}</p>


    <h3>Base Pay Range</h3>
    <p className="salary">Php {selectedJob.salary.toLocaleString()}</p>

    {/* ✅ Submit CV - visible only to applicants */}
    {userRole === "applicant" && (
      <>
        <h3>Submit Your CV</h3>
        {cvSubmitted ? (
          <p>✅ CV already submitted for this job.</p>
        ) : (
          <>
            <p>Your pre-uploaded CV link:</p>
            <a href={cvLink} target="_blank" rel="noopener noreferrer">{cvLink}</a>
            <button className="apply-button" onClick={handleCvSubmit}>Submit CV</button>
          </>
        )}
      </>
    )}

    {/* ✅ Like & Report - hidden from admin */}
    {userRole !== "admin" && (
      <div className="button-container">
        <button className="like-button" onClick={() => handleLike(selectedJob.id)}>❤️ Like</button>
        <button className="report-button" onClick={() => toggleReportPopup(selectedJob.id)}>🚩 Report</button>
      </div>
    )}
  </div>
)}

      {/* Report Modal */}
      {reportOpenJobs && (
        <div className="report-modal">
          <div className="report-content">
            <h3>Report Job Listing</h3>
            <p>Select reasons for reporting this job.</p>
            {reportOptions.map((reason) => (
              <label key={reason} className="report-option">
                <input
                  type="checkbox"
                  checked={reportReasons[reportOpenJobs]?.includes(reason) || false}
                  onChange={() => {
                    setReportReasons((prev) => ({
                      ...prev,
                      [reportOpenJobs]: prev[reportOpenJobs]?.includes(reason)
                        ? prev[reportOpenJobs].filter((r) => r !== reason)
                        : [...(prev[reportOpenJobs] || []), reason],
                    }));
                  }}
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
