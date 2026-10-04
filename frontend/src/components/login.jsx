import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://iars-gate-backend.onrender.com";
const BRANCHES = ["CSE", "Mechanical", "Civil", "Electrical", "ECE"];

function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { student_id: studentId, password }
          : { student_id: studentId, name, password, branch };
      const res = await axios.post(`${BACKEND_URL}${url}`, payload);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "380px", margin: "80px auto", padding: "24px" }} className="card">
      <h2 style={{ textAlign: "center" }}>{mode === "login" ? "Student Login" : "Create Account"}</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: "12px" }}>
          <label>Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: "12px" }}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: "12px" }}>
            <label>Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="error" style={{ marginBottom: "12px" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px" }}>
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Register"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "16px" }}>
        {mode === "login" ? (
          <>Don't have an account? <a href="#" onClick={() => setMode("register")}>Register</a></>
        ) : (
          <>Already have an account? <a href="#" onClick={() => setMode("login")}>Log In</a></>
        )}
      </p>
    </div>
  );
}

export default Login;
