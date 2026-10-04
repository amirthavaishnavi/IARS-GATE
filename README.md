# IARS-GATE
### Intelligent Adaptive Recommendation System for GATE Exam Readiness

An AI/ML-based system that analyzes a student's quiz performance against a
tagged GATE CSE previous-year-question (PYQ) bank, detects weak topics,
predicts risk areas using machine learning, and generates a personalized,
spaced-repetition revision plan.

---

## 1. Problem Statement

GATE CSE has 8 major subjects and 60+ sub-topics. Students revise
un-systematically — no clear signal on *which* topics are weak, *how urgently*
to revise them, or *what to practice next*. IARS-GATE closes this gap using a
hybrid rule-based + ML recommendation pipeline.

## 2. System Architecture

```
                     ┌─────────────────────┐
                     │   React Frontend     │
                     │  (Student Dashboard) │
                     └──────────┬───────────┘
                                │ REST API (Axios)
                     ┌──────────▼───────────┐
                     │  Node.js / Express    │
                     │      Backend API      │
                     └──────────┬───────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │                             │
       ┌─────────▼─────────┐        ┌─────────▼──────────┐
       │     MongoDB         │        │  Python ML Service  │
       │  - users             │        │  (Flask/FastAPI)    │
       │  - pyq_bank           │        │  - recommendation_   │
       │  - attempts           │◄──────►│    engine.py         │
       │  - recommendations    │  calls  │  - RandomForest model│
       └─────────────────────┘        └──────────────────────┘
```

- **Frontend (React)**: Dashboard showing weak topics, revision calendar,
  recommended next questions, progress charts.
- **Backend (Node/Express)**: Auth, quiz attempt logging, calls the Python ML
  microservice, stores results back in MongoDB.
- **ML Microservice (Python/Flask)**: Hosts `recommendation_engine.py` behind
  a `/recommend/<student_id>` endpoint. Keeps ML code isolated from the JS
  backend (best practice — avoids reimplementing scikit-learn in JS).
- **MongoDB**: Stores the PYQ bank, user attempts, and generated
  recommendations (matches your MERN stack experience directly).

## 3. Folder Structure

```
iars-gate/
├── dataset/
│   ├── gate_pyq_dataset.csv        # 150 tagged PYQs (subject/topic/difficulty)
│   └── student_attempts.csv        # Simulated quiz attempt history
├── src/
│   ├── generate_pyq_dataset.py     # PYQ dataset generator
│   ├── generate_student_data.py    # Student performance simulator
│   └── recommendation_engine.py    # Core AI/ML pipeline
├── output/
│   └── recommendation_output.json  # Sample generated recommendations
├── backend/                        # (to build) Node/Express API
│   ├── models/ (User.js, Attempt.js, PYQ.js)
│   ├── routes/ (attempts.js, recommend.js)
│   └── server.js
├── ml-service/                     # (to build) Flask wrapper around engine
│   └── app.py                      # exposes recommendation_engine as an API
└── frontend/                       # (to build) React dashboard
    └── src/components/ (WeakTopics.jsx, RevisionCalendar.jsx, ...)
```

## 4. ML Pipeline (`recommendation_engine.py`)

| Stage | Technique | Purpose |
|---|---|---|
| 1. Weak topic detection | Rule-based (accuracy + time thresholds) | Fast, explainable baseline signal |
| 2. Risk prediction | Random Forest Classifier (scikit-learn) | Predicts P(correct) for topic/difficulty combos student hasn't tried yet |
| 3. Related-topic suggestion | Content-based (subject co-occurrence) | Recommends adjacent topics to revise together |
| 4. Scheduling | Spaced repetition (rule-based date logic) | WEAK → revise in 1 day, MODERATE → 3 days, STRONG → 7 days |

**Why this combination (and not pure deep learning):** with a single
student's data, a heavy DL model would overfit instantly. Rule-based +
Random Forest is explainable (important for a viva/demo), realistic for the
data volume, and still qualifies as a genuine ML system — you can always
extend it to collaborative filtering once you have multiple students' data
(e.g., your GATE Hour group).

## 5. Sample Result (from `output/recommendation_output.json`)

Model holdout accuracy: **0.72** (Random Forest predicting correctness on unseen attempts)

**Top weak topics detected:** Normalization (0% acc), Transactions & Concurrency (0%),
Regular Expressions (11%), Dynamic Programming (11%), AVL Trees (22%), Deadlocks (22%)

**ML-flagged highest-risk topics for future questions:** Dynamic Programming,
Congestion Control, ER Model, Regular Expressions, Divide and Conquer

**Sample revision schedule:**
| Topic | Status | Accuracy | Revise On |
|---|---|---|---|
| Dynamic Programming | WEAK | 0.11 | Tomorrow |
| AVL Trees | WEAK | 0.22 | Tomorrow |
| Complexity Analysis (Big-O) | MODERATE | 0.71 | +3 days |
| Trees | STRONG | 1.00 | +7 days |

## 6. Extending with Real Data

- Replace `generate_pyq_dataset.py` output with real GATE PYQs (scrape/manually
  tag from GATE Overflow or official papers) — same CSV schema.
- Replace `generate_student_data.py` with real logged attempts from your
  MERN quiz app (`attempts` MongoDB collection export).
- Everything downstream (`recommendation_engine.py`) works unchanged.

## 7. How to Run

```bash
cd iars-gate
pip install pandas numpy scikit-learn
python3 src/generate_pyq_dataset.py
python3 src/generate_student_data.py
python3 src/recommendation_engine.py
```

Output is printed to console and saved to `output/recommendation_output.json`.
