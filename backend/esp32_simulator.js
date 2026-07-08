/**
 * ============================================================================
 * ESP32 HARDWARE SIMULATOR (TESTING & VALIDATION TOOL)
 * ============================================================================
 * 
 * In modern IoT architecture, it is best practice to decouple hardware from software.
 * This script serves as a Mock Data Injector to simulate physical ESP32 sensor 
 * behavior for load testing, UI validation, and demonstration purposes when 
 * physical hardware is offline or unavailable.
 * 
 * It writes directly to the MySQL database, verifying the full backend pipeline.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function runSimulator() {
  console.log("🌊 Starting ESP32 Hardware Simulator...");
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 4306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'aquagrid'
    });

    console.log("✅ Connected to MySQL database!");
    console.log("📡 Simulating sensor data inserts every 3 seconds...\n");

    let totalConsumed = 1250.0; // Starting baseline

    setInterval(async () => {
      // Generate realistic fluctuating sensor values matching exact hardware specs
      
      // HC-SR04 Tank level measurement (20-50L Tank) -> % scale
      const reservoir_level = (Math.random() * (95 - 40) + 40).toFixed(2);
      
      // INA219 Battery voltage/current (12V 7Ah Battery) -> 80% to 100%
      const battery_level = (Math.random() * (100 - 80) + 80).toFixed(2);
      
      // Abstract pump health
      const pump_health = (Math.random() * (100 - 90) + 90).toFixed(2);
      const leak_risk = (Math.random() * 2).toFixed(2); // Low risk usually
      
      // YF-S201 Water flow sensor (typical 1-30 L/min)
      const flow_rate = (Math.random() * (15.0 - 5.0) + 5.0).toFixed(2);
      totalConsumed += (flow_rate / 20); // Slowly increasing total
      
      // 20-50W Solar Panel (max 50W generation)
      const solar_power = (Math.random() * (50 - 10) + 10).toFixed(2);
      
      // 12V DC Pump power draw
      const pump_power = (Math.random() * (60 - 20) + 20).toFixed(2);
      
      // DS18B20 Pump/motor temperature
      const pump_temperature = (Math.random() * (45 - 25) + 25).toFixed(2);
      
      // ESP32 Wi-Fi Signal
      const wifi_signal = Math.floor(Math.random() * (-40 - -80) + -80);
      
      const pump_status = Math.random() > 0.1 ? 'ON' : 'OFF';
      const sensor_status = Math.random() > 0.05 ? 'OK' : 'WARNING';

      const query = `
        INSERT INTO system_overview 
        (site_name, location, reservoir_level, battery_level, pump_health, leak_risk, flow_rate, water_consumed, solar_power, pump_power, pump_temperature, wifi_signal, pump_status, sensor_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        'Main Plant', 'Sector 7G', 
        reservoir_level, battery_level, pump_health, leak_risk, 
        flow_rate, totalConsumed.toFixed(2), solar_power, pump_power, 
        pump_temperature, wifi_signal, pump_status, sensor_status
      ];

      try {
        await connection.execute(query, values);
        console.log(`[${new Date().toLocaleTimeString()}] 📤 Data Inserted -> Flow: ${flow_rate}L/min | Reservoir: ${reservoir_level}% | Solar: ${solar_power}W`);
      } catch (err) {
        console.error("❌ Failed to insert data:", err.message);
      }

    }, 3000); // Run every 3 seconds

  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

runSimulator();
