import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import "../Styles/stylehome.css"; 

const MAX_FILE_SIZE = 200 * 1024; // 200KB limit

const JobForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    employerName: "",
    location: "",
    position: "",
    salary: "",
    description: "",
    jobImage: "", // Store image as Base64
  });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch role from Firestore
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

    // Convert salary input to a number before saving
    if (name === "salary") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") }); // Only allow numbers
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
        setImageError(""); // Clear error message
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== "hirer") {
      alert("Only hirers can post jobs.");
      return;
    }

    try {
      const userId = auth.currentUser.uid; // Get current hirer ID

      // ✅ Add the new job to Firestore
      await addDoc(collection(db, "jobs"), {
        ...formData,
        salary: Number(formData.salary), // Convert salary to number
        hirerId: userId,
        createdAt: serverTimestamp(),
      });

      // ✅ Update the user's job count inside the "users" collection
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // If user exists, update jobCount
        const userData = userSnap.data();
        await updateDoc(userRef, {
          jobCount: (userData.jobCount || 0) + 1, // Increment job count
        });
      }

      alert("Job Posted Successfully!");
      setFormData({
        companyName: "",
        employerName: "",
        location: "",
        position: "",
        salary: "",
        description: "",
        jobImage: "",
      });
    } catch (error) {
      alert("Error posting job: " + error.message);
    }
};

  

  return (
    <div className="job-form-container">
      <div className="header-container">
        <h1 className="header">Post a New Job</h1>
      </div>

      {userRole !== "hirer" ? (
        <p className="error-message">You must be a hirer to post a job.</p>
      ) : (
        <div className="form-container">
          <form className="form" onSubmit={handleSubmit}>
            <div className="row">
              <input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} className="input" required />
              <input type="text" name="employerName" placeholder="Employer Name" value={formData.employerName} onChange={handleChange} className="input" required />
            </div>
            <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="full-input" required />
            <input type="text" name="position" placeholder="Position" value={formData.position} onChange={handleChange} className="full-input" required />
            <input type="text" name="salary" placeholder="Offered Salary (Numeric Only)" value={formData.salary} onChange={handleChange} className="full-input" required />
            <textarea name="description" placeholder="Job Summary, Job Responsibilities, etc..." value={formData.description} onChange={handleChange} className="text-area" required />

            {/* Image Upload Field */}
            <label>Upload Job Image (Max: 200KB)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
            {imageError && <p className="error-message">{imageError}</p>}
            {formData.jobImage && <img src={formData.jobImage} alt="Job Preview" className="preview-image" />}

            <button type="submit" className="submit-button">Post Listing</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default JobForm;
