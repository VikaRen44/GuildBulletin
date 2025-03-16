import { Link } from "react-router-dom";

const JobCard = ({ job }) => {
  return (
    <Link to={`/job/${job.id}`} className="job-card"> {/* 🔹 Entire card is clickable */}
      <img src={job.imgSrc} alt={job.title} className="job-image" />
      <div className="job-info">
        <p className="job-title">{job.title}</p>
      </div>
    </Link>
  );
};

export default JobCard;
