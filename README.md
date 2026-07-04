# 🌊⚡ AquaGrid AI

> **Smart Solar Water Management System** — IoT + AI + React Dashboard

AquaGrid AI is an intelligent monitoring platform for solar-powered water infrastructure in rural communities (Tunisia/Africa). It connects water management, solar energy, and AI-driven analytics into a single unified dashboard.

---

## 🏗️ Project Structure

```
AquaGrid-AI/
├── dashboard/          # React + Vite web dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── ai/                 # AI models & anomaly detection
├── prototype/          # ESP32 firmware & hardware docs
└── docs/               # Architecture & API docs
```

---

## 🧩 System Layers

| Layer | Technology | Role |
|-------|-----------|------|
| **Layer 1** — Sensors | YF-S201, HC-SR04, INA219, DS18B20 | Data acquisition |
| **Layer 2** — IoT Controller | ESP32 (WiFi + BLE) | Read sensors, send data, control pump |
| **Layer 3** — AI Engine | Python / TensorFlow Lite | Leak detection, predictive maintenance, energy optimization |
| **Layer 4** — Dashboard | React + Vite + Recharts | Real-time monitoring interface |

---

## 📊 Dashboard Features

- **Water Section**: Reservoir level, flow rate, total consumption
- **Energy Section**: Solar production, battery charge, pump consumption
- **AI Section**: Leak risk score, pump health, anomaly alerts
- **Alerts**: Real-time notifications (overflow, leak, low battery, pump failure)
- **Responsive**: Mobile-first, dark/light mode

---

## 🚀 Quick Start (Dashboard)

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v3, Recharts, Lucide React
- **State**: Zustand
- **IoT Backend**: Firebase Realtime DB / MQTT
- **AI**: Python, scikit-learn, TensorFlow Lite (Edge AI on ESP32)
- **Hardware**: ESP32, Solar panel 20-50W, 12V pump, 12V battery

---

## 💡 Key Innovation — Water-Energy Nexus

AquaGrid AI is the **only open-source IoT platform** that simultaneously monitors:
- 💧 Water (reservoir, flow, leaks)
- ☀️ Solar energy (production, battery storage)
- 🤖 AI predictions (pump health, leak detection, energy optimization)

**Cost**: ~100–120 TND prototype vs. 50× more expensive enterprise alternatives (Grundfos, Xylem)

---

## 📍 Target Communities

- Rural villages, schools, and farms in Tunisia and Africa
- Communities using boreholes + solar pumps without supervision

---

## 👩‍💻 Author

**Meriam Jadoui** — Cloud Engineer | Full-Stack Dev  
📧 Meriam.Jadoui@esprit.tn | 📍 Tunis, TN
