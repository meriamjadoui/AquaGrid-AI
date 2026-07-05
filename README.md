# AquaGrid AI

**Smart Solar Water Management System — IoT, AI, and Real-Time Dashboard**

AquaGrid AI is an intelligent monitoring platform designed for solar-powered water infrastructure in rural communities across Tunisia and Africa. The system integrates water management, solar energy tracking, and **four live in-browser AI models** into a single, unified interface — enabling communities to supervise critical resources without requiring on-site technical expertise.

> **v2 — AI Integration complete.** All four ML models (Leak Detection, Predictive Maintenance, pH Quality, Solar Energy Forecast) are now wired directly into the React dashboard and run as pure JavaScript, with zero external inference dependencies.

---

## Project Structure

```
AquaGrid-AI/
├── dashboard/                   # React + Vite web dashboard
│   ├── src/
│   │   ├── ai/                  # ← NEW: in-browser AI model modules
│   │   │   ├── energy_model_v2.js      # GBT solar forecast + soiling RF
│   │   │   ├── maintenance_model.js    # RandomForest pump health (15 trees)
│   │   │   ├── ph_model.js             # RandomForest pH / contamination (11 trees)
│   │   │   ├── leak_model.js           # RandomForest leak detection (11 trees)
│   │   │   └── useAIEngine.js          # React hook — runs all 4 models on sensor tick
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── AIPage.jsx       # ← UPDATED: live model output cards
│   │   │   ├── WaterPage.jsx    # ← UPDATED: RF leak risk + pH quality KPIs
│   │   │   └── EnergyPage.jsx   # ← UPDATED: GBT solar forecast gauge
│   │   ├── hooks/
│   │   ├── store/
│   │   │   └── useStore.js      # ← UPDATED: aiResults field + setAiResults action
│   │   ├── App.jsx              # ← UPDATED: AIProvider wraps router
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── prototype/                   # ESP32 firmware and hardware documentation
└── docs/                        # Architecture and API documentation
```

---

## AI Engine — Deployed Models

All models run **entirely in the browser as pure JavaScript** — no Python runtime, no server, no WASM. Each model is a direct port of its trained Random Forest / Gradient Boosted Tree structure, encoded as a decision-tree array.

| Model | Algorithm | Trees | Input Features | Output |
|-------|-----------|-------|----------------|--------|
| **Leak Detection** | Random Forest | 11 | `lossRatio`, `rollingMean`, `consecutiveHighLoss` | `isLeak` (bool), confidence |
| **Predictive Maintenance** | Random Forest | 15 | `pumpMotorCurrent`, `flowRate`, `pumpTemp`, efficiency delta, slope | `state` (0 healthy / 1 warn / 2 critical), `label` |
| **pH / Water Quality** | Random Forest | 11 | `deviation`, `rollingMean`, `consecutiveDeviation` | `contaminated` (bool), deviation score |
| **Solar Energy Forecast** | Gradient Boosted Trees + Soiling RF | 25 + 5 | `solarProduction`, `pumpMotorCurrent`, `hour`, `efficiency` | `solarForecast` (W), `needsCleaning` (bool) |

### How Sensor Data Drives the Models

```
Sensor Tick (Zustand store update)
        │
        ▼
  useAIEngine.js (React hook)
  ┌─────────────────────────────────────────────┐
  │  makeLeakDetector        → leak risk         │
  │  makeMaintenanceDetector → pump health state │
  │  makePHDetector          → contamination     │
  │  makeEnergyForecaster    → solar forecast W  │
  └─────────────────────────────────────────────┘
        │
        ▼
  setAiResults() → Zustand store
        │
        ├── AIPage.jsx    (4 live model cards)
        ├── WaterPage.jsx (Leak Risk KPI, pH Quality KPI)
        └── EnergyPage.jsx (AI Solar Forecast gauge, Panel Health KPI)
```

- **Leak**: `lossRatio` derived from `flowRate` vs reservoir delta → 11-tree RF
- **Maintenance**: `pumpMotorCurrent`, `flowRate`, `pumpTemp` per session → 15-tree RF with rolling efficiency + slope features
- **pH**: deviation computed from reservoir level drift → 11-tree RF on rolling stats
- **Solar**: `solarProduction` (W), `pumpMotorCurrent`, `hour` → 25-tree GBT forecast + 5-tree soiling sub-model

---

## System Architecture

The platform is organized into four distinct layers, each responsible for a specific concern:

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Sensor Layer | YF-S201, HC-SR04, INA219, DS18B20 | Field data acquisition |
| IoT Controller | ESP32 (WiFi + BLE) | Sensor reading, data transmission, pump control |
| AI Engine | JS (RF + GBT, in-browser) | Leak detection, predictive maintenance, energy forecast, pH quality |
| Dashboard | React, Vite, Recharts, Zustand | Real-time monitoring, alerting, live AI inference |

---

## Dashboard Features

### Water Monitoring Page
- Reservoir level, flow rate, and total consumption tracking
- **AI Leak Risk KPI** — live RandomForest decision (replaces static value)
- **pH Water Quality KPI** — live contamination score from RF model
- Step-by-step model output panel showing raw RF inference details

### Energy Monitoring Page
- Solar production output, battery charge state, pump energy consumption
- **AI Solar Forecast gauge** — GBT model prediction in Watts
- **Panel Health KPI** — soiling RF sub-model (`needsCleaning` flag)
- AI Insights section: forecast vs actual, panel cleaning recommendation

### AI Insights Page
- **4 live model cards**: Leak Detection, Predictive Maintenance, pH Quality, Solar Forecast
- Model Stack table listing all 5 deployed trees with algorithm, tree count, and status
- Real-time inference results updated on every sensor tick

### System-Wide
- Alert system: overflow, leak, low battery, pump failure notifications
- Responsive design: mobile-first layout with dark and light mode support

---

## Getting Started

No new dependencies are required. All AI models run as pure JS — zero installation overhead.

```bash
# Clone the repository
git clone https://github.com/meriamjadoui/AquaGrid-AI.git
cd AquaGrid-AI

# Install frontend dependencies
cd dashboard
npm install

# Start the development server
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

---

## Technology Stack

| Domain | Tools and Frameworks |
|--------|----------------------|
| Frontend | React 18, Vite, Tailwind CSS v3, Recharts, Lucide React |
| State Management | Zustand |
| AI / ML (in-browser) | Pure JavaScript — Random Forest + Gradient Boosted Trees (no runtime required) |
| IoT Backend | Firebase Realtime Database / MQTT |
| Hardware | ESP32, 20–50W solar panel, 12V pump, 12V battery |

---

## Core Value Proposition

AquaGrid AI addresses a gap that existing enterprise solutions leave largely unserved: affordable, open-source infrastructure monitoring for off-grid communities. The platform simultaneously tracks water, energy, and equipment health — now with **live AI inference running entirely in the browser** — a combination not commonly found in open-source tooling.

The estimated hardware cost for a functional prototype sits between 100 and 120 TND, compared to commercial alternatives from vendors such as Grundfos or Xylem that can cost significantly more. This makes deployment viable for rural villages, schools, and agricultural operations that rely on borehole pumps and solar energy without permanent technical supervision.

---

## Target Use Cases

- Rural villages and farming communities in Tunisia and across Africa
- Off-grid schools and public facilities using solar-powered water infrastructure
- Development organizations and NGOs seeking low-cost water monitoring solutions

---

## License

This project is open-source. Contributions and feedback are welcome.
