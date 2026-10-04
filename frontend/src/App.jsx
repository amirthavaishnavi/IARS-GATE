import React, { useState, useEffect } from "react";
import axios from "axios";
import TakeQuiz from "./components/TakeQuiz.jsx";
import Login from "./components/login.jsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const BACKEND_URL = "https://iars-gate-backend.onrender.com";
const BRANCHES = ["CSE", "Mechanical", "Civil", "Electrical", "ECE"];

const STATUS_COLORS = { WEAK: "#b85042", MODERATE: "#e7b10a", STRONG: "#2c5f2d" };

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("iars_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [branch, setBranch] = useState(user?.branch || "CSE");
  const [view, setView] = useState("dashboard"); // "dashboard" or "quiz"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLogin = (userData) => {
    localStorage.setItem("iars_user", JSON.stringify(userData));
    setUser(userData);
    setBranch(userData.branch);
  };

  const handleLogout = () => {
    localStorage.removeItem("iars_user");
    setUser(null);
    setData(null);
    setHasSearched(false);
    setView("dashboard");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const studentId = user.student_id;

  const fetchRecommendations = async (selectedBranch) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/recommend/${studentId}`, {
        params: { branch: selectedBranch },
      });
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Could not load recommendations. Make sure the Node backend (port 5000) and Flask ML service (port 5001) are both running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = () => {
    fetchRecommendations(branch);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>IARS-GATE Dashboard</h1>
        <p>Intelligent Adaptive Recommendation System for GATE Exam Readiness</p>
        <p style={{ fontSize: "13px", color: "#666" }}>
          Logged in as <strong>{user.name || studentId}</strong> ({studentId}){" "}
          <a href="#" onClick={handleLogout} style={{ marginLeft: "10px" }}>Log out</a>
        </p>
      </div>

      <div className="branch-select">
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {view === "dashboard" && (
          <button onClick={handleBranchChange}>Get Recommendations</button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => setView("dashboard")}
          style={{
            padding: "8px 20px", borderRadius: "8px", border: "1px solid #ccc",
            background: view === "dashboard" ? "#002060" : "white",
            color: view === "dashboard" ? "white" : "#002060", cursor: "pointer",
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView("quiz")}
          style={{
            padding: "8px 20px", borderRadius: "8px", border: "1px solid #ccc",
            background: view === "quiz" ? "#002060" : "white",
            color: view === "quiz" ? "white" : "#002060", cursor: "pointer",
          }}
        >
          Take Quiz
        </button>
      </div>

      {view === "quiz" && <TakeQuiz studentId={studentId} branch={branch} />}

      {view === "dashboard" && (
        <>
      {!hasSearched && !loading && (
        <div className="loading">
          No analysis yet. Take the quiz, then click "Get Recommendations" above
          to see your personalized weak-topic analysis.
        </div>
      )}
      {loading && <div className="loading">Loading recommendations...</div>}
      {error && <div className="error">{error}</div>}

      {data && !loading && !error && (
        <>
          <div className="model-accuracy">
            Model holdout accuracy: {(data.model_accuracy_on_holdout * 100).toFixed(0)}% &nbsp;|&nbsp; Branch: {data.branch}
          </div>

          <div className="card">
            <h2>Topic Accuracy Chart</h2>
            <ResponsiveContainer width="100%" height={Math.max(200, data.topic_performance_summary.length * 32)}>
              <BarChart
                data={data.topic_performance_summary.map((t) => ({
                  topic: t.topic,
                  accuracy: Math.round(t.accuracy * 100),
                  status: t.status,
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="topic" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                  {data.topic_performance_summary.map((t, i) => (
                    <Cell key={`cell-${i}`} fill={STATUS_COLORS[t.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2>Topic Performance Summary</h2>
            {data.topic_performance_summary.map((t) => (
              <div className="topic-row" key={t.topic}>
                <span>
                  {t.topic}
                  <span className="accuracy-text">
                    ({(t.accuracy * 100).toFixed(0)}% accuracy, {t.attempts} attempts)
                  </span>
                </span>
                <span className={`status-badge status-${t.status}`}>{t.status}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Revision Schedule</h2>
            {data.revision_schedule.map((r) => (
              <div className="topic-row" key={r.topic}>
                <span>{r.topic}</span>
                <span>
                  <span className={`status-badge status-${r.status}`}>{r.status}</span>{" "}
                  <span className="accuracy-text">Revise on: {r.revise_on}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Recommended Next Questions</h2>
            {data.recommended_next_questions.length === 0 && (
              <p style={{ color: "#666" }}>No new questions available - great job, keep revising!</p>
            )}
            {data.recommended_next_questions.map((q) => (
              <div className="question-item" key={q.question_id}>
                <span>
                  {q.question_id} &mdash; {q.topic} ({q.subject})
                </span>
                <span className="difficulty-tag">{q.difficulty}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Related Topics to Revise Together</h2>
            {Object.entries(data.related_topics_to_revise).map(([topic, related]) => (
              <div className="topic-row" key={topic}>
                <span>{topic}</span>
                <span className="accuracy-text">{related.join(", ") || "—"}</span>
              </div>
            ))}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

export default App;
