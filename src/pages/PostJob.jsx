import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import "../Styles/PostJob.css"; 
import { useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModal"; // ✅ Added AlertModal for alerts

const MAX_FILE_SIZE = 200 * 1024; // 200KB limit

const JobForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    employerName: "",
    location: "",
    position: "",
    salary: "",
    description: "",
    jobImage: "",
  });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // ✅ Modal state for alerts
  const [postSuccessId, setPostSuccessId] = useState(null); // ✅ For redirect
  const navigate = useNavigate();

  // ✅ Show alert modal with optional callback
  const showAlert = (msg, callback = null) => {
    setAlertMessage(msg);
    setPostSuccessId(() => callback);
  };

  const closeAlert = () => {
    setAlertMessage("");
    if (typeof postSuccessId === "function") postSuccessId();
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };
    fetchUserRole();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "salary") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setImageError("File size must be under 200KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, jobImage: reader.result }));
        setImageError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (userRole !== "hirer") {
      showAlert("Only hirers can post jobs.");
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const newJobRef = await addDoc(collection(db, "jobs"), {
        ...formData,
        salary: Number(formData.salary),
        hirerId: userId,
        createdAt: serverTimestamp(),
      });

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        await updateDoc(userRef, {
          jobCount: (userData.jobCount || 0) + 1,
        });
      }

      showAlert("Job Posted Successfully!", () => navigate(`/job/${newJobRef.id}`)); // ✅ Alert then redirect
    } catch (error) {
      showAlert("Error posting job: " + error.message); // ✅ Alert on error
    }
  };

  return (
    <div className="job-form-wrapper">
      <h2 className="job-form-title">Looking for interns? Post a Job now.</h2>
      <p className="job-form-subtitle">
        Make sure to fill all fields and enter accurate information. Everyone in the InternItUp will be able to see your job offer.
      </p>

      {userRole !== "hirer" ? (
        <p className="error-message">You must be a hirer to post a job.</p>
      ) : (
        <form className="job-posting-card" onSubmit={(e) => e.preventDefault()}>
          <h3 className="card-header">Job Posting Form</h3>

          {/* Form fields */}
          <label>
            <span className="label-title">Name of Business</span>
            <span className="label-sub">This is the name your company, organization, or association goes by.</span>
            <input
              type="text"
              name="companyName"
              placeholder="Ex: Lyceum of Subic Bay, Inc."
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span className="label-title">Employer's Name</span>
            <span className="label-sub">This is the name applicants will refer to.</span>
            <input
              type="text"
              name="employerName"
              placeholder="Ex: John B. Smith"
              value={formData.employerName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span className="label-title">Location</span>
            <span className="label-sub">Where is your company, organization, or association located.</span>
            <input
              type="text"
              name="location"
              placeholder="Ex: 34 Pas-Aas, Olongapo City, Zambales, Philippines"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </label>

          <div className="split-row">
            <label style={{ flex: 1 }}>
              <span className="label-title">Position</span>
              <span className="label-sub">Job title you're hiring for</span>
              <input
                type="text"
                name="position"
                placeholder="Ex: Senior Developer"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </label>

            <label style={{ flex: 1 }}>
              <span className="label-title">Offered Salary</span>
              <span className="label-sub">Enter salary in PHP</span>
              <input
                type="text"
                name="salary"
                placeholder="Ex: Php 100,000.00"
                value={formData.salary}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            <span className="label-title">Job Description/Details</span>
            <span className="label-sub">Job summary, job responsibilities...</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span className="label-title">Upload Job Image</span>
            <span className="label-sub">Image must be under 200KB (optional visual).</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
          </label>

          {imageError && <p className="error-message">{imageError}</p>}

          {formData.jobImage && (
            <div className="preview-container">
              <img src={formData.jobImage} alt="Job Preview" className="preview-image" />
            </div>
          )}

          <p className="disclaimer">Everyone in the InternItUp will see your job posting.</p>
          <button type="button" className="done-button" onClick={() => setShowConfirm(true)}>Done</button>
        </form>
      )}

      {showConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h2>
              <span className="confirm-title">Confirmation</span>{" "}
              <span className="confirm-subtext">You are about to post a Job Opportunity.</span>
            </h2>
            <div className="confirm-details">
              {[
                ["Company Name:", formData.companyName],
                ["Employer's Name:", formData.employerName],
                ["Location:", formData.location],
                ["Position:", formData.position],
                ["Offered Salary:", `Php ${Number(formData.salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
              ].map(([label, value], i) => (
                <div key={i} className="confirm-row">
                  <span className="confirm-label">{label}</span>
                  <span className="confirm-value">{value}</span>
                </div>
              ))}
            </div>

            <p className="confirm-prompt">Are these details correct?</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowConfirm(false)} className="cancel-btn">✖</button>
              <button onClick={handleSubmit} className="confirm-btn">✔</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Alert Modal Renderer */}
      <AlertModal message={alertMessage} onClose={closeAlert} />
    </div>
  );
};

export default JobForm;