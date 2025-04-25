import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import "../Styles/admin.css";
import emailjs from "@emailjs/browser";
import AlertModal from "../components/AlertModal"; // ✅ Custom modal for alerts


const Admin = () => {
  const [hirers, setHirers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(null);
  const [alertMessage, setAlertMessage] = useState(""); // 🔔 Modal message
  const [alertCallback, setAlertCallback] = useState(null); // 🔁 Optional callback after closing

  const showAlert = (message, callback = null) => {
    setAlertMessage(message);
    setAlertCallback(() => callback);
  };
  
  const closeAlert = () => {
    setAlertMessage("");
    if (typeof alertCallback === "function") alertCallback();
  };
  


  useEffect(() => {
    const fetchHirers = async () => {
      try {
        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("role", "==", "hirer"));
        const querySnapshot = await getDocs(q);

        const reportsRef = collection(db, "reports");
        const reportsSnapshot = await getDocs(reportsRef);

        const jobReportsMap = {};

        await Promise.all(
          reportsSnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const { jobId, reasons, reportedBy } = data;

            if (!jobReportsMap[jobId]) {
              jobReportsMap[jobId] = {
                count: 0,
                reasons: { Scam: 0, Unresponsive: 0, "Fake Listing": 0, Spam: 0, Others: 0 },
                reporters: {},
              };
            }

            jobReportsMap[jobId].count += 1;

            let reporterEmail = "No email found";
            try {
              if (reportedBy) {
                const userRef = doc(db, "Users", reportedBy);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  reporterEmail =
                    (userData.email && userData.email.trim()) ||
                    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
                    "No email found";
                }
              }
            } catch (err) {
              console.warn("Failed to fetch reporter:", err);
            }

            reasons.forEach((reason) => {
              jobReportsMap[jobId].reasons[reason] =
                (jobReportsMap[jobId].reasons[reason] || 0) + 1;

              if (!Array.isArray(jobReportsMap[jobId].reporters[reason])) {
                jobReportsMap[jobId].reporters[reason] = [];
              }

              if (!jobReportsMap[jobId].reporters[reason].includes(reporterEmail)) {
                jobReportsMap[jobId].reporters[reason].push(reporterEmail);
              }
            });
          })
        );

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
              const jobReports = jobReportsMap[jobId] || {
                count: 0,
                reasons: { Scam: 0, Unresponsive: 0, "Fake Listing": 0, Spam: 0, Others: 0 },
                reporters: {},
              };

              totalReports += jobReports.count;
              totalLikes += jobData.likes || 0;

              return {
                id: jobId,
                position: jobData.position,
                likes: jobData.likes || 0,
                reports: jobReports.count,
                reportDetails: jobReports.reasons,
                reportsFrom: jobReports.reporters,
                frozen: jobData.frozen || false, // ✅ add frozen flag
              };
            });

            return {
              id: hirerId,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email || data.gmail || "",
              profilePicURL: data.profileImage || data.profilePicURL || "",
              totalLikes,
              totalReports,
              totalJobs,
              jobList,
              certified: data.certified || false,
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

  const handleCertification = async (hirerId) => {
    try {
      const userRef = doc(db, "Users", hirerId);
      await updateDoc(userRef, { certified: true });

      setHirers((prevHirers) =>
        prevHirers.map((hirer) =>
          hirer.id === hirerId ? { ...hirer, certified: true } : hirer
        )
      );

      showAlert("Certification granted!");
    } catch (error) {
      console.error("Error granting certification:", error);
    }
  };

  const handleNotice = async (hirerId) => {
    try {
      const hirer = hirers.find((h) => h.id === hirerId);
  
      // ⛔ Prevent sending if email is missing
      if (!hirer?.email || hirer.email.trim() === "") {
        showAlert("⚠️ This hirer has no email address on file.");
        return;
      }
  
      // Format report details
      const reportDetails = hirer.jobList
        .filter((job) => job.reports > 0)
        .map((job) => {
          const reasons = Object.entries(job.reportDetails)
            .filter(([_, count]) => count > 0)
            .map(([reason, count]) => `• ${reason}: ${count} report(s)`)
            .join("\n");
  
          return `🔹 Job Position: ${job.position}\n${reasons}`;
        })
        .join("\n\n");
  
      const noticeEmailContent = {
        to_email: hirer.email,
        to_name: `${hirer.firstName} ${hirer.lastName}`,
      };
  
      console.log("📧 Sending notice email with content:", noticeEmailContent);
  
      await emailjs.send(
        "service_4y9z6j9",         // ✅ Your EmailJS service ID
        "template_3grqprk",        // ✅ Your Template ID
        noticeEmailContent,        // ✅ Payload
        "ptcOjfNiUXksV1-v4"        // ✅ Your Public Key
      );
  
      showAlert("📨 Notice sent to hirer via email.");
    } catch (error) {
      console.error("❌ Failed to send notice email:", error);
      alert("❌ Failed to send notice email.");
    }
  }; 

  const handleFreezeJobs = async (hirerId) => {
    try {
      const hirer = hirers.find((h) => h.id === hirerId);

      if (!hirer?.email || hirer.email.trim() === "") {
        showAlert("⚠️ This hirer has no email address on file.");
        return;
      }

      const jobsRef = collection(db, "jobs");
      const jobQuery = query(jobsRef, where("hirerId", "==", hirerId));
      const jobSnapshot = await getDocs(jobQuery);

      const freezePromises = jobSnapshot.docs.map((jobDoc) => {
        const jobData = jobDoc.data();
        if (!jobData.frozen) {
          return updateDoc(doc(db, "jobs", jobDoc.id), { frozen: true });
        }
        return null;
      });

      await Promise.all(freezePromises.filter(Boolean));

      const freezeEmailContent = {
        to_email: hirer.email,
        to_name: `${hirer.firstName} ${hirer.lastName}`,
      };

      await emailjs.send(
        "service_4y9z6j9",
        "template_2znf28c",
        freezeEmailContent,
        "ptcOjfNiUXksV1-v4"
      );

      showAlert(`❄️ ${freezePromises.length} job(s) frozen and email sent.`);
    } catch (error) {
      console.error("❌ Failed to freeze jobs or send email:", error);
      alert("❌ Something went wrong freezing the jobs.");
    }
  };
  

  const handleUnfreezeJobs = async (hirerId) => {
    try {
      const hirer = hirers.find((h) => h.id === hirerId);
  
      if (!hirer?.email || hirer.email.trim() === "") {
        showAlert("⚠️ This hirer has no email address on file.");
        return;
      }
  
      const jobsRef = collection(db, "jobs");
      const jobQuery = query(jobsRef, where("hirerId", "==", hirerId));
      const jobSnapshot = await getDocs(jobQuery);
  
      const unfreezePromises = jobSnapshot.docs.map((jobDoc) =>
        updateDoc(doc(db, "jobs", jobDoc.id), { frozen: false })
      );
  
      await Promise.all(unfreezePromises);
  
      showAlert(`✅ Unfrozen ${unfreezePromises.length} job(s).`);
    } catch (error) {
      console.error("❌ Failed to unfreeze jobs:", error);
      alert("❌ Something went wrong unfreezing the jobs.");
    }
  };

  const handleBanAccount = async (hirerId) => {
    try {
      const userRef = doc(db, "Users", hirerId);
      await updateDoc(userRef, {
        banned: true,
        statusStep: "banned"
      });
  
      showAlert(`🚫 Account banned: ${hirerId}`);
  
      // Update local state so UI reflects changes
      setHirers((prev) =>
        prev.map((h) =>
          h.id === hirerId ? { ...h, statusStep: "banned", banned: true } : h
        )
      );
    } catch (error) {
      console.error("Error banning account:", error);
      showAlert("❌ Failed to ban account.");
    }
  };
  

  const JobReportDropdown = ({ job }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="admin-dropdown-toggle"
        >
          <span
            style={{
              display: "inline-block",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              marginRight: "0.5rem",
            }}
          >
            ▶
          </span>
          {job.position} ({job.reports} reports)
        </button>
  
        {isOpen && (
          <div className="admin-job-reports">
            {Object.entries(job.reportDetails).map(([reason, count]) =>
              count > 0 ? (
                <div key={reason} style={{ marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: "600", color: "#333" }}>
                    {reason}: {count} 🚩
                  </p>
                  <ul style={{ paddingLeft: "1.2rem", fontSize: "0.9rem", color: "#555" }}>
                    {job.reportsFrom?.[reason]?.map((email, i) => (
                      <li key={i}>Reported by: {email || "No email found"}</li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    );
  };  

  return (
    <div className="admin-page-container">
      <h1>Hirer Certification & Moderation</h1>

      {loading ? (
        <p>Loading data... ⏳</p>
      ) : error ? (
        <p className="admin-error-message">{error}</p>
      ) : (
        hirers.map((hirer) => {
          const likeRatio = hirer.totalLikes / Math.max(hirer.totalReports, 1);
          const reportRatio = hirer.totalReports / Math.max(hirer.totalLikes, 1);

          return (
            <div key={hirer.id}>
              <div
                className="admin-hirer-card"
                style={{
                  borderColor: hirer.certified ? "green" : "gray",
                  borderWidth: "3px",
                  borderStyle: "solid",
                }}
              >
                <div className="admin-picture-section">
                  <img
                    src={hirer.profilePicURL || "https://via.placeholder.com/100"}
                    alt="Profile"
                    className="admin-profile-image"
                  />
                </div>

                <div className="admin-details-section">
                  <div className="admin-info-left">
                    <p className="admin-detail-label">Name</p>
                    <p><strong>{hirer.firstName} {hirer.lastName}</strong></p>

                    <p className="admin-detail-label">Email</p>
                    <p><strong>{hirer.email}</strong></p>

                    <p className="admin-detail-label">Jobs Posted</p>
                    <p><strong>{hirer.totalJobs}</strong></p>
                  </div>

                  <div className="admin-info-right">
                    <p className="admin-detail-label">Total Likes</p>
                    <p>
                      <strong>{hirer.totalLikes} 👍</strong>{" "}
                      <button className="admin-view-btn" onClick={() => setOpenModal(`likes-${hirer.id}`)}>View Likes</button>
                    </p>

                    <p className="admin-detail-label">Total Reports</p>
                    <p>
                      <strong>{hirer.totalReports} 🚩</strong>{" "}
                      <button className="admin-view-btn" onClick={() => setOpenModal(`reports-${hirer.id}`)}>View Reports</button>
                    </p>

                    <p className="admin-detail-label">Current Status</p>
                    <p><strong>{hirer.statusStep.toUpperCase()}</strong></p>
                  </div>
                </div>

                <div className="admin-actions-section">
                  {likeRatio >= 0.0 && !hirer.certified && (
                    <button className="admin-accept-btn" onClick={() => handleCertification(hirer.id)}>Accept</button>
                  )}

                  {/*
                  {hirer.statusStep === "none" && reportRatio >= 0.5 && (
                    <button className="admin-reject-btn" onClick={() => handleNotice(hirer.id)}>Send Notice</button>
                  )}
                  {hirer.statusStep === "notice" && reportRatio >= 0.85 && (
                    <button className="admin-reject-btn" onClick={() => handleDeleteJobs(hirer.id)}>Delete All Jobs</button>
                  )}
                  {hirer.statusStep === "deletion" && reportRatio >= 0.95 && (
                    <button className="admin-reject-btn" onClick={() => handleBanAccount(hirer.id)}>Ban Account</button>
                  )}
                  */}

                {reportRatio >= 0.0 && (
                  <>
                    <button className="admin-reject-btn" onClick={() => handleNotice(hirer.id)}>Send Notice</button>
                    <button className="admin-reject-btn" onClick={() => handleFreezeJobs(hirer.id)}>Freeze All Jobs</button>
                    <button className="admin-accept-btn" onClick={() => handleUnfreezeJobs(hirer.id)}>Unfreeze Jobs</button>
                    <button className="admin-reject-btn" onClick={() => handleBanAccount(hirer.id)}>Ban Account</button>
                  </>
                )}

                </div>
              </div>

              {openModal === `likes-${hirer.id}` && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal-content">
                    <h3>Like Breakdown for {hirer.firstName}</h3>
                    <ul>
                      {hirer.jobList.map((job) => (
                        <li key={job.id}>{job.position}: {job.likes} 👍</li>
                      ))}
                    </ul>
                    <button className="admin-close-btn" onClick={() => setOpenModal(null)}>Close</button>
                  </div>
                </div>
              )}

              {openModal === `reports-${hirer.id}` && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal-content">
                    <h3>Report Breakdown for {hirer.firstName}</h3>
                    {hirer.jobList.map((job) => (
                      <JobReportDropdown key={job.id} job={job} />
                    ))}
                    <button className="admin-close-btn" onClick={() => setOpenModal(null)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
};

export default Admin;
