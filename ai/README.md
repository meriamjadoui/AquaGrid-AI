# AquaGrid-AI — Trained Leak Detection Model (v2)

This folder contains a **genuinely trained** machine learning model for leak
detection, complementing the rule-based `leak_model.js` used in the live
dashboard (see `AI_ENGINE.md` in the project root for the v1 architecture).

## Why this exists

The current in-browser AI engine (`dashboard/src/ai/`) uses hand-coded
decision logic serialized as nested if/else JavaScript — fast and
dependency-free, but not actually fit to data. This folder demonstrates the
same problem solved with a real `scikit-learn` model trained on realistic
simulated sensor data, producing a genuine `.pkl` artifact with measured
accuracy, precision, recall, and a confusion matrix.

## Folder structure

```
ml/
├── generate_data.py       # Simulates sensor sessions + injects leak events
├── train.py                # Trains RandomForestClassifier, saves .pkl + metrics
├── predict.py               # Example inference against the trained model
├── requirements.txt
├── data/
│   └── synthetic_leak_data.csv
└── model/
    ├── leak_model.pkl
    ├── metrics.md
    └── feature_importance.png
```

## How to reproduce

```bash
pip install -r requirements.txt
python3 generate_data.py   # generates data/synthetic_leak_data.csv
python3 train.py           # trains model, writes model/leak_model.pkl + metrics.md
python3 predict.py         # example inference calls
```

## Results summary

See `model/metrics.md` for full details. Headline test-set numbers:

| Metric    | Value  |
|-----------|--------|
| Accuracy  | 0.85   |
| Precision | 0.54   |
| Recall    | 0.84   |
| F1 Score  | 0.66   |

The model is tuned toward **high recall** (catching real leaks) over
precision, which is the right tradeoff for a leak-detection system — a false
alarm costs a wasted check, a missed leak costs water and money.

## Known limitation

The model currently over-triggers on single-tick transient spikes (see
`predict.py`'s "Transient spike" example) rather than requiring a sustained
pattern. This is an honest artifact of training on synthetic data with only
~400 simulated sessions. With more training sequences (or real Firebase
sensor history), the `consecutivehigh` feature would be expected to gain more
weight and reduce this false-positive mode.

## Path to production

This model is currently **not wired into the live dashboard** — it's a
validated, offline proof of concept. The planned integration path (see
`architecture.md`) is:

1. Wrap `predict.py`'s logic in a FastAPI `/predict` endpoint
2. Deploy the API (e.g. Render, Railway, Hugging Face Spaces)
3. Replace the relevant call in `dashboard/src/ai/useAIEngine.js` with a
   `fetch()` to that endpoint, with a fallback to the existing rule-based
   logic if the API is unreachable
4. Retrain periodically on real sensor history logged via Firebase

This keeps the fast, offline-capable rule-based system as a reliable
fallback while introducing a genuinely trained model where it adds the most
value.
