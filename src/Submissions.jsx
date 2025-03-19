import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "../Styles/submissions.css";

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        const submissionData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || "Unknown User",
            pdfUrl: data.pdfUrl || "#",
            submittedAt: data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toLocaleString() : "No Date Available",
          };
        });
        setSubmissions(submissionData);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, []);

  return (
    <div className="submissions-container">
      <h1>📄 Job Applications</h1>
      <div className="submission-list">
        {submissions.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="submission-card">
              <div className="submission-info">
                <p><strong>Applicant ID:</strong> {sub.userId}</p>
                <p><strong>Submitted At:</strong> {sub.submittedAt}</p>
              </div>
              <a href={sub.pdfUrl} target="_blank" rel="noopener noreferrer" className="view-btn">
                View CV
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Submissions;
