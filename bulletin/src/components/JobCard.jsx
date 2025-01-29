import { Link } from "react-router-dom";

const JobCard = ({ job }) => {
  return (
    <div style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
      <h3>{job.title}</h3>
      <p>{job.company} - {job.location}</p>
      <Link to={`/job/${job.id}`}>View Details</Link>
    </div>
  );
};

export default JobCard;
