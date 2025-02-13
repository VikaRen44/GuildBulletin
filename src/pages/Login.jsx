import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../auth";

function LoginRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("applicant");
  const navigate = useNavigate();

  const handleRegister = async () => {
    await registerUser(email, password, role);
    localStorage.setItem("userRole", role);
    navigate("/home"); // Redirect to home after successful registration
  };

  const handleLogin = async () => {
    const userRole = await loginUser(email, password);
    if (userRole) {
      localStorage.setItem("userRole", userRole);
      navigate("/home"); // Redirect to home after successful login
    } else {
      alert("Invalid credentials! Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Account Management</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <br />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <br />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="applicant">Applicant</option>
        <option value="hire">Hire</option>
        <option value="admin">Admin</option>
      </select>
      <br />
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginRegister; // Export only LoginRegister (not wrapped in a second Router)

