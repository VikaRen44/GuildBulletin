import React, { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../Styles/submissions.css";

const PROFILE_JOB_ID = "__profile__"; // sentinel rows to ignore

// Firestore "in" has a limit of 10 terms
const chunk = (arr, size = 10) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export default function Submissions() {
  const auth = getAuth();
  const db = getFirestore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hirerId, setHirerId] = useState(null);
  const [rows, setRows] = useState([]);

  // ---- pager state ----
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // Clamp current page when rows change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
    if (currentPage > totalPages - 1) setCurrentPage(totalPages - 1);
    if (currentPage < 0) setCurrentPage(0);
  }, [rows.length, currentPage]);

  // Resolve current user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setError("");
      setRows([]);
      if (!u) {
        setHirerId(null);
        setLoading(false);
        return;
      }
      try {
        const uRef = doc(db, "Users", u.uid);
        const uSnap = await getDoc(uRef);
        const role = uSnap.exists() ? uSnap.data()?.role : undefined;
        if (role && role !== "hirer") {
          setError("Submissions are visible to hirer accounts only.");
          setHirerId(null);
        } else {
          setHirerId(u.uid);
        }
      } catch {
        setHirerId(u.uid);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live submissions
  useEffect(() => {
    if (!hirerId) return;

    let unsubs = [];
    let subsMap = new Map();

    const teardown = () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
      unsubs = [];
    };

    const safeToDate = (ts) => {
      try {
        return ts?.toDate?.() || null;
      } catch {
        return null;
      }
    };

    const rebuildRows = async () => {
      const subs = Array.from(subsMap.values());
      if (!subs.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(subs.map((s) => s.userId).filter(Boolean))];
      const userMap = new Map();
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const uRef = doc(db, "Users", uid);
            const uSnap = await getDoc(uRef);
            userMap.set(uid, uSnap.exists() ? uSnap.data() : {});
          } catch {
            userMap.set(uid, {});
          }
        })
      );

      const built = subs.map((s) => {
        const u = userMap.get(s.userId) || {};
        const fullName =
          `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown Applicant";
        const email = (u.email || u.gmail || "").trim();
        const photo = u.profileImage || u.profilePicURL || "";
        const initials = fullName
          .split(" ")
          .filter(Boolean)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return {
          id: s.id,
          applicantName: fullName,
          email,
          photo,
          initials,
          jobTitle: s._jobTitle || "(Untitled Job)",
          pdfUrl: s.pdfUrl || "",
          submittedAt: safeToDate(s.submittedAt) || safeToDate(s.updatedAt),
          status: s.status || "pending",
        };
      });

      built.sort(
        (a, b) => (b.submittedAt?.getTime?.() || 0) - (a.submittedAt?.getTime?.() || 0)
      );

      setRows(built);
      setLoading(false);
    };

    const loadLive = async () => {
      setLoading(true);
      setError("");
      setRows([]);
      subsMap = new Map();

      try {
        const jobsQ = query(collection(db, "jobs"), where("hirerId", "==", hirerId));
        const jobsSnap = await getDocs(jobsQ);
        const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const jobIds = jobs.map((j) => j.id);
        const jobIdToTitle = new Map(
          jobs.map((j) => [j.id, j.position || "(Untitled Job)"])
        );

        if (jobIds.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        const subsRef = collection(db, "submissions");

        const applySnap = (snap) => {
          snap.docChanges().forEach((chg) => {
            const d = chg.doc;
            const data = d.data();
            if (data?.jobId === PROFILE_JOB_ID) return;

            const record = {
              id: d.id,
              ...data,
              _jobTitle: jobIdToTitle.get(data.jobId) || "(Untitled Job)",
            };

            if (chg.type === "removed") {
              subsMap.delete(d.id);
            } else {
              subsMap.set(d.id, record);
            }
          });

          rebuildRows();
        };

        const groups = chunk(jobIds, 10);
        let usedIn = false;
        try {
          groups.forEach((g) => {
            const qIn = query(subsRef, where("jobId", "in", g));
            const u = onSnapshot(qIn, applySnap);
            unsubs.push(u);
          });
          usedIn = true;
        } catch {
          usedIn = false;
        }

        if (!usedIn) {
          teardown();
          jobIds.forEach((id) => {
            const qOne = query(subsRef, where("jobId", "==", id));
            const u = onSnapshot(qOne, applySnap);
            unsubs.push(u);
          });
        }
      } catch (e) {
        console.error("Load submissions (live) failed:", e);
        setError(
          "Failed to load submissions. Check Firestore rules and indexes, then refresh."
        );
        setLoading(false);
      }
    };

    loadLive();
    return () => teardown();
  }, [db, hirerId]);

  const when = (d) => (d ? new Date(d).toLocaleString() : "");

  // Accept / Reject
  const decide = async (submissionId, nextStatus) => {
    try {
      const ref = doc(db, "submissions", submissionId);
      await updateDoc(ref, {
        status: nextStatus,
        decidedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to update submission status:", e);
      alert("Could not update status. Please try again.");
    }
  };

  // Pager helpers
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = currentPage * itemsPerPage;
  const pageRows = rows.slice(startIndex, startIndex + itemsPerPage);

  const prevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const nextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  const content = useMemo(() => {
    if (loading) return <p className="loading">Loading submissions…</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (rows.length === 0) return <p className="loading">No submissions yet for your jobs.</p>;

    return (
      <div className="submissions-table-wrap">
        <table className="submissions-table">
          <thead>
            <tr>
              <th style={{ width: 64 }} />
              <th className="th-center">Name / Email</th>
              <th className="th-center">Applied To</th>
              <th className="th-center">Submitted</th>
              <th className="th-center" style={{ width: 340 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => {
              const decided = c.status !== "pending";
              const rowClass =
                c.status === "accepted"
                  ? "row-accepted"
                  : c.status === "rejected"
                  ? "row-rejected"
                  : "";

              return (
                <tr key={c.id} className={rowClass}>
                  <td>
                    <div className={`avatar-sm ${decided ? "is-decided" : ""}`}>
                      {c.photo ? (
                        <img src={c.photo} alt={c.applicantName} />
                      ) : (
                        <span>{c.initials || "?"}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="name-email">
                      <strong>{c.applicantName}</strong>
                      {c.email ? <span className="email"> • {c.email}</span> : null}
                    </div>
                  </td>
                  <td className="td-center">{c.jobTitle}</td>
                  <td className="td-center">{c.submittedAt ? when(c.submittedAt) : ""}</td>
                  <td className="act-cell">
                    {c.pdfUrl ? (
                      <a
                        className={`view-btn ${decided ? "is-muted" : ""}`}
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View CV
                      </a>
                    ) : (
                      <span
                        className="view-btn"
                        style={{ opacity: 0.6, pointerEvents: "none" }}
                      >
                        No CV
                      </span>
                    )}

                    <button
                      className="accept-btn"
                      onClick={() => decide(c.id, "accepted")}
                      disabled={decided}
                      title={decided ? "Decision already made" : "Accept applicant"}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => decide(c.id, "rejected")}
                      disabled={decided}
                      title={decided ? "Decision already made" : "Reject applicant"}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Bottom pager with DOTS */}
        <div className="submissions-pager">
          <button
            className="pager-btn"
            onClick={prevPage}
            disabled={currentPage === 0}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="pager-dots" role="tablist" aria-label="Pagination">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentPage ? "active" : ""}`}
                aria-label={`Go to page ${i + 1}`}
                aria-current={i === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(i)}
              />
            ))}
          </div>

          <button
            className="pager-btn"
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
    );
  }, [loading, error, rows, currentPage, totalPages]);

  return (
    <div className="submissions-container">
      <h1>CV Submissions</h1>
      {content}
    </div>
  );
}
