# AquaGrid-AI — AI Engine Deep Dive

This document explains every model in the AquaGrid-AI inference stack: what
problem it solves, how it was designed, how it works mathematically, and how
to read or extend the code.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow](#2-data-flow)
3. [Model 1 — Leak Detection](#3-model-1--leak-detection)
4. [Model 2 — Predictive Maintenance](#4-model-2--predictive-maintenance)
5. [Model 3 — Water Quality (pH Proxy)](#5-model-3--water-quality-ph-proxy)
6. [Model 4 — Solar Energy Forecast + Panel Soiling](#6-model-4--solar-energy-forecast--panel-soiling)
7. [Central Hook — useAIEngine](#7-central-hook--useaiengine)
8. [Rolling Window Helper](#8-rolling-window-helper)
9. [Feature Engineering Summary](#9-feature-engineering-summary)
10. [Adding a New Model](#10-adding-a-new-model)
11. [File Map](#11-file-map)

---

## 1. Architecture Overview

All AI inference runs **entirely in the browser** as plain synchronous
JavaScript. There is no server, no Python runtime, no WASM blob, and no
external API call. The trained decision trees are serialised directly as
nested `if/else` JavaScript functions.

```
┌─────────────────────────────────────────────────────┐
│                  React Component Tree                │
│  App.jsx                                            │
│    └─ <AIProvider>  ← mounts useAIEngine() once     │
│         └─ <Router> → WaterPage / EnergyPage / AI   │
└───────────────────────────┬─────────────────────────┘
                            │ reads sensors every 3 s
┌───────────────────────────▼─────────────────────────┐
│               useAIEngine.js  (hook)                 │
│  Runs 4 models synchronously on each sensor update  │
│  Pushes aiResults into Zustand store (setAiResults) │
└──┬──────────────┬────────────┬───────────────┬──────┘
   │              │            │               │
   ▼              ▼            ▼               ▼
leak_model   maintenance    ph_model     energy_model_v2
   .js          _model.js     .js              .js
```

---

## 2. Data Flow

```
Zustand tick (3 s)
  └─▶ sensors = { flowRate, reservoirLevel, pumpMotorCurrent,
                  pumpTemp, solarProduction }
        │
        ├─▶ Feature engineering (useAIEngine.js)
        │
        ├─▶ leak_model.detect(lossRatio)
        │       └─▶ { isLeak, rollingMean, consecutiveHigh }
        │
        ├─▶ maintenance_model.detect(current, flow, temp)
        │       └─▶ { state: 0|1|2, label }
        │
        ├─▶ ph_model.detect(reservoirLevel)
        │       └─▶ { quality: 0|1|2, label, deviation }
        │
        └─▶ energy_model_v2.forecast({ solarProduction, … })
                └─▶ { forecast (W), needsCleaning }

All results merged → store.setAiResults({ leak, maintenance, ph,
                                          solarForecast, panel })

Consumers:
  AIPage.jsx       ← displays all 4 model result cards
  WaterPage.jsx    ← Leak Risk KPI, pH Quality KPI
  EnergyPage.jsx   ← AI Solar Forecast gauge, Panel Health badge
  useStore.js      ← drives alert rules (leak_detected, pump_critical)
```

---

## 3. Model 1 — Leak Detection

**File**: `dashboard/src/ai/leak_model.js`

### Problem
Detect pipe leaks in real-time from water-flow telemetry without access to
physical pressure sensors. A leak manifests as more water leaving the system
than the reservoir-level drop alone would explain.

### Input signal
```
lossRatio = flowRate / max(reservoirLevel, 1)
```
When the pipes are intact, flowRate and reservoirLevel move together;
a high lossRatio means water is disappearing.

### Algorithm — Random Forest (11 trees)

Each tree is a binary decision tree that returns 0 (no leak) or 1 (leak).
The final prediction is a majority vote:
```
prediction = sum(votes) / 11 > 0.5 ? 1 : 0
```

### Features

| Feature          | How it is computed                                   | Why it matters                             |
|------------------|------------------------------------------------------|--------------------------------------------||
| `currentloss`    | Raw `lossRatio` for this tick                        | Immediate signal of abnormal loss rate     |
| `rollingmeanloss`| Mean of last 5 `lossRatio` values                   | Filters one-tick spikes                    |
| `rollingstdloss` | Std-dev of same window                               | High std = unstable flow = possible leak   |
| `consecutivehigh`| Ticks in a row where `lossRatio > 0.15`              | Confirms sustained anomaly vs noise        |

### Stateful detector
`makeLeakDetector()` returns a closure that owns its ring buffer so feature
engineering is encapsulated entirely inside the model file.

### Output
```js
{ isLeak: boolean, rollingMean: number, consecutiveHigh: number }
```

---

## 4. Model 2 — Predictive Maintenance

**File**: `dashboard/src/ai/maintenance_model.js`

### Problem
Predict pump failure before it happens so maintenance can be scheduled
proactively rather than reactively.

### Algorithm — Random Forest (15 trees)

Plurality voting across 15 trees. Each tree returns 0, 1, or 2:
```
state = argmax([count_0, count_1, count_2])
```

### Features

| Feature                 | How it is computed                                        | Why it matters                                    |
|-------------------------|-----------------------------------------------------------|---------------------------------------------------|
| `currentavg`            | Motor current this tick (A)                               | Higher current = pump working harder               |
| `flowavg`               | Flow rate this tick (L/min)                               | Low flow + high current = resistance in system     |
| `tempavg`               | Pump housing temperature (°C)                             | Overheating precedes bearing failure               |
| `efficiency`            | `current / max(flow, 0.5)` — A per L/min                  | Degrading efficiency is the earliest warning sign  |
| `rollingslopecurrent`   | Least-squares slope of last 5 current values              | Rising current trend = increasing load             |
| `rollingslopeefficiency`| Least-squares slope of last 5 efficiency values           | Rising slope = pump degrading over time            |

The `slope()` helper uses ordinary least-squares on the index axis:
```
slope = Σ((xᵢ - x̄)(yᵢ - ȳ)) / Σ((xᵢ - x̄)²)
```

### Output
```js
{ state: 0 | 1 | 2, label: 'healthy' | 'warning' | 'critical' }
```

---

## 5. Model 3 — Water Quality (pH Proxy)

**File**: `dashboard/src/ai/ph_model.js`

### Problem
Estimate water quality without a dedicated pH sensor. Anomalous reservoir-level
behaviour (sudden swings relative to the rolling baseline) is used as a proxy
for chemical disturbances that in real networks correlate with pH excursions.

### Algorithm — Random Forest (10 trees)

Plurality voting returning 0 (good), 1 (caution), or 2 (poor).

### Features

| Feature          | How it is computed                                          | Why it matters                             |
|------------------|-------------------------------------------------------------|--------------------------------------------||
| `deviation`      | `|level - rollingMean| / max(rollingMean, 1)`               | Normalised instantaneous anomaly magnitude |
| `rollingmeandev` | Mean deviation over last 5 ticks                            | Sustained vs transient anomaly             |
| `rollingstddev`  | Std-dev of deviation over same window                       | Volatile deviation = higher quality risk   |
| `consecutivedev` | Consecutive ticks where `deviation > 0.05`                  | Confirms persistent rather than spike      |

### Output
```js
{ quality: 0 | 1 | 2, label: 'good' | 'caution' | 'poor', deviation: number }
```

---

## 6. Model 4 — Solar Energy Forecast + Panel Soiling

**File**: `dashboard/src/ai/energy_model_v2.js`

This file contains **two** separate sub-models.

### 6a. Solar Current Forecaster — Gradient Boosted Trees (25 trees)

GBT differs from a plain Random Forest in that each successive tree is trained
on the **residual error** of the previous trees, not independently. The final
prediction is the sum (not average) of all tree outputs, starting from a base
estimate.

```
forecastCurrent = ftree0(f) + ftree1(f) + … + ftree24(f)
```

This additive correction gives GBT better accuracy on smooth continuous
targets (solar current as a function of time-of-day and irradiance) compared
to a plain RF.

#### Features

| Feature              | How it is computed                                               | Why it matters                                    |
|----------------------|------------------------------------------------------------------|---------------------------------------------------|
| `hoursin`/`hourcos`  | `sin(2π·h/24)` and `cos(2π·h/24)`                               | Cyclic encoding — avoids 23→0 discontinuity       |
| `irradiancenow`      | `solarProduction × 10` (proxy)                                   | Direct correlation with output current            |
| `cloudestimate`      | `irradiance / clearSkyIrradiance(hour)`, clamped to [0, 1.3]    | Accounts for cloud cover reducing output          |
| `prevhourirradiance` | `irradiance × 0.95` (simple lag proxy)                           | Temporal context for trend continuation           |
| `currentnow`         | `pumpMotorCurrent`                                               | Load-aware correction (high load → less net power)|

Clear-sky model:
```
clearSky(h) = 900 × sin(π × (h - 6) / 12)   for 6 ≤ h ≤ 18, else 0
```

### 6b. Panel Soiling Detector — Random Forest (11 trees)

Compares actual current output against the theoretical clear-sky maximum each
tick and decides if panels are dirty.

#### Features

| Feature           | Description                                               |
|-------------------|-----------------------------------------------------------|
| `currentratio`    | `actualCurrent / expectedCurrent` this tick              |
| `rollingmeanratio`| Mean ratio over last `PANEL_WINDOW` (5) ticks             |
| `consecutivelow`  | Consecutive ticks where `ratio < 0.75`                    |

#### Output
```js
// Panel detector
{ needsCleaning: boolean, ratio: number | null, rollingMean: number }

// Combined forecaster (makeEnergyForecaster)
{ forecast: number (Watts), needsCleaning: boolean }
```

---

## 7. Central Hook — useAIEngine

**File**: `dashboard/src/ai/useAIEngine.js`

This React hook is the **single point of integration** between the live sensor
stream and all four models. It runs inside `<AIProvider>` which is mounted
once at the app root.

### Lifecycle

```
Mount:
  Instantiate 4 model detectors (one each via useRef so they persist across renders)
  Allocate 5 rolling-window useRef buffers

Every sensor tick (useEffect dependency on `sensors`):
  1. Compute lossRatio and leak features → call detectLeak
  2. Compute efficiency + slope features → call detectMaintenance
  3. Compute reservoir deviation features → call detectPH
  4. Compute solar efficiency ratio → call forecastEnergy
  5. Call setAiResults() with all four results in one Zustand update
```

### Why `useRef` for model instances?

Model factories (`makeLeakDetector`, etc.) are stateful — they own internal
ring buffers. If they were re-created on every render, history would be lost.
`useRef` guarantees a single instance that lives as long as the component.

### AIProvider

```jsx
// In App.jsx
import { AIProvider } from './ai/useAIEngine'

<AIProvider>
  <RouterProvider router={router} />
</AIProvider>
```

`AIProvider` is a thin wrapper component that calls `useAIEngine()` so the
hook is always active regardless of which page is currently rendered.

---

## 8. Rolling Window Helper

```js
function pushWindow(ref, value, size = 10) {
  ref.current = [...ref.current, value].slice(-size)
  return ref.current
}
```

Appends a new value to a `useRef`-backed array and trims it to the last `size`
elements. Returns the current window so the caller can immediately compute
statistics on it.

---

## 9. Feature Engineering Summary

| Model        | Raw inputs                                          | Derived features                              |
|--------------|-----------------------------------------------------|-----------------------------------------------|
| Leak         | `flowRate`, `reservoirLevel`                        | `lossRatio`, rolling mean/std, consecutiveHigh|
| Maintenance  | `pumpMotorCurrent`, `flowRate`, `pumpTemp`          | `efficiency`, slope(current), slope(eff)      |
| pH / Quality | `reservoirLevel`                                    | `deviation`, rolling mean/std of deviation    |
| Solar GBT    | `solarProduction`, `pumpMotorCurrent`, `hour`       | `hoursin/cos`, `cloudEstimate`, `irradiance`  |
| Panel RF     | computed `panelEfficiencyRatio`                     | `currentratio`, rolling mean, `consecutiveLow`|

---

## 10. Adding a New Model

1. **Create** `dashboard/src/ai/my_model.js`
   - Write a `predictX(features)` ensemble function
   - Export a `makeXDetector()` factory that owns its ring buffer
2. **Import** in `useAIEngine.js`:
   ```js
   import { makeXDetector } from './my_model'
   const detectX = useRef(makeXDetector()).current
   ```
3. **Compute features** inside the `useEffect` body
4. **Call** `detectX(features)` and include the result in `setAiResults()`
5. **Update the Zustand store** type in `useStore.js` to add the new field
6. **Consume** in the relevant page component

---

## 11. File Map

```
dashboard/src/
├── ai/
│   ├── leak_model.js          Random Forest — 11 trees — leak 0/1
│   ├── maintenance_model.js   Random Forest — 15 trees — health 0/1/2
│   ├── ph_model.js            Random Forest — 10 trees — quality 0/1/2
│   ├── energy_model_v2.js     GBT 25 trees (forecast) + RF 11 trees (soiling)
│   └── useAIEngine.js         Central hook + AIProvider component
├── store/
│   └── useStore.js            Zustand store (sensors, aiResults, alerts)
└── pages/
    ├── AIPage.jsx             AI Insights dashboard (all 4 model cards)
    ├── WaterPage.jsx          Water management (Leak Risk + pH KPIs)
    └── EnergyPage.jsx         Energy management (Solar Forecast + Panel Health)
```
