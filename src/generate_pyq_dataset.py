"""
IARS-GATE: Previous Year Question (PYQ) Dataset Generator
Generates a realistic, topic-tagged GATE CSE question bank based on actual
GATE CSE syllabus structure and historical topic-weightage patterns.
"""

import csv
import random

random.seed(42)

# GATE syllabus structure: General Aptitude and Engineering Mathematics are
# COMMON to every GATE paper. Beyond that, each branch has its own CORE
# subjects. Together this lets the system serve a student from ANY branch:
# everyone gets Common questions, plus core questions matching their own branch.
SYLLABUS = {
    # ---- Common to every branch ----
    "General Aptitude": ["Verbal Ability", "Reading Comprehension", "Numerical Ability",
                          "Quantitative Reasoning", "Analytical Reasoning", "Data Interpretation"],
    "Engineering Mathematics": ["Linear Algebra", "Calculus", "Probability & Statistics",
                                "Differential Equations", "Discrete Mathematics", "Numerical Methods",
                                "Complex Variables", "Vector Calculus"],
    # ---- Branch-specific core subjects ----
    "CSE Core": ["Data Structures", "Algorithms", "Operating Systems", "DBMS",
                 "Computer Networks", "Theory of Computation", "Computer Organization"],
    "Mechanical Core": ["Thermodynamics", "Fluid Mechanics", "Strength of Materials",
                        "Manufacturing Processes", "Machine Design", "Theory of Machines"],
    "Civil Core": ["Structural Analysis", "Geotechnical Engineering", "Hydraulics",
                   "Environmental Engineering", "Surveying", "Concrete Technology"],
    "Electrical Core": ["Electric Circuits", "Power Systems", "Control Systems",
                        "Electrical Machines", "Power Electronics"],
    "ECE Core": ["Analog Electronics", "Digital Electronics", "Signals & Systems",
                "Communication Systems", "Electromagnetics"],
}

# Branch tag for each subject group - used to filter recommendations so a
# student only sees Common + their own branch's core subjects
SUBJECT_BRANCH = {
    "General Aptitude": "Common", "Engineering Mathematics": "Common",
    "CSE Core": "CSE", "Mechanical Core": "Mechanical", "Civil Core": "Civil",
    "Electrical Core": "Electrical", "ECE Core": "ECE",
}

# Real GATE weightage: Gen Aptitude (15) + Engg Maths (~13) are fixed for every
# branch; the remaining ~72 marks go to that branch's core subjects
SUBJECT_WEIGHTAGE = {
    "General Aptitude": 0.15, "Engineering Mathematics": 0.13,
    "CSE Core": 0.144, "Mechanical Core": 0.144, "Civil Core": 0.144,
    "Electrical Core": 0.144, "ECE Core": 0.144,
}

YEARS = list(range(2015, 2026))
DIFFICULTIES = ["Easy", "Medium", "Hard"]

TOTAL_QUESTIONS = 320

def generate_dataset():
    rows = []
    qid = 1
    subjects = list(SUBJECT_WEIGHTAGE.keys())
    weights = list(SUBJECT_WEIGHTAGE.values())

    for _ in range(TOTAL_QUESTIONS):
        subject = random.choices(subjects, weights=weights, k=1)[0]
        topic = random.choice(SYLLABUS[subject])
        year = random.choice(YEARS)
        marks = random.choice([1, 1, 2, 2, 2])  # GATE has more 2-markers weighted here for realism
        # Traditionally tougher topics skew toward higher difficulty for realism
        hard_topics = {"Differential Equations", "Complex Variables", "Probability & Statistics",
                       "Analytical Reasoning", "Vector Calculus", "Theory of Computation",
                       "Control Systems", "Structural Analysis", "Thermodynamics"}
        if topic in hard_topics:
            difficulty = random.choices(DIFFICULTIES, weights=[0.15, 0.35, 0.50])[0]
        else:
            difficulty = random.choices(DIFFICULTIES, weights=[0.35, 0.45, 0.20])[0]

        rows.append({
            "question_id": f"Q{qid:04d}",
            "year": year,
            "branch": SUBJECT_BRANCH[subject],
            "subject": subject,
            "topic": topic,
            "difficulty": difficulty,
            "marks": marks,
            "question_text": f"[{subject} - {topic}] GATE {year} style question ({marks} mark, {difficulty})",
        })
        qid += 1

    return rows


if __name__ == "__main__":
    data = generate_dataset()
    out_path = "/home/claude/iars-gate/dataset/gate_pyq_dataset.csv"
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(data[0].keys()))
        writer.writeheader()
        writer.writerows(data)
    print(f"Generated {len(data)} PYQs -> {out_path}")
