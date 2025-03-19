import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "../Styles/submissions.css";

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        const submissionData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const userRef = doc(db, "users", data.userId);
            const jobRef = doc(db, "jobs", data.jobId);
            
            let applicantName = "Unknown User";
            let jobTitle = "Unknown Job";
            
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              applicantName = `${userData.firstName} ${userData.lastName}`;
            }

            const jobDoc = await getDoc(jobRef);
            if (jobDoc.exists()) {
              jobTitle = jobDoc.data().position;
            }

            return {
              id: docSnap.id,
              applicantName,
              jobTitle,
              pdfUrl: data.pdfUrl || "#",
              submittedAt: data.submittedAt 
                ? new Date(data.submittedAt.seconds * 1000).toLocaleString() 
                : "No Date Available",
            };
          })
        );

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
                <p><strong>Applicant:</strong> {sub.applicantName}</p>
                <p><strong>Job Title:</strong> {sub.jobTitle}</p>
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
