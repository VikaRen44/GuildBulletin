import React from "react";  // ✅ Ensure React is imported
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase"; // Import Firebase Auth
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

  return React.cloneElement(element, { userId }); // ✅ Pass userId as a prop
};

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/login" && location.pathname !== "/register" && <Navbar />}
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

    // Listen for Firebase Auth state changes
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

          {/* Role-based Routes */}
          <Route path="/submissions" element={<ProtectedRoute element={<Submissions />} allowedRoles={["hirer"]} />} />
          <Route path="/post-job" element={<ProtectedRoute element={<PostJob />} allowedRoles={["hirer"]} />} />
          <Route path="/upload-cv" element={<ProtectedRoute element={<UploadCV />} allowedRoles={["applicant"]} userId={userId} />} />
          <Route path="/admin" element={<ProtectedRoute element={<Admin />} allowedRoles={["admin"]} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
