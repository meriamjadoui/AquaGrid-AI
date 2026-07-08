# AquaWise (AquaWise)

**Smart Solar-Powered Water Management System — Hybrid AI · IoT · Real-Time Dashboard**

[![License: MIT](https://img.shields.io/badge/license-MIT-3F7E44?style=flat-square)](#license)
[![SDG 6](https://img.shields.io/badge/SDG-6%20Clean%20Water-26BDE2?style=flat-square)](https://sdgs.un.org/goals/goal6)
[![SDG 7](https://img.shields.io/badge/SDG-7%20Clean%20Energy-FCC30B?style=flat-square&labelColor=555)](https://sdgs.un.org/goals/goal7)
[![SDG 9](https://img.shields.io/badge/SDG-9%20Innovation-FD6925?style=flat-square)](https://sdgs.un.org/goals/goal9)
[![SDG 11](https://img.shields.io/badge/SDG-11%20Sustainable%20Cities-FD9D24?style=flat-square)](https://sdgs.un.org/goals/goal11)
[![SDG 13](https://img.shields.io/badge/SDG-13%20Climate%20Action-3F7E44?style=flat-square)](https://sdgs.un.org/goals/goal13)

> AquaWise directly contributes to the United Nations Sustainable Development Goals (SDGs), particularly **SDG 6**: Clean Water and Sanitation, **SDG 7**: Affordable and Clean Energy, **SDG 9**: Industry, Innovation and Infrastructure, **SDG 11**: Sustainable Cities and Communities, and **SDG 13**: Climate Action, by promoting efficient water use, renewable energy integration, resilient infrastructure, and sustainable resource management.

By combining **Live Hybrid AI Models**, **Google Gemini Conversational Assistant**, and **real-time IoT sensor data**, AquaWise helps communities:
- 💧 Reduce water losses through early leak detection
- ⚡ Optimize solar energy use with AI-driven pump scheduling
- 🔧 Prevent pump failures through predictive maintenance
- 🌍 Enhance access to clean water for off-grid communities

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Hardware Components](#hardware-components)
3. [Technology Stack](#technology-stack)
4. [Hybrid AI Engine & Chatbot](#hybrid-ai-engine--chatbot)
5. [Getting Started (Local Setup)](#getting-started-local-setup)
6. [Hardware-in-the-Loop Simulator](#hardware-in-the-loop-simulator)


## 1 * System Architecture

The platform is structured in a robust, highly decoupled **4-tier architecture** featuring authentication and a dedicated ML microservice:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  SENSOR LAYER (ESP32)                                               │
│  YF-S201 (flow) · HC-SR04 (reservoir) · INA219 (power)            │
└────────────────────┬────────────────────────────────────────────────┘
                     │ WiFi / HTTP
┌────────────────────▼────────────────────────────────────────────────┐
│  DATABASE (MySQL)                                                   │
│  Stores timestamped sensor telemetry in `system_overview` table     │
└────────────────────┬────────────────────────────────────────────────┘
                     │ SQL Queries
┌────────────────────▼────────────────────────────────────────────────┐
│  NODE.JS API GATEWAY (Express)                                      │
│  REST API exposing real-time sensor data and routing ML requests    │
└────────────────────┬─────────────────────────────┬──────────────────┘
                     │ Proxy                       │ HTTP GET
┌────────────────────▼─────────┐       ┌───────────▼──────────────────┐
│  PYTHON ML MICROSERVICE      │       │  FRONTEND DASHBOARD (Vite)   │
│  (Flask & scikit-learn)      │       │  React, Zustand, TF.js, Auth │
│  Random Forest Inference     │       │  Gemini Chatbot              │
└──────────────────────────────┘       └──────────────────────────────┘
```

### Key Design Decisions

- **Decoupled Hardware/Software:** The ESP32 writes directly to the MySQL database. The React dashboard polls the Node API. If the hardware goes offline, the software doesn't crash.
- **Microservice ML:** Heavy machine learning inference (like Random Forest Leak Detection) is offloaded to a Python Flask microservice, allowing for easy updates and model retraining without taking down the main dashboard.
- **Secure Authentication Flow:** Full JWT-based login and signup flow ensures that only authorized operators can view the dashboard and issue commands.
- **Hardware-in-the-Loop Simulation:** A dedicated `esp32_simulator.js` script allows developers and juries to test the full data pipeline (SQL -> Node -> Python -> React) without physical hardware.


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
| **Frontend** | React 18, Vite | High-performance UI rendering with secure Auth routing |
| **State** | Zustand | Global state management for real-time sensor polling |
| **Backend API** | Node.js, Express | Lightweight REST API server and proxy |
| **ML Service** | Python, Flask | Dedicated microservice for `scikit-learn` inference |
| **Deep Learning**| TensorFlow.js | In-browser unsupervised anomaly detection |
| **Database** | MySQL | Relational database for structured time-series sensor data |
| **AI (LLM)** | Google Gemini API | Conversational agent capable of analyzing the live water network |
| **Styling** | Tailwind CSS | Utility-first responsive design |


## 4 * Hybrid AI Engine & Chatbot

AquaWise utilizes a unique **Hybrid Architecture** spanning the browser, local servers, and cloud LLMs. For an exhaustive technical breakdown of every model, see [docs/AI_ENGINE.md](docs/AI_ENGINE.md).

### 1. Python ML Microservice (Leak Detection)
We utilize a highly accurate Random Forest model trained on thousands of rows of synthetic water flow data (`ai/model/leak_model.pkl`). The model runs in a Flask Python backend and receives real-time telemetry from the Node proxy to predict unseen pipeline leaks.

### 2. In-Browser Deep Learning (TensorFlow.js)
To detect complex, unseen anomalies across multiple sensor inputs (multivariate anomalies), we deployed an **Autoencoder** using TensorFlow.js (`adaptive_anomaly_model.js`). It actively trains on the live data stream directly within the browser, learning what "normal" looks like, and flags massive deviations instantly.

### 3. In-Browser JavaScript Trees
For rapid, zero-latency inference, we compiled several tree-based models (Predictive Maintenance, Water Quality pH Proxy, Solar Forecasting) directly into synchronous JavaScript functions that execute alongside the React rendering loop.

### 4. Conversational AI Assistant (Google Gemini)
The dashboard features an integrated Chatbot powered by Google Gemini. The assistant receives the live context of the entire water grid (reservoir levels, solar power, pump health, anomaly scores). Operators can ask natural language questions like *"Why is the pump health failing?"* and the AI will provide expert engineering analysis based on the live data stream.


## 5 * Getting Started (Local Setup)

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- MySQL Server 

### 1. Database Setup
Create a MySQL database named `aquawise` and initialize the tables:
```bash
cd backend
npm install
node init_db.js
```

### 2. Start the Backend API Gateway
Configure your MySQL credentials in `backend/.env` and start the Express server:
```bash
cd backend
node server.js
```

### 3. Start the Python ML Service
Set up a Python virtual environment, install the ML dependencies, and start the Flask inference server:
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # (Windows) or `source venv/bin/activate` (Mac/Linux)
pip install flask joblib pandas scikit-learn
python ml_service.py
```
*The ML Service will run on http://localhost:5001*

### 4. Start the Frontend Dashboard
Add your Google Gemini API key to `dashboard/.env` (`VITE_GEMINI_API_KEY=AIza...`), install dependencies, and start:
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

Once running, you will see the data physically written to the database, fetched by the Node API, processed by the Python ML service, and rendered live on the React dashboard in real-time, verifying the entire end-to-end architecture.

---

*Built for communities. Designed for impact.*
