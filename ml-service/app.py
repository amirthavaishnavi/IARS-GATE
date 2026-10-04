"""
IARS-GATE ML Microservice
Exposes recommendation_engine.py as a REST API that the Node/Express
backend can call.

Run with:  python3 app.py
Runs on:   http://localhost:5001
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from recommendation_engine import run_pipeline
app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "IARS-GATE ML microservice"})


@app.route("/recommend/<student_id>", methods=["POST"])
def recommend(student_id):
    """
    Expects a JSON body: { "attempts": [ ...real MongoDB attempt records... ] }
    Query param: ?branch=CSE
    """
    try:
        branch = request.args.get("branch", "CSE")
        payload = request.get_json(silent=True) or {}
        attempts_records = payload.get("attempts", [])
        result = run_pipeline(student_id=student_id, student_branch=branch, attempts_records=attempts_records)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)