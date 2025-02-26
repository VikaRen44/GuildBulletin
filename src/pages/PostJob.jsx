import { useState } from "react";
import "../Styles/stylehome.css"; // Import styles

const JobForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    employerName: "",
    location: "",
    position: "",
    salary: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Job Posted:", formData);
  };

  return (
    <div className="job-form-container">
      <div className="header-container">
        <h1 className="header">Post a New Job</h1>
      </div>
      <div className="form-container">
        <form className="form" onSubmit={handleSubmit}>
          <div className="row">
            <input 
              type="text" 
              name="companyName" 
              placeholder="Company Name" 
              value={formData.companyName} 
              onChange={handleChange} 
              className="input" 
            />
            <input 
              type="text" 
              name="employerName" 
              placeholder="Employer Name" 
              value={formData.employerName} 
              onChange={handleChange} 
              className="input" 
            />
          </div>
          <input 
            type="text" 
            name="location" 
            placeholder="Location" 
            value={formData.location} 
            onChange={handleChange} 
            className="full-input" 
          />
          <input 
            type="text" 
            name="position" 
            placeholder="Position" 
            value={formData.position} 
            onChange={handleChange} 
            className="full-input" 
          />
          <input 
            type="text" 
            name="salary" 
            placeholder="Offered Salary" 
            value={formData.salary} 
            onChange={handleChange} 
            className="full-input" 
          />
          <textarea 
            name="description" 
            placeholder="Job Summary, Job Responsibilities, etc..." 
            value={formData.description} 
            onChange={handleChange} 
            className="text-area" 
          />
          <button type="submit" className="submit-button">Post Listing</button>
        </form>
      </div>
    </div>
  );
};

export default JobForm;


