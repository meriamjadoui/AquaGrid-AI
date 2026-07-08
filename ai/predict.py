"""
predict.py
----------
Demonstrates loading the trained leak_model.pkl and running inference on
new sensor readings. This is what a future FastAPI /predict endpoint would
wrap (see architecture.md for the planned cloud deployment).

Usage:
    python3 predict.py
"""

import joblib
import pandas as pd

MODEL_PATH = "model/leak_model.pkl"
FEATURES = ["currentloss", "rollingmeanloss", "rollingstdloss", "consecutivehigh"]


def load_model():
    return joblib.load(MODEL_PATH)


def predict_leak(model, currentloss, rollingmeanloss, rollingstdloss, consecutivehigh):
    """
    Runs inference on a single tick of sensor-derived features.
    Mirrors the input contract of leak_model.js's detect() function.
    """
    X = pd.DataFrame(
        [[currentloss, rollingmeanloss, rollingstdloss, consecutivehigh]],
        columns=FEATURES,
    )
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0][1]
    return {
        "isLeak": bool(prediction),
        "confidence": round(float(probability), 4),
    }


if __name__ == "__main__":
    model = load_model()

    # Example 1: normal operation (low, stable loss ratio)
    normal_case = predict_leak(model, 0.05, 0.048, 0.005, 0)
    print("Normal operation:", normal_case)

    # Example 2: sustained high loss ratio (likely leak)
    leak_case = predict_leak(model, 0.28, 0.25, 0.03, 8)
    print("Suspected leak:  ", leak_case)

    # Example 3: single spike, not sustained (should NOT trigger high confidence)
    spike_case = predict_leak(model, 0.20, 0.09, 0.06, 1)
    print("Transient spike: ", spike_case)
