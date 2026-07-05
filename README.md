# AquaGrid AI

**Smart Solar Water Management System — IoT, AI, and Real-Time Dashboard**

AquaGrid AI is an intelligent monitoring platform designed for solar-powered water infrastructure in rural communities across Tunisia and Africa. The system integrates water management, solar energy tracking, and AI-driven analytics into a single, unified interface — enabling communities to supervise critical resources without requiring on-site technical expertise.

---

## Project Structure

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
├── ai/                 # AI models and anomaly detection
├── prototype/          # ESP32 firmware and hardware documentation
└── docs/               # Architecture and API documentation
```

---

## System Architecture

The platform is organized into four distinct layers, each responsible for a specific concern:

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Sensor Layer | YF-S201, HC-SR04, INA219, DS18B20 | Field data acquisition |
| IoT Controller | ESP32 (WiFi + BLE) | Sensor reading, data transmission, pump control |
| AI Engine | Python, TensorFlow Lite | Leak detection, predictive maintenance, energy optimization |
| Dashboard | React, Vite, Recharts | Real-time monitoring and alerting interface |

---

## Dashboard Features

The web dashboard provides a consolidated view of the system across three main domains:

- **Water Monitoring**: Reservoir level, flow rate, and total consumption tracking
- **Energy Monitoring**: Solar production output, battery charge state, and pump energy consumption
- **AI Insights**: Leak risk scoring, pump health index, and anomaly detection alerts
- **Alert System**: Real-time notifications for overflow events, detected leaks, low battery, and pump failures
- **Responsive Design**: Mobile-first layout with support for dark and light modes

---

## Getting Started

To run the dashboard locally, make sure Node.js is installed, then execute the following:

```bash
cd dashboard
npm install
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

---

## Technology Stack

| Domain | Tools and Frameworks |
|--------|----------------------|
| Frontend | React 18, Vite, Tailwind CSS v3, Recharts, Lucide React |
| State Management | Zustand |
| IoT Backend | Firebase Realtime Database / MQTT |
| AI / ML | Python, scikit-learn, TensorFlow Lite (Edge AI on ESP32) |
| Hardware | ESP32, 20–50W solar panel, 12V pump, 12V battery |

---

## Core Value Proposition

AquaGrid AI addresses a gap that existing enterprise solutions leave largely unserved: affordable, open-source infrastructure monitoring for off-grid communities. The platform simultaneously tracks water, energy, and equipment health in a single system — a combination not commonly found in open-source tooling.

The estimated hardware cost for a functional prototype sits between 100 and 120 TND, compared to commercial alternatives from vendors such as Grundfos or Xylem that can cost significantly more. This makes deployment viable for rural villages, schools, and agricultural operations that rely on borehole pumps and solar energy without permanent technical supervision.

---

## Target Use Cases

- Rural villages and farming communities in Tunisia and across Africa
- Off-grid schools and public facilities using solar-powered water infrastructure
- Development organizations and NGOs seeking low-cost water monitoring solutions

---

## Author

**Meriam Jadoui** — Cloud Engineer and Full-Stack Developer  
Contact: Meriam.Jadoui@esprit.tn  
Location: Tunis, Tunisia
