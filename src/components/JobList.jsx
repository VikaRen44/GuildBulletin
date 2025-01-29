import JobCard from "./JobCard";

const jobs = [
  { id: 1, title: "Frontend Developer", company: "Google", location: "Remote" },
  { id: 2, title: "Backend Engineer", company: "Amazon", location: "New York" },
];

const JobList = () => {
  return (
    <div>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

export default JobList;
