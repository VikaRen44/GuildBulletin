import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import UploadCV from "./pages/UploadCV"; // ✅ New Upload CV page
import Login from "./pages/Login";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Only show Navbar if NOT on the login page */}
      {location.pathname !== "/login" && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/job/:id" element={<JobDetail />} />
          
          {/* ✅ Conditionally accessible pages based on role */}
          <Route path="/post-job" element={<PostJob />} /> {/* For Hirers */}
          <Route path="/upload-cv" element={<UploadCV />} /> {/* For Applicants */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

