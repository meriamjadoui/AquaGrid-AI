# AquaWise (AquaGrid AI)

**Smart Solar-Powered Water Management System — AI · IoT · Real-Time Dashboard**

[![License: MIT](https://img.shields.io/badge/license-MIT-3F7E44?style=flat-square)](#license)
[![SDG 6](https://img.shields.io/badge/SDG-6%20Clean%20Water-26BDE2?style=flat-square)](https://sdgs.un.org/goals/goal6)
[![SDG 7](https://img.shields.io/badge/SDG-7%20Clean%20Energy-FCC30B?style=flat-square&labelColor=555)](https://sdgs.un.org/goals/goal7)
[![SDG 9](https://img.shields.io/badge/SDG-9%20Innovation-FD6925?style=flat-square)](https://sdgs.un.org/goals/goal9)
[![SDG 11](https://img.shields.io/badge/SDG-11%20Sustainable%20Cities-FD9D24?style=flat-square)](https://sdgs.un.org/goals/goal11)
[![SDG 13](https://img.shields.io/badge/SDG-13%20Climate%20Action-3F7E44?style=flat-square)](https://sdgs.un.org/goals/goal13)

> AquaWise directly contributes to the United Nations Sustainable Development Goals (SDGs), particularly **SDG 6**: Clean Water and Sanitation, **SDG 7**: Affordable and Clean Energy, **SDG 9**: Industry, Innovation and Infrastructure, **SDG 11**: Sustainable Cities and Communities, and **SDG 13**: Climate Action, by promoting efficient water use, renewable energy integration, resilient infrastructure, and sustainable resource management.

By combining **Live AI Models**, **Google Gemini Conversational Assistant**, and **real-time IoT sensor data**, AquaWise helps communities:
- 💧 Reduce water losses through early leak detection
- ⚡ Optimize solar energy use with AI-driven pump scheduling
- 🔧 Prevent pump failures through predictive maintenance
- 🌍 Enhance access to clean water for off-grid communities


## Table of Contents

1. [System Architecture](#system-architecture)
2. [Hardware Components](#hardware-components)
3. [Technology Stack](#technology-stack)
4. [AI Engine & Chatbot](#ai-engine--chatbot)
5. [Getting Started (Local Setup)](#getting-started-local-setup)
6. [Hardware-in-the-Loop Simulator](#hardware-in-the-loop-simulator)


## 1 * System Architecture

The platform is structured in a robust, decoupled, 3-tier architecture:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  SENSOR LAYER (ESP32)                                               │
│  YF-S201 (flow) · HC-SR04 (reservoir) · INA219 (power) ·          │
│  DS18B20 (temp)                                                     │
└────────────────────┬────────────────────────────────────────────────┘
                     │ WiFi / HTTP
┌────────────────────▼────────────────────────────────────────────────┐
│  DATABASE (MySQL)                                                   │
│  Stores timestamped sensor telemetry in `system_overview` table     │
└────────────────────┬────────────────────────────────────────────────┘
                     │ SQL Queries
┌────────────────────▼────────────────────────────────────────────────┐
│  BACKEND API (Node.js & Express)                                    │
│  REST API exposing real-time sensor data endpoints                  │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTP GET /api/system-overview/latest
┌────────────────────▼────────────────────────────────────────────────┐
│  FRONTEND DASHBOARD (React, Vite, Zustand)                          │
│  Real-time visualizations, AI analytics, and Gemini Chatbot         │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Decoupled Hardware/Software:** The ESP32 writes directly to the MySQL database. The React dashboard polls the Node API. If the hardware goes offline, the software doesn't crash.
- **Smart Fallback:** If the database or backend goes offline during a presentation, the dashboard seamlessly falls back to a local mockup simulation, ensuring the UI always remains interactive.
- **Hardware-in-the-Loop Simulation:** A dedicated `esp32_simulator.js` script allows developers and juries to test the full data pipeline (SQL -> Node -> React) without physical hardware.


## 2 * Hardware Components

The system is custom-designed for the following physical IoT components:

| Component | Purpose |
|-----------|---------|
| **ESP32** | Main controller, Wi-Fi transmission, sensor acquisition |
| **YF-S201** | Water flow sensor (L/min) |
| **HC-SR04** | Ultrasonic tank level measurement (%) |
| **INA219** | Voltage, current, and solar power monitoring (Watts) |
| **DS18B20** | Pump/motor temperature monitoring (°C) |
| **12V DC Pump** | Water transfer |
| **20-50W Solar Panel**| Renewable power generation |
| **12V 7Ah Battery** | Energy storage |
| **Relay Module** | Pump on/off switching |
| **20-50L Tank** | Water reservoir |



## 3 * Technology Stack

| Layer | Technology | Description |
|--------|------------|---------|
| **Frontend** | React 18, Vite | High-performance UI rendering |
| **State** | Zustand | Global state management for real-time sensor polling |
| **Backend** | Node.js, Express | Lightweight REST API server |
| **Database** | MySQL | Relational database for structured time-series sensor data |
| **AI (LLM)** | Google Gemini API | Conversational agent capable of analyzing the live water network |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Charts** | Recharts | Real-time SVG charting |



## 4 * AI Engine & Chatbot

### 1. In-Browser Analytics Models
AquaGrid features custom algorithmic models running in the browser to analyze:
- **Leak Detection:** Compares flow rates vs. reservoir level changes.
- **Predictive Maintenance:** Analyzes pump power draw and temperature to predict failures.

### 2. Conversational AI Assistant (Google Gemini)
The dashboard features an integrated floating Chatbot powered by Google Gemini.
- The assistant receives the live context of the entire water grid (reservoir levels, solar power, pump health).
- Users can ask natural language questions like *"Why is the pump health failing?"* or *"Should we turn on the pump now?"* and the AI will provide expert engineering analysis based on the live data stream.



## 5 * Getting Started (Local Setup)

### Prerequisites
- Node.js 18+ 
- MySQL Server 

### 1. Database Setup
1. Create a MySQL database named `aquagrid`.
2. Navigate to the backend folder and run the initialization script to automatically create the tables:
```bash
cd backend
npm install
node init_db.js
```

### 2. Start the Backend API
1. Configure your MySQL credentials in `backend/.env`.
2. Start the Express server:
```bash
cd backend
node server.js
```
*The API will run on http://localhost:3001*

### 3. Start the Frontend Dashboard
1. Add your Google Gemini API key to `dashboard/.env` (`VITE_GEMINI_API_KEY=AIza...`)
2. Start the React development server:
```bash
cd dashboard
npm install
npm run dev
```
*The Dashboard will be available at http://localhost:5173*



## 6 * Hardware-in-the-Loop Simulator

To evaluate the software without access to the physical ESP32 and water sensors, we have built a **Mock Data Injector**. 

This script connects directly to the MySQL database and rapidly inserts randomized, realistic sensor telemetry. The random values are mathematically constrained to match the exact specifications of the hardware list (e.g., Solar capped at 50W, Battery capped at 12V 7Ah limits).

**To run the simulator:**
```bash
cd backend
node esp32_simulator.js
```

Once running, you will see the data physically written to the database, fetched by the Node API, and rendered live on the React dashboard in real-time, verifying the entire end-to-end architecture.

---

*Built for communities. Designed for impact.*
