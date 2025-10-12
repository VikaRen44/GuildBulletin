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

// Canonical labels shown in UI
const REASON_LABELS = {
  scam: "Scam",
  unresponsive: "Unresponsive",
  fakeListing: "Fake Listing",
  spam: "Spam",
  other: "Others",
};

// Map any incoming reason value to a canonical UI label.
function normalizeReasonLabel(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();

  if (Object.values(REASON_LABELS).includes(s)) return s;

  const k = s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "");

  if (k === "scam") return REASON_LABELS.scam;
  if (k === "unresponsive") return REASON_LABELS.unresponsive;
  if (k === "fakelisting") return REASON_LABELS.fakeListing;
  if (k === "spam") return REASON_LABELS.spam;
  if (k === "other" || k === "others") return REASON_LABELS.other;

  return null;
}

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
        // 1) All hirers
        const usersRef = collection(db, "Users");
        const qHirers = query(usersRef, where("role", "==", "hirer"));
        const hirersSnap = await getDocs(qHirers);

        // 2) Top-level dedicated "reports" (if present)
        let topLevelReports = [];
        try {
          const reportsRef = collection(db, "reports");
          const reportsSnapshot = await getDocs(reportsRef);
          topLevelReports = reportsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          topLevelReports = [];
        }

        // 3) Top-level dedicated "likes" (if present)
        // Expecting docs: { jobId, userId, createdAt }
        let topLevelLikes = [];
        try {
          const likesRef = collection(db, "likes");
          const likesSnapshot = await getDocs(likesRef);
          topLevelLikes = likesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          topLevelLikes = [];
        }

        // Build quick maps for aggregation
        const jobReportsMap = {};
        const ensureJobReportAgg = (jobId) => {
          if (!jobReportsMap[jobId]) {
            jobReportsMap[jobId] = {
              count: 0,
              reasons: {
                [REASON_LABELS.scam]: 0,
                [REASON_LABELS.unresponsive]: 0,
                [REASON_LABELS.fakeListing]: 0,
                [REASON_LABELS.other]: 0,
                [REASON_LABELS.spam]: 0,
              },
              reporters: {}, // { [reasonLabel]: [reporterDisplay,...] }
            };
          }
          return jobReportsMap[jobId];
        };

        // jobId -> Set<userId> (who liked)
        const jobLikesMap = {};
        const ensureJobLikesSet = (jobId) => {
          if (!jobLikesMap[jobId]) jobLikesMap[jobId] = new Set();
          return jobLikesMap[jobId];
        };

       // Resolve user "Name (email)" for display (cached)
        const userDisplayCache = new Map();
        const getUserDisplay = async (uid) => {
          if (!uid) return "Unknown user";
          if (userDisplayCache.has(uid)) return userDisplayCache.get(uid);

          try {
            const userRef = doc(db, "Users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const u = userSnap.data() || {};
              const first = (u.firstName || "").trim();
              const last  = (u.lastName  || "").trim();
              const name  = [first, last].filter(Boolean).join(" ");
              const email = (u.email || u.gmail || "").trim();

              const combined =
                name && email ? `${name} (${email})` :
                name || email || "Unknown user";

              userDisplayCache.set(uid, combined);
              return combined;
            }
          } catch {
            // ignore
          }

          const fallback = "Unknown user";
          userDisplayCache.set(uid, fallback);
          return fallback;
        };


        // Helper to add a single report to agg
        const addReportToAgg = async (jobId, reasonsArr, reporterUid) => {
          const agg = ensureJobReportAgg(jobId);
          agg.count += 1;

          const reporterDisplay = await getUserDisplay(reporterUid);

          (Array.isArray(reasonsArr) ? reasonsArr : []).forEach((r) => {
            const label = normalizeReasonLabel(r);
            if (!label) return;
            agg.reasons[label] = (agg.reasons[label] || 0) + 1;
            if (!Array.isArray(agg.reporters[label])) agg.reporters[label] = [];
            if (!agg.reporters[label].includes(reporterDisplay)) {
              agg.reporters[label].push(reporterDisplay);
            }
          });
        };

        // Pre-aggregate from top-level /reports
        await Promise.all(
          topLevelReports.map(async (r) => {
            const jobId = r.jobId;
            if (!jobId) return;
            const reasons = Array.isArray(r.reasons) ? r.reasons : [];
            const reporterUid = r.reporterId || r.reportedBy || null;
            await addReportToAgg(jobId, reasons, reporterUid);
          })
        );

        // Pre-aggregate from top-level /likes
        topLevelLikes.forEach((like) => {
          if (!like?.jobId || !like?.userId) return;
          ensureJobLikesSet(like.jobId).add(like.userId);
        });

        // 4) For each hirer, find their jobs and also read per-job `/jobs/{jobId}/reports`
        const hirerData = await Promise.all(
          hirersSnap.docs.map(async (hirerDoc) => {
            const data = hirerDoc.data();
            const hirerId = hirerDoc.id;

            const jobsRef = collection(db, "jobs");
            const qJobs = query(jobsRef, where("hirerId", "==", hirerId));
            const jobsSnapshot = await getDocs(qJobs);

            let totalReports = 0;
            let totalLikes = 0;
            const totalJobs = jobsSnapshot.docs.length;

            const jobList = [];
            for (const jobDoc of jobsSnapshot.docs) {
              const jobId = jobDoc.id;
              const job = jobDoc.data();

              // Likes count (aggregate)
              const likesCount =
                typeof job.likesCount === "number"
                  ? job.likesCount
                  : Array.isArray(job.likedBy)
                  ? job.likedBy.length
                  : typeof job.likes === "number"
                  ? job.likes
                  : 0;

              totalLikes += likesCount;

              // Collect likers (UIDs) from job.likedBy + top-level /likes
              const likerUidSet = ensureJobLikesSet(jobId);
              if (Array.isArray(job.likedBy)) {
                job.likedBy.forEach((uid) => uid && likerUidSet.add(uid));
              }

              // Resolve liker displays
              const likeLikers = [];
              for (const uid of likerUidSet) {
                likeLikers.push(await getUserDisplay(uid));
              }

              // Merge per-job subcollection reports
              try {
                const subReportsRef = collection(doc(db, "jobs", jobId), "reports");
                const subReportsSnap = await getDocs(subReportsRef);
                const subReports = subReportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                for (const rep of subReports) {
                  const reasons = Array.isArray(rep.reasons) ? rep.reasons : [];
                  const reporterUid = rep.reporterId || rep.reportedBy || null;
                  await addReportToAgg(jobId, reasons, reporterUid);
                }
              } catch {
                /* ignore */
              }

              const reportAgg = jobReportsMap[jobId] || {
                count: 0,
                reasons: {
                  [REASON_LABELS.scam]: 0,
                  [REASON_LABELS.unresponsive]: 0,
                  [REASON_LABELS.fakeListing]: 0,
                  [REASON_LABELS.spam]: 0,
                  [REASON_LABELS.other]: 0,
                },
                reporters: {},
              };

              totalReports += reportAgg.count;

              jobList.push({
                id: jobId,
                position: job.position,
                likes: likesCount,
                likeLikers,                 // ✅ array of display strings for likers
                reports: reportAgg.count,
                reportDetails: reportAgg.reasons,
                reportsFrom: reportAgg.reporters,
                frozen: !!job.frozen,
              });
            }

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
              certified: !!data.certified,
              statusStep: data.statusStep || "none",
              banned: !!data.banned,
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

      if (!hirer?.email || hirer.email.trim() === "") {
        showAlert("⚠️ This hirer has no email address on file.");
        return;
      }

      const reportDetails = hirer.jobList
        .filter((job) => job.reports > 0)
        .map((job) => {
          const reasons = Object.entries(job.reportDetails)
            .filter(([_, count]) => (count || 0) > 0)
            .map(([reason, count]) => `• ${reason}: ${count} report(s)`)
            .join("\n");

          return `🔹 Job Position: ${job.position}\n${reasons}`;
        })
        .join("\n\n");

      const noticeEmailContent = {
        to_email: hirer.email,
        to_name: `${hirer.firstName} ${hirer.lastName}`,
        // details: reportDetails, // include if your template expects it
      };

      await emailjs.send(
        "service_4y9z6j9",
        "template_3grqprk",
        noticeEmailContent,
        "ptcOjfNiUXksV1-v4"
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

      const toFreeze = freezePromises.filter(Boolean);
      await Promise.all(toFreeze);

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

      showAlert(`❄️ ${toFreeze.length} job(s) frozen and email sent.`);
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
        statusStep: "banned",
      });

      showAlert(`🚫 Account banned: ${hirerId}`);

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
              (count || 0) > 0 ? (
                <div key={reason} style={{ marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: "600", color: "#333" }}>
                    {reason}: {count} 🚩
                  </p>
                  <ul style={{ paddingLeft: "1.2rem", fontSize: "0.9rem", color: "#555" }}>
                    {(job.reportsFrom?.[reason] || []).map((email, i) => (
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

  // ✅ New: Likes dropdown, mirrors reports dropdown
  const JobLikeDropdown = ({ job }) => {
    const [isOpen, setIsOpen] = useState(false);

    const hasLikers = Array.isArray(job.likeLikers) && job.likeLikers.length > 0;
    const headerCount = typeof job.likes === "number" ? job.likes : (hasLikers ? job.likeLikers.length : 0);

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
          {job.position} ({headerCount} likes)
        </button>

        {isOpen && (
          <div className="admin-job-reports">
            {hasLikers ? (
              <ul style={{ paddingLeft: "1.2rem", fontSize: "0.95rem", color: "#555" }}>
                {job.likeLikers.map((email, i) => (
                  <li key={i}>Liked by: {email || "Unknown user"}</li>
                ))}
              </ul>
            ) : (
              <p style={{ padding: "0.25rem 0.5rem", color: "#666" }}>
                No individual likers to show. (We only have a count for this job.)
              </p>
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
                      <button
                        className="admin-view-btn"
                        onClick={() => setOpenModal(`likes-${hirer.id}`)}
                      >
                        View Likes
                      </button>
                    </p>

                    <p className="admin-detail-label">Total Reports</p>
                    <p>
                      <strong>{hirer.totalReports} 🚩</strong>{" "}
                      <button
                        className="admin-view-btn"
                        onClick={() => setOpenModal(`reports-${hirer.id}`)}
                      >
                        View Reports
                      </button>
                    </p>

                    <p className="admin-detail-label">Current Status</p>
                    <p><strong>{hirer.statusStep.toUpperCase()}</strong></p>
                  </div>
                </div>

                <div className="admin-actions-section">
                  {likeRatio >= 0.0 && !hirer.certified && (
                    <button
                      className="admin-accept-btn"
                      onClick={() => handleCertification(hirer.id)}
                    >
                      Accept
                    </button>
                  )}

                  {/* Policy controls */}
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

              {/* Likes modal → now uses dropdowns per job */}
              {openModal === `likes-${hirer.id}` && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal-content">
                    <h3>Like Breakdown for {hirer.firstName}</h3>
                    {hirer.jobList.map((job) => (
                      <JobLikeDropdown key={job.id} job={job} />
                    ))}
                    <button className="admin-close-btn" onClick={() => setOpenModal(null)}>Close</button>
                  </div>
                </div>
              )}

              {/* Reports modal (unchanged UI) */}
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
