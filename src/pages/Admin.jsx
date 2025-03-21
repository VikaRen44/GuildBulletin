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

        // Group reports by job ID
        const jobReportsMap = {};
        reportsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const { jobId, reasons } = data;

          if (!jobReportsMap[jobId]) {
            jobReportsMap[jobId] = { count: 0, reasons: {} };
          }

          jobReportsMap[jobId].count += 1;

          reasons.forEach((reason) => {
            jobReportsMap[jobId].reasons[reason] = (jobReportsMap[jobId].reasons[reason] || 0) + 1;
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
            let totalLikes = data.totalLikes || 0;
            const jobList = jobsSnapshot.docs.map((jobDoc) => {
              const jobId = jobDoc.id;
              const jobReports = jobReportsMap[jobId] || { count: 0, reasons: {} };

              totalReports += jobReports.count;

              return {
                id: jobId,
                position: jobDoc.data().position,
                likes: jobDoc.data().likes || 0,
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
              jobList,
              certified: data.certified || false,
              statusStep: data.statusStep || "none", // Step tracking (none, notice, deletion, ban)
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

  // **Step 1: Send Notice**
  const handleNotice = async (hirerId) => {
    try {
      const userRef = doc(db, "Users", hirerId);
      await updateDoc(userRef, { statusStep: "notice" });

      alert("Notice sent! The hirer will see it when they log in.");
    } catch (error) {
      console.error("Error updating notice:", error);
    }
  };

  // **Step 2: Delete All Jobs**
  const handleDeleteJobs = async (hirerId) => {
    try {
      const jobsRef = collection(db, "jobs");
      const jobQuery = query(jobsRef, where("hirerId", "==", hirerId));
      const jobsSnapshot = await getDocs(jobQuery);

      const deletePromises = jobsSnapshot.docs.map((jobDoc) => deleteDoc(jobDoc.ref));
      await Promise.all(deletePromises);

      const userRef = doc(db, "Users", hirerId);
      await updateDoc(userRef, { statusStep: "deletion" });

      alert("All jobs deleted. The hirer will see a notice.");
    } catch (error) {
      console.error("Error deleting jobs:", error);
    }
  };

  // **Step 3: Ban Account**
  const handleBanAccount = async (hirerId) => {
    try {
      const userRef = doc(db, "Users", hirerId);
      await updateDoc(userRef, { statusStep: "ban" });

      alert("Account banned! The hirer will see a ban message.");
    } catch (error) {
      console.error("Error banning account:", error);
    }
  };

  // **Reset process if like ratio improves above 50%**
  useEffect(() => {
    hirers.forEach(async (hirer) => {
      const likeRatio = hirer.totalLikes / Math.max(hirer.totalReports, 1);
      if (likeRatio > 0.5 && hirer.statusStep !== "none") {
        const userRef = doc(db, "Users", hirer.id);
        await updateDoc(userRef, { statusStep: "none" });
      }
    });
  }, [hirers]);

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
              <p><strong>Current Status:</strong> {hirer.statusStep.toUpperCase()}</p>

              {/* Show certification button */}
              {likeRatio >= 0.8 && !hirer.certified && (
                <button onClick={() => handleCertification(hirer.id)}>Grant Certification</button>
              )}

              {/* Step 1: Notice */}
              {hirer.statusStep === "none" && reportRatio >= 0.5 && (
                <button onClick={() => handleNotice(hirer.id)}>Send Notice</button>
              )}

              {/* Step 2: Delete Jobs */}
              {hirer.statusStep === "notice" && reportRatio >= 0.85 && (
                <button onClick={() => handleDeleteJobs(hirer.id)}>Delete All Jobs</button>
              )}

              {/* Step 3: Ban Account */}
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
