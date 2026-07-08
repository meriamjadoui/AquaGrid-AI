# AquaWise — Hybrid AI Engine Deep Dive

This document explains every model in the AquaWise inference stack: what
problem it solves, how it was designed, how it works mathematically, and how
the different technologies integrate into a single unified dashboard.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow](#2-data-flow)
3. [Model 1 — Leak Detection (Python Microservice)](#3-model-1--leak-detection-python-microservice)
4. [Model 2 — Autoencoder Anomaly Detection (TF.js)](#4-model-2--autoencoder-anomaly-detection-tfjs)
5. [Model 3 — Predictive Maintenance (In-Browser)](#5-model-3--predictive-maintenance-in-browser)
6. [Model 4 — Water Quality pH Proxy (In-Browser)](#6-model-4--water-quality-ph-proxy-in-browser)
7. [Model 5 — Solar Energy Forecast + Panel Soiling (In-Browser)](#7-model-5--solar-energy-forecast--panel-soiling-in-browser)
8. [Model 6 — Conversational LLM (Google Gemini)](#8-model-6--conversational-llm-google-gemini)
9. [Central Hook — useAIEngine](#9-central-hook--useaiengine)
10. [Feature Engineering Summary](#10-feature-engineering-summary)

---

## 1. Architecture Overview

AquaWise employs a highly sophisticated **Hybrid AI Architecture** that runs inference across three completely different environments simultaneously, combining their results in real-time.

```
┌─────────────────────────────────────────────────────┐
│                  React Component Tree               │
│  App.jsx                                            │
│    └─ <AIProvider>  ← mounts useAIEngine() once     │
│         └─ <Router> → WaterPage / EnergyPage / AI   │
└───────────────────────────┬─────────────────────────┘
                            │ reads sensors every 3 s
┌───────────────────────────▼─────────────────────────┐
│               useAIEngine.js  (hook)                │
│  Runs all models synchronously & asynchronously     │
│  Pushes aiResults into Zustand store (setAiResults) │
└──┬──────────────┬────────────┬───────────────┬──────┘
   │              │            │               │
   ▼              ▼            ▼               ▼
Python API     TensorFlow.js   maintenance    energy_model
(Leak RF)      (Autoencoder)   (In-Browser)   (In-Browser)
```

1. **Python Flask Microservice:** High-accuracy Random Forest leak detection trained on a large dataset using `scikit-learn` (`ai/model/leak_model.pkl`).
2. **In-Browser Deep Learning:** A TensorFlow.js autoencoder that trains live in the browser without labeled data to find multivariate anomalies.
3. **In-Browser JS Forests:** Instant, zero-latency inference for maintenance, water quality, and solar forecasting using compiled JavaScript decision trees.
4. **Cloud LLM:** Google Gemini provides conversational reasoning on top of the statistical model outputs.

---

## 2. Data Flow

```
Zustand tick (3 s)
  └─▶ sensors = { flowRate, reservoirLevel, pumpMotorCurrent, ... }
        │
        ├─▶ Feature engineering (useAIEngine.js)
        │
        ├─▶ leak_model_service.predictLeakWithModel(...)
        │       └─▶ POST /api/predict-leak → Python ML Service
        │               └─▶ { isLeak, confidence }
        │
        ├─▶ adaptive_anomaly_model.autoencoder.predictAnomaly(...)
        │       └─▶ TensorFlow.js inference → anomalyScore (0-100)
        │
        ├─▶ maintenance_model.detect(...)
        │       └─▶ { state: 0|1|2, label }
        │
        └─▶ energy_model_v2.forecast(...)
                └─▶ { forecast (W), needsCleaning }

All results merged → store.setAiResults(...)
```

---

## 3. Model 1 — Leak Detection (Python Microservice)

**Files**: `backend/ml_service.py`, `dashboard/src/ai/leak_model_service.js`, `ai/train.py`

### Problem
Detect pipe leaks in real-time from water-flow telemetry without access to physical pressure sensors.

### Algorithm — Random Forest (scikit-learn)
A Random Forest Classifier trained on heavily engineered time-series features. Because this model requires a high degree of precision, it was trained using Python `scikit-learn` and saved as a `.pkl` file.

### Integration
The Node.js Express server acts as a proxy, forwarding requests from the React dashboard to the Python Flask microservice running on port 5001. If the Python microservice is offline, the React dashboard will seamlessly fall back to an older, rule-based inference engine (`leak_model.js`).

### Features

| Feature          | How it is computed                                   | Why it matters                             |
|------------------|------------------------------------------------------|--------------------------------------------||
| `currentloss`    | Raw `lossRatio` (`flowRate / reservoirLevel`)        | Immediate signal of abnormal loss rate     |
| `rollingmeanloss`| Mean of last 5 `lossRatio` values                    | Filters one-tick spikes                    |
| `rollingstdloss` | Std-dev of same window                               | High std = unstable flow = possible leak   |
| `consecutivehigh`| Ticks in a row where `lossRatio > 0.15`              | Confirms sustained anomaly vs noise        |

---

## 4. Model 2 — Autoencoder Anomaly Detection (TF.js)

**File**: `dashboard/src/ai/adaptive_anomaly_model.js`

### Problem
Not all anomalies are known in advance. We need a system that can detect weird behaviour across *all* sensors simultaneously, without any labeled training data.

### Algorithm — TensorFlow.js Deep Autoencoder
An autoencoder is a neural network trained to compress data into a bottleneck and reconstruct it. If a new state differs from the states the autoencoder was trained on, it will fail to reconstruct it accurately. The **reconstruction error** serves as an `anomalyScore`.

### Live Training
This model trains *in the browser* on the live data stream. It gathers baseline data when the system starts, trains a deep neural network silently in a background thread, and then activates to predict anomalies on every tick.

---

## 5. Model 3 — Predictive Maintenance (In-Browser)

**File**: `dashboard/src/ai/maintenance_model.js`

### Problem
Predict pump failure before it happens so maintenance can be scheduled proactively.

### Algorithm — Random Forest (15 trees)
Plurality voting across 15 trees compiled natively into JavaScript `if/else` branches for zero-latency execution.

### Features
| Feature                 | How it is computed                                        | Why it matters                                    |
|-------------------------|-----------------------------------------------------------|---------------------------------------------------|
| `efficiency`            | `current / max(flow, 0.5)` — A per L/min                  | Degrading efficiency is the earliest warning sign  |
| `rollingslopecurrent`   | Least-squares slope of last 5 current values              | Rising current trend = increasing load             |
| `rollingslopeefficiency`| Least-squares slope of last 5 efficiency values           | Rising slope = pump degrading over time            |

---

## 6. Model 4 — Water Quality pH Proxy (In-Browser)

**File**: `dashboard/src/ai/ph_model.js`

### Problem
Estimate water quality without a dedicated pH sensor. Sudden volumetric anomalies in the reservoir are used as a proxy for chemical disturbances.

### Algorithm — Random Forest (10 trees)
Plurality voting returning 0 (good), 1 (caution), or 2 (poor). Uses deviation metrics against a rolling baseline.

---

## 7. Model 5 — Solar Energy Forecast + Panel Soiling (In-Browser)

**File**: `dashboard/src/ai/energy_model_v2.js`

Contains **two** separate sub-models:
1. **Solar Current Forecaster — Gradient Boosted Trees (25 trees)**: GBT differs from a plain Random Forest in that each successive tree is trained on the residual error of the previous trees.
2. **Panel Soiling Detector — Random Forest (11 trees)**: Compares actual current output against the theoretical clear-sky maximum each tick and decides if panels are dirty.

---

## 8. Model 6 — Conversational LLM (Google Gemini)

**File**: `dashboard/src/chat/chatEngine.js`

### Problem
Statistical models (like Random Forests and Autoencoders) are excellent at finding numerical anomalies, but human operators need actionable, qualitative advice ("Why is the pump drawing so much power?").

### Algorithm — Large Language Model (Gemini)
We integrated Google's **Gemini 1.5 Flash** to serve as a conversational AI expert. Every time the user asks a question, we inject a **System Prompt** containing the **Live System State** (current flow rate, leak risks, anomaly scores, etc.). Gemini acts as a highly capable Agent that possesses perfect situational awareness of the water grid.

---

## 9. Central Hook — useAIEngine

**File**: `dashboard/src/ai/useAIEngine.js`

This React hook is the **single point of integration**. 
- It maintains rolling window buffers in `useRef` to prevent data loss across React renders.
- It calculates feature derivatives (like `rollingstdloss` or least-squares slopes).
- It executes all synchronous in-browser models.
- It triggers the asynchronous Python API requests and TensorFlow.js inference.
- It merges the final results and pushes them to the Zustand store.

---

## 10. Feature Engineering Summary

| Model        | Raw inputs                                          | Derived features                              |
|--------------|-----------------------------------------------------|-----------------------------------------------|
| Python Leak  | `flowRate`, `reservoirLevel`                        | `lossRatio`, rolling mean/std, consecutiveHigh|
| TF.js Anomaly| All sensors                                         | Normalised tensors                            |
| Maintenance  | `pumpMotorCurrent`, `flowRate`, `pumpTemp`          | `efficiency`, slope(current), slope(eff)      |
| pH Proxy     | `reservoirLevel`                                    | `deviation`, rolling mean/std of deviation    |
| Solar GBT    | `solarProduction`, `pumpMotorCurrent`, `hour`       | `hoursin/cos`, `cloudEstimate`, `irradiance`  |
| Panel RF     | computed `panelEfficiencyRatio`                     | `currentratio`, rolling mean, `consecutiveLow`|
