import { useState } from "react";

const JobForm = () => {
  const [job, setJob] = useState({ title: "", company: "", location: "", description: "" });

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Job Posted:", job);
    alert("Job Posted Successfully! (This will be saved in Firebase later)");
  };

  return (
    <div>
      <h2>Post a Job</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Job Title" onChange={handleChange} required />
        <input type="text" name="company" placeholder="Company Name" onChange={handleChange} required />
        <input type="text" name="location" placeholder="Location" onChange={handleChange} required />
        <textarea name="description" placeholder="Job Description" onChange={handleChange} required></textarea>
        <button type="submit">Post Job</button>
      </form>
    </div>
  );
};

export default JobForm;
