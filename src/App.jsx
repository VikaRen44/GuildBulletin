import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import UploadCV from "./pages/UploadCV";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import CompleteProfile from "./pages/CompleteProfile";
import Admin from "./pages/Admin";
import Submissions from "./pages/Submissions";
import 'react-toastify/dist/ReactToastify.css';


const ProtectedRoute = ({ element, allowedRoles, userId }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role);
    }
    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/home" replace />;
  }

  return React.cloneElement(element, { userId });
};

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/register", "/complete-profile"];

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setUserRole(storedRole);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
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
          <Route path="/jobdetails" element={<JobDetail />} />

          {/* ✅ Existing hirer route */}
          <Route path="/hirer/:id" element={<Home />} />

          {/* ✅ New hirer profile with origin job tracking */}
          <Route path="/hirer/:id/from/:jobId" element={<Home />} />

          {/* ✅ Protected Routes */}
          <Route
            path="/submissions"
            element={<ProtectedRoute element={<Submissions />} allowedRoles={["hirer"]} />}
          />
          <Route
            path="/post-job"
            element={<ProtectedRoute element={<PostJob />} allowedRoles={["hirer"]} />}
          />
          <Route
            path="/upload-cv"
            element={<ProtectedRoute element={<UploadCV />} allowedRoles={["applicant"]} userId={userId} />}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute element={<Admin />} allowedRoles={["admin"]} />}
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
