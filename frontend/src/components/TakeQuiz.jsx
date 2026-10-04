import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";

// How many questions to sample per quiz session
const QUIZ_LENGTH = 20;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TakeQuiz({ studentId, branch }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(0);
  const [finished, setFinished] = useState(false);
  const questionStartTime = useRef(Date.now());
  const sessionId = useRef(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/questions/${branch}`);
        const sample = shuffleArray(res.data).slice(0, QUIZ_LENGTH);
        setQuestions(sample);
        setCurrent(0);
        setFinished(false);
        setSubmitted(0);
        questionStartTime.current = Date.now();
        sessionId.current = `${studentId}_${Date.now()}`;
      } catch (err) {
        setError("Could not load questions. Check that the Node backend is running.");
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [branch]);

  const submitAnswer = async (isCorrect) => {
    const q = questions[current];
    const timeTakenSec = Math.round((Date.now() - questionStartTime.current) / 1000);

    try {
      await axios.post(`${BACKEND_URL}/api/attempts`, {
        student_id: studentId,
        session_id: sessionId.current,
        branch: branch,
        question_id: q.question_id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        is_correct: isCorrect ? 1 : 0,
        time_taken_sec: timeTakenSec,
      });
      setSubmitted((s) => s + 1);
    } catch (err) {
      console.error("Failed to log attempt", err);
    }

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      questionStartTime.current = Date.now();
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className="loading">Loading quiz questions...</div>;
  if (error) return <div className="error">{error}</div>;
  if (questions.length === 0) return <div className="loading">No questions found for this branch.</div>;

  if (finished) {
    return (
      <div className="card">
        <h2>Quiz Complete!</h2>
        <p>You answered {submitted} questions for {branch}.</p>
        <p style={{ color: "#666" }}>
          Go back to the Dashboard tab and click "Get Recommendations" to see your
          real, personalized weak-topic analysis based on what you just answered.
        </p>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="card">
      <h2>Quick Self-Check Quiz — {branch}</h2>
      <p style={{ color: "#666", marginTop: "-8px" }}>
        Question {current + 1} of {questions.length}
      </p>

      <div style={{ padding: "20px 0" }}>
        <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>
          {q.subject} &middot; {q.difficulty} &middot; {q.marks} mark{q.marks > 1 ? "s" : ""}
        </div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "#002060" }}>
          {q.topic}
        </div>
        <p style={{ color: "#444", marginTop: "12px" }}>
          Think about a typical GATE-level question on this topic. Could you solve
          it correctly right now?
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => submitAnswer(true)}
          style={{
            flex: 1, padding: "14px", borderRadius: "8px", border: "none",
            background: "#2c5f2d", color: "white", fontSize: "15px", cursor: "pointer",
          }}
        >
          ✓ Yes, I know this
        </button>
        <button
          onClick={() => submitAnswer(false)}
          style={{
            flex: 1, padding: "14px", borderRadius: "8px", border: "none",
            background: "#b85042", color: "white", fontSize: "15px", cursor: "pointer",
          }}
        >
          ✗ No, I'd get this wrong
        </button>
      </div>
    </div>
  );
}

export default TakeQuiz;