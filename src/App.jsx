import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";  // Import PostJob page

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/post-job" element={<PostJob />} />  {/* New Route */}
      </Routes>
    </Router>
  );
};

export default App;
