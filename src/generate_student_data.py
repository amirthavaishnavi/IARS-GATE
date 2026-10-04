"""
IARS-GATE: Student Performance Simulator
Simulates a realistic student's quiz attempt history against the PYQ bank.
In the real system, this data comes from actual quiz attempts logged via
the MERN backend (MongoDB collection: attempts).

Branch-aware: a student only attempts questions from "Common" subjects
(General Aptitude, Engineering Mathematics) plus their OWN branch's core
subjects - exactly like a real GATE aspirant would.
"""

import csv
import random

random.seed(7)

def load_pyqs(path):
    with open(path) as f:
        return list(csv.DictReader(f))

def simulate_student(pyqs, student_id="AMIRTHA01", branch="CSE"):
    """
    Simulate a student who is strong in some topics and weak in others.
    Only samples questions tagged 'Common' or matching the student's branch -
    a Mechanical student never sees CSE Core questions, and vice versa.
    """
    weak_topics = {"Differential Equations", "Complex Variables", "Probability & Statistics",
                   "Analytical Reasoning", "Vector Calculus", "Numerical Methods",
                   "Theory of Computation", "Operating Systems"}
    strong_topics = {"Verbal Ability", "Reading Comprehension", "Numerical Ability",
                     "Linear Algebra", "Calculus", "Data Interpretation",
                     "Data Structures", "Algorithms"}

    relevant_pyqs = [q for q in pyqs if q["branch"] in ("Common", branch)]

    by_topic = {}
    for q in relevant_pyqs:
        by_topic.setdefault(q["topic"], []).append(q)

    attempts = []
    for topic, qlist in by_topic.items():
        if topic in weak_topics:
            base_prob, n_attempts = 0.32, 9
        elif topic in strong_topics:
            base_prob, n_attempts = 0.90, 7
        else:
            base_prob, n_attempts = 0.63, 5

        for _ in range(n_attempts):
            q = random.choice(qlist)
            difficulty_penalty = {"Easy": 0.0, "Medium": 0.08, "Hard": 0.20}[q["difficulty"]]
            prob_correct = min(0.97, max(0.05, base_prob - difficulty_penalty))
            is_correct = 1 if random.random() < prob_correct else 0
            time_taken = round(random.uniform(30, 150) * (1.4 if is_correct == 0 else 1.0), 1)

            attempts.append({
                "student_id": student_id,
                "branch": branch,
                "question_id": q["question_id"],
                "subject": q["subject"],
                "topic": topic,
                "difficulty": q["difficulty"],
                "marks": q["marks"],
                "is_correct": is_correct,
                "time_taken_sec": time_taken,
            })
    return attempts


if __name__ == "__main__":
    pyqs = load_pyqs("/home/claude/iars-gate/dataset/gate_pyq_dataset.csv")
    # Demo student is CSE branch; change `branch` to "Mechanical", "Civil",
    # "Electrical", or "ECE" to simulate a student from another branch
    attempts = simulate_student(pyqs, branch="CSE")
    out_path = "/home/claude/iars-gate/dataset/student_attempts.csv"
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(attempts[0].keys()))
        writer.writeheader()
        writer.writerows(attempts)
    print(f"Simulated {len(attempts)} attempts -> {out_path}")
