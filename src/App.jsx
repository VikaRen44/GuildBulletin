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
  const userRole = localStorage.getItem("role");

  return userRole 
    ? allowedRoles.includes(userRole) 
      ? element 
      : <Navigate to="/home" replace />
    : <Navigate to="/login" replace />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/register"];

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false); // No need to fetch since localStorage is synchronous
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={userRole ? "/home" : "/login"} replace />} />
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />
          <Route path="/register" element={<CreateAccount />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/home" element={userRole ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/job/:id" element={userRole ? <JobDetail /> : <Navigate to="/login" replace />} />
          <Route path="/post-job" element={<ProtectedRoute element={<PostJob />} allowedRoles={["hirer"]} />} />
          <Route path="/upload-cv" element={<ProtectedRoute element={<UploadCV />} allowedRoles={["applicant"]} />} />
          <Route path="/admin" element={<ProtectedRoute element={<Admin />} allowedRoles={["admin"]} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
