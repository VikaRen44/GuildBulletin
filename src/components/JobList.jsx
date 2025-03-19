import JobCard from "./JobCard";
import gothie from "../assets/gothie.jpg";
import blondie from "../assets/blondie.jpg";
import brunette from "../assets/brunette.jpg";

const jobsData = [
  { id: 1, title: "Averardo Bank Teller", company: "Ragunna & Co.", location: "Ragunna City", imgSrc: gothie },
  { id: 2, title: "Software Engineer", company: "Google", location: "Remote", imgSrc: blondie },
  { id: 3, title: "Graphic Designer", company: "Canva", location: "Manila", imgSrc: brunette },
];

const JobList = () => {
  return (
    <div className="job-list">
      {jobsData.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

export default JobList;

