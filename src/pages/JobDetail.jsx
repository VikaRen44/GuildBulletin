import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  getDocs,
  where,
  runTransaction,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import "../Styles/jobdetail.css";

const REPORT_REASONS = [
  { key: "scam",         label: "Scam" },
  { key: "unresponsive", label: "Unresponsive" },
  { key: "fakeListing",  label: "Fake Listing" },
  { key: "spam",         label: "Spam" },
  { key: "other",        label: "Others" },
];

const JobDetail = () => {
  const { id: urlJobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirestore();
  const auth = getAuth();

  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(urlJobId || null);
  const [hirer, setHirer] = useState(null);
  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || ""
  );

  // like/report UI state
  const [liked, setLiked] = useState(false);
  const [reported, setReported] = useState(false);
  const [busyLike, setBusyLike] = useState(false);
  const [busyReport, setBusyReport] = useState(false);

  // modal for structured report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSelections, setReportSelections] = useState({});
  const [reportNote, setReportNote] = useState("");

  // current user state (for Submit CV)
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userCvUrl, setUserCvUrl] = useState("");
  const [cvSubmitting, setCvSubmitting] = useState(false);
  const [cvAlreadySubmitted, setCvAlreadySubmitted] = useState(false);
  const [cvSubmissionId, setCvSubmissionId] = useState(null); // <-- track existing submission doc id

  // Auth → get user role + cvUrl
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user || null);
      setUserRole("");
      setUserCvUrl("");
      if (user) {
        try {
          const uRef = doc(db, "Users", user.uid);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const data = uSnap.data() || {};
            setUserRole(data.role || "");
            setUserCvUrl(data.cvUrl || data.resumeUrl || data.pdfUrl || "");
          }
        } catch {
          /* noop */
        }
      }
    });
    return () => unsub();
  }, [auth, db]);

  // Fetch jobs (newest first)
  useEffect(() => {
    const qJobs = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qJobs, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } ))
        .filter((j) => !j.frozen);
      setJobs(list);
      if (!activeJobId && list.length) setActiveJobId(list[0].id);
    });
    return () => unsub();
  }, [db, activeJobId]);

  // Active job
  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) || null,
    [jobs, activeJobId]
  );

  // Hirer (optional)
  useEffect(() => {
    (async () => {
      if (!activeJob?.hirerId) {
        setHirer(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "Users", activeJob.hirerId));
        setHirer(snap.exists() ? snap.data() : null);
      } catch (e) {
        console.error("Failed to load hirer:", e);
        setHirer(null);
      }
    })();
  }, [db, activeJob?.hirerId]);

  // Has this user already submitted for this job?
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!currentUser || !activeJob) {
        setCvAlreadySubmitted(false);
        setCvSubmissionId(null);
        return;
      }
      try {
        const qSub = query(
          collection(db, "submissions"),
          where("userId", "==", currentUser.uid),
          where("jobId", "==", activeJob.id)
        );
        const s = await getDocs(qSub);
        if (!cancel) {
          setCvAlreadySubmitted(!s.empty);
          setCvSubmissionId(!s.empty ? s.docs[0].id : null);
        }
      } catch {
        if (!cancel) {
          setCvAlreadySubmitted(false);
          setCvSubmissionId(null);
        }
      }
    })();
    return () => { cancel = true; };
  }, [db, currentUser, activeJob?.id]);

  // Filter (kept)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.position, j.companyName, j.location]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [jobs, search]);

  const selectJob = (jobId) => {
    setActiveJobId(jobId);
    navigate(`/job/${jobId}`, { replace: true });
  };

  /** Sync liked/reported flags from Firestore **/
  useEffect(() => {
    let cancel = false;

    (async () => {
      if (!activeJob || !currentUser) {
        setLiked(false);
        setReported(false);
        return;
      }

      const likedBy = Array.isArray(activeJob.likedBy) ? activeJob.likedBy : [];
      const isLiked = likedBy.includes(currentUser.uid);

      let isReported = false;
      const reportedBy = Array.isArray(activeJob.reportedBy) ? activeJob.reportedBy : [];
      if (reportedBy.includes(currentUser.uid)) {
        isReported = true;
      } else {
        try {
          const qRep = query(
            collection(doc(db, "jobs", activeJob.id), "reports"),
            where("reporterId", "==", currentUser.uid)
          );
          const r = await getDocs(qRep);
          isReported = !r.empty;
        } catch {
          // ignore
        }
      }

      if (!cancel) {
        setLiked(isLiked);
        setReported(isReported);
      }
    })();

    return () => { cancel = true; };
  }, [db, activeJob, currentUser]);

  /** LIKE — strictly account-based **/
  const handleLike = async () => {
    if (!activeJob) return;
    if (!currentUser) {
      alert("Please log in to like this job.");
      navigate("/login");
      return;
    }
    if (busyLike) return;
    setBusyLike(true);

    const jobRef = doc(db, "jobs", activeJob.id);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(jobRef);
        if (!snap.exists()) throw new Error("Job not found.");

        const data = snap.data() || {};
        const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
        const likesCount = typeof data.likesCount === "number" ? data.likesCount : 0;

        const alreadyLiked = likedBy.includes(currentUser.uid);
        const newLikedBy = alreadyLiked
          ? likedBy.filter((u) => u !== currentUser.uid)
          : [...likedBy, currentUser.uid];

        const newLikesCount = alreadyLiked ? Math.max(0, likesCount - 1) : likesCount + 1;

        tx.update(jobRef, {
          likedBy: newLikedBy,
          likesCount: newLikesCount,
        });

        setLiked(!alreadyLiked);
      });
    } catch (e) {
      console.error("Like failed:", e);
      alert("Sorry, we couldn’t update your like. Please try again.");
    } finally {
      setBusyLike(false);
    }
  };

  /** REPORT — strictly account-based, no duplicates **/
  const openReportModal = () => {
    if (!currentUser) {
      alert("Please log in to report this job.");
      navigate("/login");
      return;
    }
    setReportSelections({});
    setReportNote("");
    setShowReportModal(true);
  };

  const toggleReason = (key) => {
    setReportSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const submitReport = async () => {
    if (!activeJob || busyReport) return;

    if (!currentUser) {
      alert("Please log in to report this job.");
      navigate("/login");
      return;
    }

    const reasons = REPORT_REASONS.filter(r => reportSelections[r.key]).map(r => r.key);
    if (reasons.length === 0) {
      alert("Please choose at least one reason.");
      return;
    }

    setBusyReport(true);
    const jobRef = doc(db, "jobs", activeJob.id);
    const reportsCol = collection(jobRef, "reports");

    try {
      const dupQ = query(reportsCol, where("reporterId", "==", currentUser.uid));
      const dupRes = await getDocs(dupQ);
      if (!dupRes.empty) {
        setReported(true);
        alert("You’ve already reported this job.");
        setShowReportModal(false);
        setBusyReport(false);
        return;
      }

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(jobRef);
        if (!snap.exists()) throw new Error("Job not found.");

        await addDoc(reportsCol, {
          jobId: activeJob.id,
          reasons,
          note: reportNote || "",
          reporterId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        const updates = {
          reportedBy: arrayUnion(currentUser.uid),
          reportsCount: increment(1),
        };
        reasons.forEach((r) => {
          updates[`reasonCounts.${r}`] = increment(1);
        });

        tx.update(jobRef, updates);

        setReported(true);
        setShowReportModal(false);
      });

      alert("Thanks for the report. We'll review it.");
    } catch (e) {
      console.error("Report failed:", e);
      alert("Sorry, something went wrong while reporting.");
    } finally {
      setBusyReport(false);
    }
  };

  // SUBMIT / EDIT CV (Applicant)
  const handleSubmitCv = async () => {
    if (!activeJob) return;

    if (!currentUser) {
      alert("Please log in to submit your CV.");
      navigate("/login");
      return;
    }
    if (userRole !== "applicant") {
      alert("Only applicants can submit a CV.");
      return;
    }
    if (!userCvUrl) {
      const go = confirm("You don't have a CV on file. Go to Upload CV?");
      if (go) navigate("/upload-cv");
      return;
    }

    try {
      setCvSubmitting(true);

      if (cvAlreadySubmitted && cvSubmissionId) {
        // EDIT existing submission
        await updateDoc(doc(db, "submissions", cvSubmissionId), {
          pdfUrl: userCvUrl,
          updatedAt: serverTimestamp(),
        });
        alert("Your CV link for this job has been updated.");
      } else {
        // CREATE new submission
        await addDoc(collection(db, "submissions"), {
          userId: currentUser.uid,
          jobId: activeJob.id,
          pdfUrl: userCvUrl,
          submittedAt: serverTimestamp(),
        });
        setCvAlreadySubmitted(true);
        alert("Your CV was submitted successfully!");
      }
    } catch (e) {
      console.error("Submit/Edit CV failed:", e);
      alert("Sorry, we couldn't process your CV. Please try again.");
    } finally {
      setCvSubmitting(false);
    }
  };

  const hasHirer =
    !!activeJob?.hirerId &&
    activeJob.hirerId !== "undefined" &&
    activeJob.hirerId !== "null";

  return (
    <>
      <Navbar />
      <div className="jd-shell">
        {/* Sidebar */}
        <aside className="jd-sidebar">
          <div className="jd-sidebar__top">
            <h3 className="jd-sidebar__title">All Jobs</h3>
            <input
              className="jd-search"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="jd-list">
            {filtered.map((job) => (
              <button
                key={job.id}
                className={`jd-card ${activeJobId === job.id ? "is-active" : ""}`}
                onClick={() => selectJob(job.id)}
                style={{
                  backgroundImage: job.jobImage ? `url(${job.jobImage})` : undefined,
                }}
              >
                <div className="jd-card__overlay">
                  <div className="jd-card__meta">
                    {job.companyName} | {job.location}
                  </div>
                  <h4 className="jd-card__title">{job.position}</h4>
                  <div className="jd-card__salary">
                    Php {Number(job.salary || 0).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="jd-empty">No jobs match your search.</div>}
          </div>
        </aside>

        {/* Detail pane */}
        <main className="jd-detail">
          {activeJob ? (
            <>
              <header className="jd-detail__head">
                <h1 className="jd-title">{activeJob.position}</h1>

                <p className="jd-sub">
                  <span className="jd-label">Company:</span> {activeJob.companyName}
                </p>

                <p className="jd-sub">
                  <span className="jd-label">Location:</span> {activeJob.location}
                </p>

                <p className="jd-sub">
                  <span className="jd-label">Hirer Account:</span>{" "}
                  <button
                    className={`jd-btn ${hasHirer ? "jd-btn--ghost" : "jd-btn--disabled"}`}
                    onClick={() => {
                      if (!hasHirer) {
                        alert("This listing has no linked hirer profile.");
                        console.warn("Missing hirerId on job:", activeJob.id);
                        return;
                      }
                      navigate(`/hirer/${activeJob.hirerId}/from/${activeJob.id}`);
                    }}
                    disabled={!hasHirer}
                    title={hasHirer ? "View profile" : "No hirer profile linked"}
                  >
                    View Profile
                  </button>
                  {hirer && (
                    <span style={{ marginLeft: 8, opacity: 0.8 }}>
                      ({hirer.firstName} {hirer.lastName})
                    </span>
                  )}
                </p>
              </header>

              <section className="jd-section">
                <h3 className="jd-section__title">Job Summary</h3>
                <p className="jd-text">
                  {activeJob.description || "No description provided for this listing."}
                </p>
              </section>

              <section className="jd-section">
                <h3 className="jd-section__title">Base Pay Range</h3>
                <p className="jd-pay">
                  Php {Number(activeJob.salary || 0).toLocaleString()}
                </p>
              </section>

              <div className="jd-actions">
                {userRole === "applicant" && (
                  <button
                    className="jd-apply-btn"
                    onClick={handleSubmitCv}
                    disabled={cvSubmitting}
                    title={
                      cvSubmitting
                        ? "Submitting..."
                        : cvAlreadySubmitted
                        ? "Update the CV you submitted to this job"
                        : "Submit your CV to this job"
                    }
                  >
                    {cvAlreadySubmitted ? "Update CV" : "Submit CV"}
                  </button>
                )}

                <button
                  className="jd-like-btn"
                  onClick={handleLike}
                  disabled={busyLike}
                  title={busyLike ? "Please wait..." : liked ? "Unlike this job" : "Like this job"}
                >
                  <span className="jd-like-btn__icon">❤️</span>
                  {liked ? " Unlike" : " Like"}
                </button>

                <button
                  className="jd-report-btn"
                  onClick={openReportModal}
                  title={reported ? "Already reported" : "Report this job"}
                  disabled={reported}
                >
                  <span className="jd-report-btn__icon">⚑</span> {reported ? "Reported" : "Report"}
                </button>
              </div>

              {/* Optional helper text to show which CV will be used */}
              {userRole === "applicant" && userCvUrl && (
                <p style={{ marginTop: 8, opacity: 0.75 }}>
                  Using CV:{" "}
                  <a href={userCvUrl} target="_blank" rel="noreferrer">
                    {userCvUrl}
                  </a>
                </p>
              )}
            </>
          ) : (
            <div className="jd-empty jd-empty--detail">Select a job from the list to view details.</div>
          )}
        </main>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="jd-modal__backdrop" onClick={() => setShowReportModal(false)}>
          <div className="jd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jd-modal__head">
              <h3>Report this job</h3>
              <button className="jd-modal__close" onClick={() => setShowReportModal(false)}>
                ×
              </button>
            </div>

            <div className="jd-modal__body">
              <p className="jd-modal__hint">Select one or more reasons:</p>

              <div className="jd-modal__reasons">
                {REPORT_REASONS.map((r) => (
                  <label key={r.key} className="jd-checkbox">
                    <input
                      type="checkbox"
                      checked={!!reportSelections[r.key]}
                      onChange={() => toggleReason(r.key)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              <label className="jd-modal__note">
                <span>Additional details (optional)</span>
                <textarea
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Add any clarification that may help admins review."
                />
              </label>
            </div>

            <div className="jd-modal__actions">
              <button className="jd-btn jd-btn--ghost" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button className="jd-report-btn" onClick={submitReport} disabled={busyReport}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobDetail;
