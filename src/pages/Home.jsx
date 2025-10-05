import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../Styles/stylehome.css";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FiArrowLeft } from "react-icons/fi";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, jobId } = useParams(); // hirer id (and optional origin jobId)

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  // New: loading + error for hirer profile fetch
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  /* If we're at /hirer/:id or /hirer/:id/from/:jobId, fetch that hirer's public profile */
  useEffect(() => {
    if (!id) return;
    const badId = id === "undefined" || id === "null" || id.trim() === "";
    if (badId) {
      setProfileData(null);
      setProfileError("Invalid hirer id.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setProfileLoading(true);
        setProfileError("");
        const hirerRef = doc(db, "Users", id);
        const hirerSnap = await getDoc(hirerRef);
        if (cancelled) return;
        if (hirerSnap.exists()) {
          setProfileData(hirerSnap.data());
        } else {
          setProfileData(null);
          setProfileError("Hirer profile not found.");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load hirer profile:", e);
          setProfileData(null);
          setProfileError("Failed to load hirer profile.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [db, id]);

  /* Auth + current user data (used for main home) */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          // Only set the current user's profile if NOT viewing a hirer
          if (!id) setProfileData(data);
          setUserRole(data.role);

          if (
            data.role === "hirer" &&
            data.statusStep &&
            data.statusStep !== "none"
          ) {
            setNotice(data.statusStep);
          }
        }
      } else {
        setUser(null);
        if (!id) setProfileData(null);
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, [auth, db, id]);

  /* Recommended jobs (exclude frozen) */
  useEffect(() => {
    const q = query(
      collection(db, "jobs"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobList = querySnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((job) => !job.frozen);

      setRecommendedJobs(jobList.slice(0, 5));
      setLoadingJobs(false);
    });

    return () => unsubscribe();
  }, [db]);

  /* If no :id and we have a user, refresh profileData */
  useEffect(() => {
    if (!id && user) {
      (async () => {
        try {
          const userRef = doc(db, "Users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setProfileData(userSnap.data());
        } catch (e) {
          console.error("Failed to refresh current user profile:", e);
        }
      })();
    }
  }, [db, id, user]);

  const handleCloseNotice = () => setNotice(null);

  const scrollCarousel = (direction) => {
    const container = document.getElementById("job-carousel");
    const scrollAmount = 320;
    if (!container) return;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  /* ───────────── Hirer profile view (/hirer/:id[/from/:jobId]) ───────────── */
  if (id) {
    return (
      <>
        <Navbar />
        <div className="hirer-profile-container">
          <button
            onClick={() => navigate(jobId ? `/job/${jobId}` : "/home")}
            className="home-back-button"
            style={{ marginBottom: 16 }}
          >
            <FiArrowLeft size={18} style={{ marginRight: "6px" }} />
            Back
          </button>

          {profileLoading && <p>Loading hirer profile...</p>}

          {!profileLoading && profileError && (
            <div className="notice-popup" style={{ position: "static" }}>
              <div className="notice-content">
                <h2>Couldn’t open profile</h2>
                <p>{profileError}</p>
              </div>
            </div>
          )}

          {!profileLoading && !profileError && profileData && (
            <>
              <h2>
                {profileData.firstName} {profileData.lastName}
              </h2>

              <div className="profile-image-wrapper">
                <img
                  src={profileData.profileImage || "/default-profile.png"}
                  alt="Profile"
                  className={`profile-image ${
                    profileData.role === "hirer" && profileData.certified
                      ? "certified-border"
                      : ""
                  }`}
                />
                {profileData.role === "hirer" && profileData.certified && (
                  <div className="verified-badge">✅ Verified</div>
                )}
              </div>

              <p className="about-profile">
                <strong>About:</strong>{" "}
                {profileData.about || "No description available."}
              </p>

              <div className="socials">
                <p>
                  <strong>Email:</strong>{" "}
                  {profileData.gmail ? (
                    <a href={`mailto:${profileData.gmail}`}>{profileData.gmail}</a>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p>
                  <strong>Facebook:</strong>{" "}
                  {profileData.facebook ? (
                    <a href={profileData.facebook} target="_blank" rel="noreferrer">
                      {profileData.facebook}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p>
                  <strong>Instagram:</strong>{" "}
                  {profileData.instagram ? (
                    <a href={profileData.instagram} target="_blank" rel="noreferrer">
                      {profileData.instagram}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p>
                  <strong>X (Twitter):</strong>{" "}
                  {profileData.xLink ? (
                    <a href={profileData.xLink} target="_blank" rel="noreferrer">
                      {profileData.xLink}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  /* ───────────── Main Home (/home) ───────────── */
  return (
    <>
      <Navbar />

      {notice && (
        <div className="notice-popup">
          <div className="notice-content">
            <h2>⚠ Important Notice</h2>
            {notice === "notice" && (
              <p>
                🚨 Your job posts have received multiple reports. Please review
                and fix them.
              </p>
            )}
            {notice === "deletion" && (
              <p>
                ⚠️ Your job posts have been <strong>deleted</strong> due to
                repeated reports.
              </p>
            )}
            {notice === "ban" && (
              <p>
                ❌ Your account has been <strong>banned</strong> due to
                excessive reports.
              </p>
            )}
            <button onClick={handleCloseNotice} className="notice-button">
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <div className="page-wrapper">
        {/* 🔍 Search */}
        <div className="home-search-shell">
          <div className="home-search">
            <button
              className="home-search__btn"
              onClick={() =>
                navigate(`/jobdetails?search=${encodeURIComponent(searchInput)}`)
              }
            >
              Search
            </button>

            <input
              className="home-search__input"
              type="text"
              placeholder="Enter job title, company, or keyword"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(
                    `/jobdetails?search=${encodeURIComponent(searchInput)}`
                  );
                }
              }}
            />
          </div>
        </div>

        {/* 👤 Profile Card */}
        {profileData && (
          <section className="home-profile">
            <div className="home-profile__left">
              <div className="home-pfp">
                <img
                  src={profileData.profileImage || "/default-profile.png"}
                  alt="Profile"
                  className="home-pfp__img"
                />
                {profileData.role === "hirer" && profileData.certified && (
                  <span className="home-verified" title="Verified">
                    ✓
                  </span>
                )}
              </div>

              <div className="home-left-sep" />

              <span className="home-role">
                {profileData.role === "admin"
                  ? "Admin"
                  : profileData.role === "hirer"
                  ? "Hirer"
                  : "Applicant"}
              </span>
            </div>

            <div className="home-profile__right">
              <h2 className="home-name">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <div className="home-name__underline" />

              <div className="home-about">
                {profileData.about || "No description available."}
              </div>

              <button
                onClick={() =>
                  navigate("/complete-profile", { state: { editMode: true } })
                }
                className="home-edit"
              >
                Edit Profile
              </button>

              <div className="home-social">
                <a
                  href={profileData.gmail ? `mailto:${profileData.gmail}` : "#"}
                  aria-label="Gmail"
                >
                  <FaEnvelope />
                </a>
                <a href={profileData.facebook || "#"} aria-label="Facebook">
                  <FaFacebook />
                </a>
                <a href={profileData.instagram || "#"} aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href={profileData.xLink || "#"} aria-label="Twitter / X">
                  <FaTwitter />
                </a>
              </div>
            </div>
          </section>
        )}

        {/* 💼 Recommended Jobs */}
        <div className="recommended-section">
          <h3 className="recommended-title">Recommended Jobs</h3>

          <div className="recommended-background">
            {loadingJobs ? (
              <p>Loading recommended jobs...</p>
            ) : recommendedJobs.length > 0 ? (
              <div className="carousel-wrapper">
                <button
                  className="carousel-button left"
                  aria-label="Previous"
                  onClick={() => scrollCarousel("left")}
                >
                  <FiChevronLeft size={22} strokeWidth={3} />
                </button>

                <div className="carousel-track" id="job-carousel">
                  {recommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="job-card"
                      onClick={() => navigate(`/job/${job.id}`)}
                      style={{
                        backgroundImage: job.jobImage
                          ? `url(${job.jobImage})`
                          : "none",
                      }}
                    >
                      <div className="job-overlay-home">
                        <h3>{job.position}</h3>
                        <p>
                          {job.companyName} | {job.location}
                        </p>
                        <p className="salary">
                          Php {Number(job.salary || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="carousel-button right"
                  aria-label="Next"
                  onClick={() => scrollCarousel("right")}
                >
                  <FiChevronRight size={22} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <p>No jobs available at the moment.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-left">
            <p className="footer-title">Our Story</p>
            <p className="footer-text">
              InternItUp is a work application site developed for a useful group
              of LPU students as a requirement for their course program, Software
              Engineering.
            </p>
          </div>
          <div className="footer-right">
            <p>
              <a href="#">Lyceum of Subic Bay, Inc.</a>
            </p>
            <p>
              <a href="#">LSB Official FB Page</a>
            </p>
            <p>
              <a href="#">LSB Pinnacle</a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
