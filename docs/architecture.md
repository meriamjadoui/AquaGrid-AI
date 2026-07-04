# AquaGrid AI — System Architecture

## Overview

```
[Sensors] → [ESP32] → [MQTT/WiFi] → [Firebase] → [React Dashboard]
                ↓
         [Edge AI (TFLite)]
```

## Layers

### Layer 1 — Sensors
- **YF-S201**: Flow rate (L/min), total consumption
- **HC-SR04 (waterproof)**: Reservoir level (distance → %) 
- **INA219**: Battery voltage, current, power (V, A, W)
- **DS18B20**: Pump temperature (°C)

### Layer 2 — ESP32 Controller
- Reads all sensors via GPIO/I2C/OneWire
- Controls 12V pump via relay
- Sends data via MQTT over WiFi
- Runs edge AI inference (TFLite Micro)

### Layer 3 — AI Engine
| Function | Model | Runtime |
|----------|-------|---------|
| Leak detection | Rule-based + Threshold | ESP32 |
| Pump health | Isolation Forest | Cloud |
| Solar forecast | LSTM / Prophet | Cloud |

### Layer 4 — Dashboard
- React 18 + Vite + Tailwind CSS v3
- Recharts for data visualization
- Zustand for state management
- Firebase Realtime DB for live data

## Data Flow

1. ESP32 reads sensors every 5 seconds
2. Data published to Firebase via MQTT
3. Dashboard subscribes to Firebase Realtime DB
4. AI models run predictions (edge + cloud)
5. Alerts triggered on threshold breach
