"""
ml_service.py
--------------
Minimal Flask microservice that loads the trained leak_model.pkl and
exposes a single /predict endpoint. Runs alongside the existing Node/Express
backend on a separate port — does not touch server.js's core logic.

Run:
    pip install flask joblib pandas scikit-learn --break-system-packages
    python3 ml_service.py

The service listens on http://localhost:5001/predict
"""

from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "model", "leak_model.pkl")
FEATURES = ["currentloss", "rollingmeanloss", "rollingstdloss", "consecutivehigh"]

model = joblib.load(MODEL_PATH)


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)

    missing = [f for f in FEATURES if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    X = pd.DataFrame([[data[f] for f in FEATURES]], columns=FEATURES)
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0][1]

    return jsonify({
        "isLeak": bool(prediction),
        "confidence": round(float(probability), 4),
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


if __name__ == "__main__":
    print("🧠 ML service starting on http://localhost:5001")
    app.run(port=5001, debug=False)
