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

  // Resolve current user; allow through even if user doc read fails (we use auth uid)
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
        // Optional role check; don't block if it fails
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
        // proceed with auth uid anyway
        setHirerId(u.uid);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!hirerId) return;
      setLoading(true);
      setError("");
      setRows([]);

      try {
        // 1) Jobs by this hirer
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

        // 2) Read submissions
        const subs = [];
        const subsRef = collection(db, "submissions");

        const tryInQuery = async () => {
          for (const group of chunk(jobIds, 10)) {
            const qIn = query(subsRef, where("jobId", "in", group));
            const snap = await getDocs(qIn);
            snap.forEach((d) => {
              const data = d.data();
              if (data?.jobId !== PROFILE_JOB_ID) subs.push({ id: d.id, ...data });
            });
          }
        };

        const tryPerJobQueries = async () => {
          for (const id of jobIds) {
            const qOne = query(subsRef, where("jobId", "==", id));
            const snap = await getDocs(qOne);
            snap.forEach((d) => {
              const data = d.data();
              if (data?.jobId !== PROFILE_JOB_ID) subs.push({ id: d.id, ...data });
            });
          }
        };

        // Try IN first, then fall back
        try {
          await tryInQuery();
        } catch (e) {
          console.warn("[Submissions] 'in' query failed, falling back to per-job:", e);
          await tryPerJobQueries();
        }

        if (subs.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        // 3) Join applicant info (best-effort)
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

        const safeToDate = (ts) => {
          try {
            return ts?.toDate?.() || null;
          } catch {
            return null;
          }
        };

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
            jobTitle: jobIdToTitle.get(s.jobId) || "(Untitled Job)",
            pdfUrl: s.pdfUrl || "",
            submittedAt: safeToDate(s.submittedAt) || safeToDate(s.updatedAt),
          };
        });

        built.sort(
          (a, b) => (b.submittedAt?.getTime?.() || 0) - (a.submittedAt?.getTime?.() || 0)
        );

        setRows(built);
      } catch (e) {
        console.error("Load submissions failed:", e);
        setError("Failed to load submissions. Check Firestore rules and indexes, then refresh.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [db, hirerId]);

  const when = (d) => (d ? new Date(d).toLocaleString() : "");

  const content = useMemo(() => {
    if (loading) return <p className="loading">Loading submissions…</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (rows.length === 0) return <p className="loading">No submissions yet for your jobs.</p>;

    return (
      <div className="submission-list">
        {rows.map((c) => (
          <div key={c.id} className="submission-card">
            <div className="submission-main">
              <div className="avatar">
                {c.photo ? (
                  <img src={c.photo} alt={c.applicantName} className="profile-pic" />
                ) : (
                  <div className="profile-placeholder">{c.initials || "?"}</div>
                )}
              </div>

              <div className="submission-info">
                <p>
                  <strong>{c.applicantName}</strong>
                  {c.email ? ` • ${c.email}` : ""}
                </p>
                <p>
                  Applied to: <strong>{c.jobTitle}</strong>
                </p>
                {c.submittedAt && (
                  <p>
                    Submitted: <strong>{when(c.submittedAt)}</strong>
                  </p>
                )}
              </div>
            </div>

            {c.pdfUrl ? (
              <a className="view-btn" href={c.pdfUrl} target="_blank" rel="noreferrer">
                View CV
              </a>
            ) : (
              <span className="view-btn" style={{ opacity: 0.6, pointerEvents: "none" }}>
                No CV Link
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }, [loading, error, rows]);

  return (
    <div className="submissions-container">
      <h1>CV Submissions</h1>
      {content}
    </div>
  );
}
