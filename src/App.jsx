import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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

/* 🔽 NEW: real-time ban watcher imports */
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "./firebase";
import AlertModal from "./components/AlertModal";
/* 🔼 END new imports */

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

/* 🔽 NEW: Always-on watcher that force-logs-out banned users and shows a modal */
const BanWatcher = () => {
  const [banMsg, setBanMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // cleanup any prior user doc subscription
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (!user) return;

      const ref = doc(db, "Users", user.uid);
      unsubUserDoc = onSnapshot(ref, async (snap) => {
        if (snap.exists() && snap.data()?.banned) {
          setBanMsg("🚫 Your account has been banned. You will be signed out.");
          try { await signOut(auth); } catch {}
          navigate("/login", { replace: true });
          // Clear any local role/id so ProtectedRoute blocks further access
          try { localStorage.removeItem("userRole"); } catch {}
          try { localStorage.removeItem("userId"); } catch {}
          window.dispatchEvent(new Event("storage"));
        }
      });
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      unsubAuth();
    };
  }, [navigate]);

  return <AlertModal message={banMsg} onClose={() => setBanMsg("")} />;
};
/* 🔼 END BanWatcher */

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/register", "/complete-profile"];

  return (
    <>
      {/* 🔽 keep the watcher mounted for the whole app */}
      <BanWatcher />
      {/* 🔼 */}
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
