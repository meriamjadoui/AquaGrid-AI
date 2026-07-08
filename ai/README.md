# AquaGrid-AI — Machine Learning Pipeline

This folder contains the complete, end-to-end Python Machine Learning pipeline for the AquaGrid-AI project. It complements the fast, in-browser AI engines by providing a robust, highly-accurate **Random Forest Classifier** designed specifically for real-time pipe leak detection.

## Why this exists

While the in-browser statistical models (`dashboard/src/ai/`) are extremely fast, they rely on manually tuned thresholds. This folder demonstrates a rigorous Machine Learning approach, where a `scikit-learn` model was genuinely fit to a large dataset of simulated sensor telemetry. It produces a serialized `.pkl` model with scientifically measured accuracy, precision, and recall metrics.

## Live Dashboard Integration

> [!TIP]
> **This model is fully integrated into the live dashboard.** 

The model trained in this pipeline (`model/leak_model.pkl`) is actively served by the Python Flask microservice (`backend/ml_service.py`). The React dashboard automatically routes real-time sensor data through the Node proxy to the Python inference server, falling back to the in-browser logic only if the microservice is offline.

## Folder Structure

```
ai/
├── generate_data.py        # Simulates 24,000 rows of sensor sessions + injects leak events
├── train.py                # Trains RandomForestClassifier, saves .pkl + metrics
├── predict.py              # Example standalone inference against the trained model
├── requirements.txt        # Python dependencies (scikit-learn, pandas, etc.)
├── data/
│   └── synthetic_leak_data.csv
└── model/
    ├── leak_model.pkl      # The active production model binary
    ├── metrics.md          # Scientific evaluation of model accuracy
    └── feature_importance.png
```

## How to Reproduce

You can completely recreate the synthetic dataset and retrain the model from scratch:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate the dataset (creates data/synthetic_leak_data.csv)
python3 generate_data.py

# 3. Train the model (writes model/leak_model.pkl + updates metrics.md)
python3 train.py

# 4. Run sample predictions to verify inference
python3 predict.py
```

## Results Summary

See [`model/metrics.md`](model/metrics.md) for full details. Headline test-set numbers:

| Metric    | Value  | Note |
|-----------|--------|------|
| **Accuracy**  | 85.2%   | Overall correctness |
| **Precision** | 53.9%   | Proportion of predicted leaks that were actual leaks |
| **Recall**    | 84.0%   | Proportion of actual leaks successfully caught |
| **F1 Score**  | 66.0%   | Harmonic mean of precision and recall |

The model is intentionally tuned toward **high recall** (catching real leaks) over precision. This is the optimal tradeoff for an industrial leak-detection system: a false alarm costs a wasted inspection, but a missed leak costs massive amounts of water, infrastructure damage, and money.
