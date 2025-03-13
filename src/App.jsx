import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import UploadCV from "./pages/UploadCV"; 
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import CompleteProfile from "./pages/CompleteProfile";
import Admin from "./pages/Admin"; 

const ProtectedRoute = ({ element, allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role) {
      setUserRole(role);
    }
    setLoading(false); // Stop loading after checking role
  }, []);

  if (loading) return <p>Loading...</p>; // Prevent redirecting while role is still loading

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/home" replace />;
  }

  return element;
};


const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {/* Hide Navbar on login and register pages */}
      {location.pathname !== "/login" && location.pathname !== "/register" && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setUserRole(storedRole);
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={userRole ? "/home" : "/login"} />} />
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />
          <Route path="/register" element={<CreateAccount />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/home" element={<Home />} />
          <Route path="/job/:id" element={<JobDetail />} />

          {/* Role-based Routes */}
          <Route path="/post-job" element={<ProtectedRoute element={<PostJob />} allowedRoles={["hirer"]} />} />
          <Route path="/upload-cv" element={<ProtectedRoute element={<UploadCV />} allowedRoles={["applicant"]} />} />
          <Route path="/admin" element={<ProtectedRoute element={<Admin />} allowedRoles={["admin"]} />} /> 
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
