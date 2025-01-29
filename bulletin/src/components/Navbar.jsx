import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#333", color: "white" }}>
      <h1>Job Bulletin</h1>
      <Link to="/" style={{ color: "white", marginRight: "1rem" }}>Home</Link>
      <Link to="/post-job" style={{ color: "white" }}>Post a Job</Link>
    </nav>
  );
};

export default Navbar;
