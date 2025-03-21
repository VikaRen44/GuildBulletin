import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
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

        const reportsRef = collection(db, "reports");
        const reportsSnapshot = await getDocs(reportsRef);

        // 🔹 Group reports by job ID
        const jobReportsMap = {};
        reportsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const { jobId, reasons } = data;

          if (!jobReportsMap[jobId]) {
            jobReportsMap[jobId] = { count: 0, reasons: { Scam: 0, Unresponsive: 0, "Fake Listing": 0, Spam: 0, Others: 0 } };
          }

          jobReportsMap[jobId].count += 1;

          reasons.forEach((reason) => {
            jobReportsMap[jobId].reasons[reason] =
              (jobReportsMap[jobId].reasons[reason] || 0) + 1;
          });
        });

        const hirerData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const hirerId = docSnap.id;

            const jobsRef = collection(db, "jobs");
            const jobQuery = query(jobsRef, where("hirerId", "==", hirerId));
            const jobsSnapshot = await getDocs(jobQuery);

            let totalReports = 0;
            let totalLikes = 0;
            let totalJobs = jobsSnapshot.docs.length;

            const jobList = jobsSnapshot.docs.map((jobDoc) => {
              const jobId = jobDoc.id;
              const jobData = jobDoc.data();
              const jobReports = jobReportsMap[jobId] || { count: 0, reasons: { Scam: 0, Unresponsive: 0, "Fake Listing": 0, Spam: 0, Others: 0 } };

              totalReports += jobReports.count;
              totalLikes += jobData.likes || 0;

              return {
                id: jobId,
                position: jobData.position,
                likes: jobData.likes || 0,
                reports: jobReports.count,
                reportDetails: jobReports.reasons,
              };
            });

            return {
              id: hirerId,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              totalLikes,
              totalReports,
              totalJobs,
              jobList,
              certified: data.certified || false, // ✅ Existing certification status
              statusStep: data.statusStep || "none",
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

  // **✅ Grant Certification (Adds `certified: true` in Firestore)**
  const handleCertification = async (hirerId) => {
    try {
      const userRef = doc(db, "Users", hirerId);
      await updateDoc(userRef, { certified: true }); // ✅ Add certification field

      // ✅ Update state locally to reflect certification
      setHirers((prevHirers) =>
        prevHirers.map((hirer) =>
          hirer.id === hirerId ? { ...hirer, certified: true } : hirer
        )
      );

      alert("Certification granted!");
    } catch (error) {
      console.error("Error granting certification:", error);
    }
  };

  return (
    <div className="admin-container">
      <h1>Hirer Certification & Moderation</h1>

      {loading ? (
        <p>Loading data... ⏳</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        hirers.map((hirer) => {
          const likeRatio = hirer.totalLikes / Math.max(hirer.totalReports, 1);
          const reportRatio = hirer.totalReports / Math.max(hirer.totalLikes, 1);

          return (
            <div key={hirer.id} className="hirer-card" style={{ borderColor: hirer.certified ? "green" : "gray", borderWidth: "3px", borderStyle: "solid" }}>
              <h3>{hirer.firstName} {hirer.lastName}</h3>
              <p>Email: {hirer.email}</p>
              <p>Total Likes: {hirer.totalLikes} 👍</p>
              <p>Total Reports: {hirer.totalReports} 🚩</p>
              <p>Total Jobs Posted: {hirer.totalJobs}</p>
              <p><strong>Current Status:</strong> {hirer.statusStep.toUpperCase()}</p>

              {/* ✅ Job List with Report Breakdown */}
              {hirer.jobList.length > 0 ? (
                <ul>
                  {hirer.jobList.map((job) => (
                    <li key={job.id}>
                      <strong>{job.position}</strong> - {job.likes} 👍 | {job.reports} 🚩
                      {job.reports > 0 && (
                        <ul>
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

              {/* ✅ Certification & Moderation Buttons */}
              {likeRatio >= 0.8 && !hirer.certified && (
                <button onClick={() => handleCertification(hirer.id)}>Grant Certification</button>
              )}
              {hirer.statusStep === "none" && reportRatio >= 0.5 && (
                <button onClick={() => handleNotice(hirer.id)}>Send Notice</button>
              )}
              {hirer.statusStep === "notice" && reportRatio >= 0.85 && (
                <button onClick={() => handleDeleteJobs(hirer.id)}>Delete All Jobs</button>
              )}
              {hirer.statusStep === "deletion" && reportRatio >= 0.95 && (
                <button onClick={() => handleBanAccount(hirer.id)}>Ban Account</button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Admin;
