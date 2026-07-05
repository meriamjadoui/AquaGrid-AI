# AquaWise

**Smart Solar-Powered Water Management System — AI · IoT · Real-Time Dashboard**

[![Live Demo](https://img.shields.io/badge/demo-live-26BDE2?style=flat-square)](https://github.com/meriamjadoui/AquaGrid-AI)
[![License: MIT](https://img.shields.io/badge/license-MIT-3F7E44?style=flat-square)](#license)
[![SDG 6](https://img.shields.io/badge/SDG-6%20Clean%20Water-26BDE2?style=flat-square)](https://sdgs.un.org/goals/goal6)
[![SDG 7](https://img.shields.io/badge/SDG-7%20Clean%20Energy-FCC30B?style=flat-square&labelColor=555)](https://sdgs.un.org/goals/goal7)

> AquaWise is an open-source smart water management platform that solves a critical challenge faced by rural communities in Africa: **the lack of continuous monitoring over solar-powered water infrastructure**. Without real-time oversight, leaks, pump failures, reservoir overflow, and energy waste go unnoticed until serious damage is done.

By combining **four live in-browser AI models** with real-time IoT sensor data, AquaWise helps communities:
- 💧 Reduce water losses through early leak detection
- ⚡ Optimize solar energy use with AI-driven pump scheduling
- 🔧 Prevent pump failures through predictive maintenance
- 📊 Lower operational costs with automated decision support
- 🌍 Enhance access to clean water for off-grid communities

---

## Table of Contents

1. [Mission & SDG Alignment](#mission--sdg-alignment)
2. [System Architecture](#system-architecture)
3. [Project Structure](#project-structure)
4. [AI Engine](#ai-engine)
5. [Dashboard Pages](#dashboard-pages)
6. [Hardware Setup](#hardware-setup)
7. [Getting Started](#getting-started)
8. [Technology Stack](#technology-stack)
9. [Impact Metrics](#impact-metrics)
10. [Contributing](#contributing)
11. [License](#license)

---

## Mission & SDG Alignment

AquaWise directly contributes to five United Nations Sustainable Development Goals:

| SDG | Goal | How AquaWise Contributes |
|-----|------|--------------------------|
| ![#26BDE2](https://img.shields.io/badge/-SDG%206-26BDE2) **6** | Clean Water & Sanitation | Real-time reservoir & pipeline monitoring reduces water loss and ensures safe water quality via pH detection |
| ![#FCC30B](https://img.shields.io/badge/-SDG%207-FCC30B) **7** | Affordable & Clean Energy | Solar production tracking, battery analytics, and AI scheduling maximise renewable energy yield |
| ![#FD6925](https://img.shields.io/badge/-SDG%209-FD6925) **9** | Industry, Innovation & Infrastructure | In-browser AI models enable predictive maintenance to keep rural infrastructure resilient without external expertise |
| ![#FD9D24](https://img.shields.io/badge/-SDG%2011-FD9D24) **11** | Sustainable Cities & Communities | AI-driven pump scheduling ensures equitable water distribution timed to solar availability |
| ![#3F7E44](https://img.shields.io/badge/-SDG%2013-3F7E44) **13** | Climate Action | Reduced leakage and optimal solar utilisation lower the carbon footprint of water delivery |

---

## System Architecture

The platform is structured in four distinct layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│  SENSOR LAYER                                                        │
│  YF-S201 (flow) · HC-SR04 (reservoir) · INA219 (power) ·            │
│  DS18B20 (temp) · pH sensor                                          │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Serial / I²C
┌────────────────────▼────────────────────────────────────────────────┐
│  IoT CONTROLLER — ESP32                                              │
│  Reads sensors every 3 s · Controls pump relay                      │
│  Transmits data via WiFi → Firebase RTDB / MQTT                     │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────▼────────────────────────────────────────────────┐
│  REACT DASHBOARD  (Vite · Zustand · Recharts · Tailwind CSS)        │
│  Real-time sensor display · Alert system · Audit log                │
│  Manual pump control · Theme toggle (light/dark)                    │
└────────────────────┬────────────────────────────────────────────────┘
                     │ in-process JS call (no HTTP)
┌────────────────────▼────────────────────────────────────────────────┐
│  IN-BROWSER AI ENGINE  (Pure JavaScript — zero runtime deps)        │
│  Leak RF · Maintenance RF · pH RF · Solar GBT + Soiling RF          │
│  Runs on every sensor tick · Results fed back to UI & alert rules   │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **AI in-browser (no server)** | Rural deployments often lack reliable server infrastructure; browser execution needs only a phone or tablet |
| **Simulated sensor data** | Full physics-based ESP32 simulator allows the dashboard to demonstrate all functionality without physical hardware |
| **Zustand (not Redux)** | Minimal boilerplate, direct store access from AI hook and alert rules, easy to extend |
| **Recharts (not D3)** | React-native, responsive out of the box, sufficient for time-series sensor data |

---

## Project Structure

```
AquaGrid-AI/
├── README.md                        ← You are here
│
├── dashboard/                       ← React + Vite web application
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                 ← App entry point
│       ├── App.jsx                  ← Router, layout, AIProvider wrapper
│       ├── index.css                ← Design tokens (SDG colors, surfaces, spacing)
│       │
│       ├── ai/                      ← In-browser AI model modules
│       │   ├── energy_model_v2.js   ← GBT solar forecast (25 trees) + soiling RF (5 trees)
│       │   ├── maintenance_model.js ← Random Forest pump health (15 trees)
│       │   ├── ph_model.js          ← Random Forest pH/contamination (11 trees)
│       │   ├── leak_model.js        ← Random Forest leak detection (11 trees)
│       │   └── useAIEngine.js       ← React hook: runs all models on every sensor tick
│       │
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── AppShell.jsx     ← Main layout wrapper (sidebar + topbar + content)
│       │   │   ├── Sidebar.jsx      ← Navigation sidebar with collapse/expand
│       │   │   └── TopBar.jsx       ← Header: page title, refresh, theme toggle, avatar
│       │   ├── Charts/
│       │   │   └── LineChart.jsx    ← Recharts time-series line chart wrapper
│       │   └── UI/
│       │       ├── KpiCard.jsx      ← Metric card with icon, value, unit, badge
│       │       ├── GaugeRing.jsx    ← SVG circular gauge (0–100%)
│       │       └── AlertBadge.jsx   ← Inline alert row (ok / warn / alert / info)
│       │
│       ├── pages/
│       │   ├── Overview.jsx         ← Mission banner, gauges, KPIs, AI scheduler,
│       │   │                           impact dashboard, SDG panel, system footer
│       │   ├── WaterPage.jsx        ← Flow rate, reservoir, pH quality, leak AI KPI
│       │   ├── EnergyPage.jsx       ← Solar, battery, pump power, AI forecast gauge
│       │   ├── AIPage.jsx           ← 4 live model cards, model stack table
│       │   ├── AlertsPage.jsx       ← Full alert feed with read/clear controls
│       │   ├── AuditPage.jsx        ← Timestamped event log, severity filter, export
│       │   └── SettingsPage.jsx     ← Threshold config, system preferences
│       │
│       ├── store/
│       │   ├── useStore.js          ← Zustand store: sensors, alerts, impact counters,
│       │   │                           pump control, theme, AI results, 3-second tick
│       │   └── useAuditLog.js       ← Separate Zustand slice for audit event history
│       │
│       └── utils/
│           └── mockData.js          ← Physics-based ESP32 sensor simulator:
│                                       generateSensorData, tickSensors, appendHistory
│
├── prototype/                       ← ESP32 firmware and hardware documentation
│   ├── firmware/                    ← Arduino/PlatformIO source files
│   └── hardware/                    ← Wiring diagrams, BOM, enclosure specs
│
└── docs/                            ← Extended architecture and API documentation
    ├── architecture.md
    ├── sensor-calibration.md
    └── deployment-guide.md
```

---

## AI Engine

All four models run **entirely in the browser as pure JavaScript** — no Python runtime, no server, no WebAssembly. Each model is a direct port of its trained decision-tree structure encoded as a nested JavaScript array.

### Models Overview

| Model | File | Algorithm | Trees | Key Inputs | Key Output |
|-------|------|-----------|-------|------------|------------|
| **Leak Detection** | `leak_model.js` | Random Forest | 11 | `lossRatio`, `rollingMean`, `consecutiveHighLoss` | `isLeak` (boolean), confidence |
| **Predictive Maintenance** | `maintenance_model.js` | Random Forest | 15 | `pumpMotorCurrent`, `flowRate`, `pumpTemp`, efficiency delta | `state`: 0 healthy / 1 warn / 2 critical |
| **pH / Water Quality** | `ph_model.js` | Random Forest | 11 | `deviation`, `rollingMean`, `consecutiveDeviation` | `contaminated` (boolean), deviation score |
| **Solar Energy Forecast** | `energy_model_v2.js` | GBT (forecast) + RF (soiling) | 25 + 5 | `solarProduction`, `pumpMotorCurrent`, `hour`, efficiency | `solarForecast` (W), `needsCleaning` (bool) |

### Data Flow

```
Sensor Tick (every 3 seconds via Zustand interval)
        │
        ▼
  useAIEngine.js  ←──────── sensors object from useStore
  ┌───────────────────────────────────────────────────┐
  │  makeLeakDetector()        → leak risk score       │
  │  makeMaintenanceDetector() → pump state (0/1/2)    │
  │  makePHDetector()          → contamination bool    │
  │  makeEnergyForecaster()    → solar forecast (W)    │
  └───────────────────────────────────────────────────┘
        │
        ▼
  setAiResults() → back into Zustand store
        │
        ├─▶ Alert rules in useStore.js consume aiResults
        ├─▶ AIPage.jsx       — 4 live model result cards
        ├─▶ WaterPage.jsx    — Leak Risk KPI, pH Quality KPI
        └─▶ EnergyPage.jsx   — AI Solar Forecast gauge
```

### Feature Engineering (per model)

**Leak Detection**
- `lossRatio` = `flowRate` / `reservoirLevel` — high ratio means more water leaving than expected
- `rollingMean` = 10-tick moving average of lossRatio
- `consecutiveHighLoss` = counter of consecutive ticks where lossRatio > threshold

**Predictive Maintenance**
- Raw: `pumpMotorCurrent` (A), `pumpTemp` (°C), `flowRate` (L/min)
- Derived: efficiency delta (current reading vs rolling baseline), slope (trend direction)
- Output state 0 → 1 → 2 maps to healthy → warning → critical maintenance needed

**pH / Water Quality**
- `deviation` = absolute distance of rolling reservoir level from expected stable mean
- `rollingMean` = smoothed deviation over recent ticks
- `consecutiveDeviation` = ticks above deviation threshold in a row
- Contamination flag triggers a critical alert in the alert rules system

**Solar Energy Forecast (GBT + Soiling)**
- Main GBT (25 trees): predicts next-hour solar output in Watts from `solarProduction`, `hour`, and `pumpMotorCurrent`
- Soiling sub-model RF (5 trees): detects panel dirt from efficiency ratio (`solarProduction` / theoretical max at current hour) — outputs `needsCleaning`

---

## Dashboard Pages

### Overview (`/overview`)
The main landing page. Shows the full system state at a glance.

- **Mission banner** — explains the solar-powered rural Africa context
- **4 Gauge rings** — Reservoir %, Battery %, Pump Health %, Leak Risk %
- **6 KPI cards** — Flow Rate, Total Consumed, Solar Power, Pump Power, Pump Temp, WiFi Signal
- **AI Pump Scheduling** — live recommendation (Run / Pause / Stop / Defer) based on solar + battery + reservoir
- **24-hour trend chart** — rolling time series for reservoir, solar, and battery
- **Recent Alerts** — last 4 active alerts
- **Impact Dashboard** — Water losses avoided, Energy optimised, Pump uptime, Households served, Cost savings
- **SDG Alignment panel** — 5 SDG tiles with descriptions
- **System footer** — ESP32 uptime, voltage, motor current, site status

### Water Monitoring (`/water`)
- Reservoir level, flow rate, total daily consumption
- Live **Leak Risk KPI** from Random Forest model
- Live **pH Water Quality KPI** — contamination detection
- Historical flow and reservoir trend chart

### Energy Management (`/energy`)
- Solar production (W), battery state of charge (%), pump power draw (W)
- **AI Solar Forecast gauge** — GBT prediction for next hour
- **Panel Health KPI** — soiling RF flag with cleaning recommendation
- Net energy balance (solar in vs pump consumption)

### AI Insights (`/ai`)
- Four live model result cards with confidence scores and decision labels
- Model Stack reference table (algorithm, tree count, input features, status)
- All results update every 3 seconds on each sensor tick

### Alerts (`/alerts`)
- Full feed of all system alerts sorted by time
- Severity filter: all / critical / warning / ok / info
- Mark individual alerts as read, or clear all
- 19 alert rules covering: leaks, pump health, battery, reservoir levels, pH, solar panels, WiFi

### Audit Log (`/audit`)
- Immutable timestamped event log for all system actions and state changes
- Categories: Water, Pump, Energy, System
- Severity levels: critical, warning, ok, info, action
- Filter by category and severity, export to CSV

### Settings (`/settings`)
- Configure alert thresholds for reservoir, battery, pump temp, and leak risk
- Toggle dark / light theme
- System preferences and notification controls

---

## Hardware Setup

### Bill of Materials

| Component | Model | Purpose | Est. Cost (TND) |
|-----------|-------|---------|------------------|
| Microcontroller | ESP32 DevKit | WiFi data transmission, pump relay control | 12–15 |
| Flow sensor | YF-S201 | Measures water flow rate (L/min) | 5–8 |
| Ultrasonic sensor | HC-SR04 | Measures reservoir water level (cm) | 3–5 |
| Current sensor | INA219 | Monitors solar panel and pump power (W, A) | 6–9 |
| Temperature sensor | DS18B20 | Measures pump motor temperature (°C) | 4–6 |
| pH sensor | Analog pH probe | Detects water quality / contamination | 15–20 |
| Solar panel | 20–50W monocrystalline | Primary power source | 30–40 |
| Battery | 12V 7–20Ah SLA | Energy storage for night / cloudy days | 20–30 |
| Pump | 12V DC borehole pump | Water extraction and distribution | 25–35 |
| Relay module | 5V single channel | Pump on/off control from ESP32 | 2–3 |
| **Total** | | | **~100–120 TND** |

### Wiring Summary

```
Solar Panel ──► Charge Controller ──► 12V Battery
                                           │
                                     ┌─────┴──────┐
                                  ESP32          Relay
                                     │              │
                              Sensors (I²C/GPIO)  Pump (12V DC)

ESP32 GPIO Assignments:
  GPIO 4  — YF-S201 flow sensor (interrupt)
  GPIO 5  — HC-SR04 trigger
  GPIO 18 — HC-SR04 echo
  GPIO 21 — INA219 SDA (I²C)
  GPIO 22 — INA219 SCL (I²C)
  GPIO 2  — DS18B20 (OneWire)
  GPIO 34 — pH sensor (analog ADC)
  GPIO 26 — Relay control (pump)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/meriamjadoui/AquaGrid-AI.git
cd AquaGrid-AI

# 2. Install frontend dependencies
cd dashboard
npm install

# 3. Start the development server
npm run dev
```

The dashboard will be available at **http://localhost:5173**

> **No hardware required.** The dashboard runs fully on simulated sensor data by default.
> The physics-based ESP32 simulator in `utils/mockData.js` models real sensor behavior:
> solar follows a sine curve across daylight hours, battery charges/drains based on load,
> reservoir responds to pump state, pump temperature rises under load, etc.

### Production Build

```bash
cd dashboard
npm run build      # outputs to dashboard/dist/
npm run preview    # preview the production build locally
```

### Connecting Real Hardware

1. Flash the ESP32 firmware from `prototype/firmware/`
2. Configure your Firebase RTDB or MQTT broker URL in `dashboard/src/config.js`
3. Replace `mockData.js` imports in `useStore.js` with the live Firebase listener
4. The AI models and alert rules work identically with real sensor data

---

## Technology Stack

| Domain | Technology | Version | Notes |
|--------|------------|---------|-------|
| Frontend framework | React | 18 | Functional components + hooks |
| Build tool | Vite | 5 | Fast HMR, optimised production builds |
| Styling | Tailwind CSS | 3 | Utility-first; custom SDG color tokens in `index.css` |
| State management | Zustand | 4 | Minimal, no boilerplate, direct store access |
| Charts | Recharts | 2 | React-native SVG charts, responsive |
| Icons | Lucide React | latest | Consistent icon set, tree-shakeable |
| AI / ML | Pure JavaScript | — | Random Forest + GBT, zero external dependencies |
| IoT backend | Firebase RTDB / MQTT | — | Real-time data sync from ESP32 |
| Hardware MCU | ESP32 | — | WiFi + BLE, dual-core, Arduino-compatible |

---

## Impact Metrics

The Overview page tracks the following impact KPIs in real time (accumulated since the session started, seeded with simulated deployment history):

| Metric | Calculation | SDG |
|--------|-------------|-----|
| **Water Losses Avoided (L)** | Litres not lost by detecting leaks early; estimated from flow rate delta during non-leak ticks | SDG 6 |
| **Energy Optimised (Wh)** | Solar surplus (production − pump draw) accumulated across session | SDG 7 |
| **Pump Uptime (h)** | Total minutes pump ran without failure, converted to hours | SDG 9 |
| **Households Served** | Daily consumed volume ÷ 18 L/person/day ÷ 5 persons/household | SDG 11 |
| **Operational Cost Savings ($)** | Water savings × $0.003/L + energy savings × $0.0001/Wh | SDG 6, 7 |

---

## Alert System

The platform implements 19 automated alert rules spanning all monitored systems:

| Category | Alert | Trigger |
|----------|-------|---------|
| Water | Leak detected | AI RF model: `isLeak = true` |
| Water | Reservoir critically low | Level < 20% |
| Water | Reservoir near full | Level > 92% (overflow risk) |
| Water | pH contamination | AI RF model: `contaminated = true` |
| Pump | Pump critical | AI RF: maintenance state = 2 |
| Pump | Pump warning | AI RF: maintenance state = 1 |
| Pump | Pump overheating | Temperature > 70°C |
| Energy | Battery critically low | Charge < 25% |
| Energy | Battery low | Charge 25–35% |
| Energy | Battery full | Charge > 90% |
| Energy | Solar panel dirty | AI soiling RF: `needsCleaning = true` |
| Energy | Low solar during peak | Production < 20W between 9am–4pm |
| System | Weak WiFi | RSSI < -68 dBm |

All alerts are deduplicated (60-second cooldown per rule), timestamped, written to the audit log, and displayed in the Alerts page and Overview sidebar.

---

## Contributing

Contributions are welcome. Here are areas where help is especially valuable:

- **Real hardware integration** — connecting to a live ESP32 + Firebase setup
- **Model retraining** — improving the AI models with real-world sensor data
- **Localization** — translating the UI to French or Arabic for Francophone Africa
- **Offline support** — PWA / service worker for areas with intermittent connectivity
- **Mobile app** — React Native port for field technicians

Please open an issue first to discuss significant changes.

---

## License

This project is open-source under the [MIT License](LICENSE).

Built for communities. Designed for impact.
