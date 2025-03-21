import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../Styles/admin.css";

const Admin = () => {
  const [hirers, setHirers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHirers = async () => {
      try {
        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("role", "==", "hirer"));
        const querySnapshot = await getDocs(q);
  
        // ✅ Fetch all reports from the 'reports' collection
        const reportsRef = collection(db, "reports");
        const reportsSnapshot = await getDocs(reportsRef);
  
        // ✅ Group reports by job ID
        const jobReportsMap = {};
        reportsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const { jobId, reasons } = data;
  
          if (!jobReportsMap[jobId]) {
            jobReportsMap[jobId] = {
              count: 0,
              reasons: { Scam: 0, Unresponsive: 0, "Fake Listing": 0, Spam: 0, Others: 0 },
            };
          }
  
          jobReportsMap[jobId].count += 1;
  
          // ✅ Count occurrences of each report type
          reasons.forEach((reason) => {
            if (jobReportsMap[jobId].reasons[reason] !== undefined) {
              jobReportsMap[jobId].reasons[reason] += 1;
            }
          });
        });
  
        const hirerData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const hirerId = docSnap.id;
  
            // ✅ Fetch jobs for this specific hirer
            const jobsRef = collection(db, "jobs");
            const jobQuery = query(jobsRef, where("hirerId", "==", hirerId));
            const jobsSnapshot = await getDocs(jobQuery);
  
            // ✅ Process each job and attach the correct reports
            let totalHirerReports = 0;
            const jobList = jobsSnapshot.docs.map((jobDoc) => {
              const jobId = jobDoc.id;
              const jobReports = jobReportsMap[jobId] || { count: 0, reasons: {} };
  
              totalHirerReports += jobReports.count; // ✅ Sum only this hirer's job reports
  
              return {
                id: jobId,
                position: jobDoc.data().position,
                likes: jobDoc.data().likes || 0,
                reports: jobReports.count, // ✅ Correct job-level report count
                reportDetails: jobReports.reasons, // ✅ Detailed report types
              };
            });
  
            return {
              id: hirerId,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              totalLikes: data.totalLikes || 0,
              totalReports: totalHirerReports, // ✅ Correct totalReports per hirer
              jobList,
            };
          })
        );
  
        setHirers(hirerData);
      } catch (error) {
        console.error("Error fetching hirers:", error);
        setError("Failed to load hirer data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchHirers();
  }, []);
  
  
  
  return (
    <div className="admin-container">
      <h1>Account Activity Reports</h1>

      {loading ? (
        <p>Loading data... ⏳</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        hirers.map((hirer) => (
          <div
            key={hirer.id}
            className="hirer-card"
            style={{
              borderColor:
                hirer.totalLikes >= 5 ? "green" : hirer.totalReports >= 3 ? "red" : "gray",
              borderWidth: "3px",
              borderStyle: "solid",
            }}
          >
            <h3>{hirer.firstName} {hirer.lastName}</h3>
            <p>Email: {hirer.email}</p>
            <p>Total Likes: {hirer.totalLikes} 👍</p>
            <p>Total Reports: {hirer.totalReports} 🚩</p>

            <h4>📌 Jobs Posted:</h4>
            {hirer.jobList.length > 0 ? (
  <ul>
    {hirer.jobList.map((job) => (
      <li key={job.id}>
        {job.position} - {job.likes} 👍 | {job.reports} 🚩
        
        {/* ✅ Show report details only if there are reports */}
        {job.reports > 0 && (
          <ul style={{ marginLeft: "20px", color: "red" }}>
            {Object.entries(job.reportDetails).map(([reason, count]) => 
              count > 0 ? <li key={reason}>{reason}: {count} 🚩</li> : null
            )}
          </ul>
        )}
      </li>
    ))}
  </ul>
) : (
  <p>No jobs posted.</p>
)}

          </div>
        ))
      )}
    </div>
  );
};

export default Admin;
