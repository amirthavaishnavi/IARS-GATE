"""
IARS-GATE: Intelligent Adaptive Recommendation System for GATE Exam Readiness
Core Recommendation Engine

Pipeline:
1. RULE-BASED weak topic detection (accuracy & time thresholds)
2. ML CLASSIFIER (Random Forest) - predicts P(student gets a given topic/difficulty wrong)
3. CONTENT-BASED recommender - suggests related topics via co-occurrence similarity
4. SPACED REPETITION scheduler - assigns next revision dates based on urgency
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
import os

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PYQ_PATH = os.path.join(_BASE_DIR, "dataset", "gate_pyq_dataset.csv")
ATTEMPTS_PATH = os.path.join(_BASE_DIR, "dataset", "student_attempts.csv")

WEAK_ACCURACY_THRESHOLD = 0.55
SLOW_TIME_THRESHOLD_SEC = 150


# ---------- 1. RULE-BASED WEAK TOPIC DETECTION ----------
def detect_weak_topics(attempts_df):
    grouped = attempts_df.groupby("topic").agg(
        attempts=("is_correct", "count"),
        accuracy=("is_correct", "mean"),
        avg_time=("time_taken_sec", "mean"),
    ).reset_index()

    def classify(r):
        if r["accuracy"] < WEAK_ACCURACY_THRESHOLD:
            return "WEAK"
        if r["accuracy"] < 0.75:
            # borderline accuracy: slow solving time pushes it to WEAK, else MODERATE
            return "WEAK" if r["avg_time"] > SLOW_TIME_THRESHOLD_SEC else "MODERATE"
        return "STRONG"

    grouped["status"] = grouped.apply(classify, axis=1)
    return grouped.sort_values("accuracy")


# ---------- 2. ML CLASSIFIER: predict correctness probability ----------
def train_correctness_model(attempts_df):
    df = attempts_df.copy()
    le_subject = LabelEncoder()
    le_topic = LabelEncoder()
    le_diff = LabelEncoder()

    df["subject_enc"] = le_subject.fit_transform(df["subject"])
    df["topic_enc"] = le_topic.fit_transform(df["topic"])
    df["difficulty_enc"] = le_diff.fit_transform(df["difficulty"])

    X = df[["subject_enc", "topic_enc", "difficulty_enc", "marks", "time_taken_sec"]]
    y = df["is_correct"]

    # Safety: with very few quiz attempts, a normal train/test split can leave
    # too little data (or only one class) to train on. In that case, train
    # and evaluate on the same small sample instead of crashing.
    if len(df) < 5 or y.nunique() < 2:
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    clf = RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    return clf, (le_subject, le_topic, le_diff), acc, (X_test, y_test, y_pred)


def predict_weak_topics_ml(clf, encoders, pyq_df, student_branch, top_n=6):
    le_subject, le_topic, le_diff = encoders
    pyq_df = pyq_df.copy()
    pyq_df = pyq_df[pyq_df["branch"].isin(["Common", student_branch])]
    # Only keep rows whose subject/topic/difficulty were actually seen during
    # training - a quiz session that never touched a "Hard" question, for
    # example, means the model never learned that difficulty label, so those
    # rows must be dropped here instead of crashing the whole pipeline.
    pyq_df = pyq_df[pyq_df["topic"].isin(le_topic.classes_)]
    pyq_df = pyq_df[pyq_df["subject"].isin(le_subject.classes_)]
    pyq_df = pyq_df[pyq_df["difficulty"].isin(le_diff.classes_)]

    if pyq_df.empty:
        return pd.Series(dtype=float)

    pyq_df["subject_enc"] = le_subject.transform(pyq_df["subject"])
    pyq_df["topic_enc"] = le_topic.transform(pyq_df["topic"])
    pyq_df["difficulty_enc"] = le_diff.transform(pyq_df["difficulty"])
    pyq_df["time_taken_sec"] = 120  # assume average future attempt time

    X = pyq_df[["subject_enc", "topic_enc", "difficulty_enc", "marks", "time_taken_sec"]]
    proba = clf.predict_proba(X)

    # Safety: if every quiz answer so far was the same (all correct or all
    # wrong), the model only learned one class and predict_proba returns a
    # single column instead of two - use that column directly in that case.
    if proba.shape[1] == 2:
        pyq_df["prob_correct"] = proba[:, 1]
    else:
        only_class = clf.classes_[0]
        pyq_df["prob_correct"] = proba[:, 0] if only_class == 1 else 1 - proba[:, 0]

    topic_risk = pyq_df.groupby("topic")["prob_correct"].mean().sort_values()
    return topic_risk.head(top_n)


# ---------- 3. CONTENT-BASED RECOMMENDATION (topic co-occurrence in same subject) ----------
def recommend_related_topics(weak_topics, pyq_df, top_k=2):
    related = {}
    for topic in weak_topics:
        subj_rows = pyq_df[pyq_df["topic"] == topic]
        if subj_rows.empty:
            continue
        subject = subj_rows["subject"].iloc[0]
        siblings = pyq_df[(pyq_df["subject"] == subject) & (pyq_df["topic"] != topic)]["topic"].unique()
        related[topic] = list(siblings[:top_k])
    return related


# ---------- 4. SPACED REPETITION SCHEDULER ----------
def schedule_revisions(weak_summary):
    today = datetime.now()
    schedule = []
    for _, row in weak_summary.iterrows():
        if row["status"] == "WEAK":
            gap_days = 1
        elif row["status"] == "MODERATE":
            gap_days = 3
        else:
            gap_days = 7
        next_date = today + timedelta(days=gap_days)
        schedule.append({
            "topic": row["topic"],
            "status": row["status"],
            "accuracy": round(row["accuracy"], 2),
            "revise_on": next_date.strftime("%Y-%m-%d"),
        })
    return schedule


# ---------- MAIN PIPELINE ----------
def run_pipeline(student_id="AMIRTHA01", student_branch="CSE", attempts_records=None):
    pyq_df = pd.read_csv(PYQ_PATH)

    if attempts_records is not None:
        # Real attempts sent from Node/MongoDB (this quiz session's data)
        attempts_df = pd.DataFrame(attempts_records)
    else:
        # Fallback: old static CSV (only used if nothing is passed in)
        attempts_df = pd.read_csv(ATTEMPTS_PATH)
        attempts_df = attempts_df[attempts_df["student_id"] == student_id]

    if attempts_df.empty:
        raise ValueError("No quiz attempts found for this student. Take the quiz first.")

    attempts_df["is_correct"] = attempts_df["is_correct"].astype(int)
    attempts_df["time_taken_sec"] = pd.to_numeric(attempts_df["time_taken_sec"], errors="coerce").fillna(120)

    # Restrict the question bank to Common (General Aptitude + Engineering
    # Mathematics) plus the student's own branch core - so a Mechanical
    # student is never shown CSE questions and vice versa
    branch_pyq_df = pyq_df[pyq_df["branch"].isin(["Common", student_branch])]

    weak_summary = detect_weak_topics(attempts_df)
    clf, encoders, model_acc, _ = train_correctness_model(attempts_df)
    ml_risk_topics = predict_weak_topics_ml(clf, encoders, pyq_df, student_branch)

    weak_topic_names = weak_summary[weak_summary["status"] == "WEAK"]["topic"].tolist()
    related_topics = recommend_related_topics(weak_topic_names, branch_pyq_df)
    revision_schedule = schedule_revisions(weak_summary)

    attempted_qids = set(attempts_df["question_id"])
    next_questions = branch_pyq_df[
        (branch_pyq_df["topic"].isin(weak_topic_names)) & (~branch_pyq_df["question_id"].isin(attempted_qids))
    ].sort_values(by="difficulty", key=lambda s: s.map({"Easy": 0, "Medium": 1, "Hard": 2}))

    result = {
        "student_id": student_id,
        "branch": student_branch,
        "model_accuracy_on_holdout": round(model_acc, 3),
        "topic_performance_summary": weak_summary.round(3).to_dict(orient="records"),
        "ml_predicted_risk_topics": {k: round(v, 3) for k, v in ml_risk_topics.items()},
        "related_topics_to_revise": related_topics,
        "revision_schedule": revision_schedule,
        "recommended_next_questions": next_questions[["question_id", "subject", "topic", "difficulty", "marks"]]
            .head(10).to_dict(orient="records"),
    }
    return result


if __name__ == "__main__":
    output = run_pipeline()
    out_path = "/home/claude/iars-gate/output/recommendation_output.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(json.dumps(output, indent=2))