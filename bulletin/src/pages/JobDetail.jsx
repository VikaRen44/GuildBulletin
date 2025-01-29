import { useParams } from "react-router-dom";

const jobs = [
  { id: 1, title: "Frontend Developer", company: "Google", location: "Remote", description: "Work with React and Firebase." },
  { id: 2, title: "Backend Engineer", company: "Amazon", location: "New York", description: "Develop REST APIs using Node.js." },
];

const JobDetail = () => {
  const { id } = useParams();
  const job = jobs.find((j) => j.id === parseInt(id));

  if (!job) {
    return <h2>Job not found</h2>;
  }

  return (
    <div>
      <h2>{job.title}</h2>
      <p><strong>Company:</strong> {job.company}</p>
      <p><strong>Location:</strong> {job.location}</p>
      <p><strong>Description:</strong> {job.description}</p>
    </div>
  );
};

export default JobDetail;
