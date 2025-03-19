import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, addDoc } from "firebase/firestore";
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
  const [cvLink, setCvLink] = useState(""); // ✅ Fetch from Firestore
  const [cvSubmitted, setCvSubmitted] = useState(false); // ✅ Track if submitted

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserCv(user.uid); // ✅ Get user's uploaded CV link
        checkIfCvSubmitted(user.uid, id); // ✅ Check if already submitted
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

// ✅ Fetch CV from `submissions`, NOT `users`
const fetchUserCv = async (userId) => {
  try {
    const submissionsRef = collection(db, "submissions");
    const querySnapshot = await getDocs(submissionsRef);

    // 🔍 Find the latest submission for the user
    let latestCv = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId && data.pdfUrl) {
        latestCv = data.pdfUrl;
      }
    });

    if (latestCv) {
      setCvLink(latestCv); // ✅ Set the latest uploaded CV
    }
  } catch (error) {
    console.error("Error fetching CV:", error);
  }
};


  // ✅ Check if user already submitted a CV for this job
  const checkIfCvSubmitted = async (userId, jobId) => {
    try {
      const submissionRef = collection(db, "submissions");
      const submissionDocs = await getDocs(submissionRef);
      const hasSubmitted = submissionDocs.docs.some(
        (doc) => doc.data().userId === userId && doc.data().jobId === jobId
      );
      setCvSubmitted(hasSubmitted);
    } catch (error) {
      console.error("Error checking CV submission:", error);
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

  // ✅ Handle CV Submission (Using Preloaded Link)
  const handleCvSubmit = async () => {
    if (!cvLink) {
      alert("You haven't uploaded a CV yet. Please upload one in the home page.");
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
        pdfUrl: cvLink, // ✅ Use preloaded CV link
        submittedAt: new Date(),
      });

      alert("CV submitted successfully!");
      setCvSubmitted(true);
    } catch (error) {
      console.error("Error submitting CV:", error);
      alert("Submission failed. Try again.");
    }
  };

  return (
    <div className="job-detail-container">
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
            <div className="job-overlay"></div>
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

          {/* Submit CV Section */}
          <h3>Submit Your CV</h3>
          {cvSubmitted ? (
            <p>✅ CV already submitted for this job.</p>
          ) : (
            <>
              <p>Your pre-uploaded CV link:</p>
              <a href={cvLink} target="_blank" rel="noopener noreferrer">
                {cvLink}
              </a>
              <button className="apply-button" onClick={handleCvSubmit}>Submit CV</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetail;
