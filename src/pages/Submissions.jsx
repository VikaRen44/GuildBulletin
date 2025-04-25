import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "../Styles/submissions.css";

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "submissions"));

        const submissionData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // ✅ Ensure `userId` and `jobId` exist
            if (!data.userId || !data.jobId) {
              console.warn("⚠️ Skipping submission due to missing userId or jobId:", data);
              return null;
            }

            const userRef = doc(db, "Users", data.userId.trim());
            const jobRef = doc(db, "jobs", data.jobId.trim());

            let applicantName = "Unknown User";
            let userEmail = "Unknown Email";
            let profileImage = "";
            let jobTitle = "Unknown Job";
            let companyName = "Unknown Company";
            let jobLocation = "Unknown Location";
            let pdfUrl = data.pdfUrl || "#";
            let submittedAt = data.submittedAt
              ? new Date(data.submittedAt.seconds * 1000).toLocaleString()
              : "No Date Available";

            try {
              // ✅ Fetch `Users` data (First Name, Last Name, Email, Profile Image)
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log("✅ User Found:", userData); // Debugging
                applicantName = `${userData.firstName || "Unknown"} ${userData.lastName || "User"}`;
                userEmail = userData.gmail || "No Email Provided";
                profileImage = userData.profileImage || ""; // Store profile image URL
              } else {
                console.warn("⚠️ User document not found for userId:", data.userId);
              }

              // ✅ Fetch `Jobs` data (Job Title, Company Name, Location)
              const jobDoc = await getDoc(jobRef);
              if (jobDoc.exists()) {
                const jobData = jobDoc.data();
                jobTitle = jobData.position || "Unknown Job";
                companyName = jobData.companyName || "Unknown Company";
                jobLocation = jobData.location || "Unknown Location";
              } else {
                console.warn("⚠️ Job document not found for jobId:", data.jobId);
              }
            } catch (fetchError) {
              console.error("❌ Error fetching user or job details:", fetchError);
            }

            return {
              id: docSnap.id,
              applicantName,
              userEmail,
              profileImage,
              jobTitle,
              companyName,
              jobLocation,
              pdfUrl,
              submittedAt,
            };
          })
        );

        // ✅ Remove null values
        setSubmissions(submissionData.filter((sub) => sub !== null));
      } catch (error) {
        console.error("❌ Error fetching submissions:", error);
        setError("Failed to load submissions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  return (
    <div className="submissions-container">
      <h1> Job Applications</h1>

      {loading ? (
        <p className="loading">Loading submissions... ⏳</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="submission-list">
          {submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="submission-card">
                <div className="submission-info">
                  {/* ✅ Profile Image */}
                  <div className="profile-container">
                    {sub.profileImage ? (
                      <img src={sub.profileImage} alt="Profile" className="profile-pic" />
                    ) : (
                      <div className="profile-placeholder">👤</div>
                    )}
                  </div>

                  {/* ✅ Applicant Information */}
                  <p><strong>Applicant:</strong> {sub.applicantName}</p>
                  <p><strong>Email:</strong> {sub.userEmail}</p>
                  <p><strong>Job Title:</strong> {sub.jobTitle}</p>
                  <p><strong>Company:</strong> {sub.companyName}</p>
                  <p><strong>Location:</strong> {sub.jobLocation}</p>
                  <p><strong>Submitted At:</strong> {sub.submittedAt}</p>
                </div>
                <a href={sub.pdfUrl} target="_blank" rel="noopener noreferrer" className="view-btn">
                  View CV
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Submissions;
