require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  console.log("Connecting to MySQL to create database...");
  try {
    // 1. Connect WITHOUT a database name to create it first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log("✅ Connected! Creating database 'aquawise'...");
    await connection.query("CREATE DATABASE IF NOT EXISTS aquawise;");
    await connection.query("USE aquawise;");

    console.log("✅ Creating 'system_overview' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_overview (
          id INT AUTO_INCREMENT PRIMARY KEY,
          site_name VARCHAR(100),
          location VARCHAR(100),

          reservoir_level DECIMAL(5,2),
          battery_level DECIMAL(5,2),
          pump_health DECIMAL(5,2),
          leak_risk DECIMAL(5,2),

          flow_rate DECIMAL(6,2),
          water_consumed DECIMAL(10,2),
          solar_power DECIMAL(6,2),
          pump_power DECIMAL(6,2),
          pump_temperature DECIMAL(5,2),
          wifi_signal INT,

          pump_status ENUM('ON','OFF'),
          sensor_status ENUM('OK','WARNING','ERROR'),

          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert a test row so the dashboard has something to show immediately
    console.log("✅ Inserting a test row of data...");
    await connection.query(`
      INSERT INTO system_overview 
      (site_name, location, reservoir_level, battery_level, pump_health, leak_risk, flow_rate, water_consumed, solar_power, pump_power, pump_temperature, wifi_signal, pump_status, sensor_status)
      VALUES 
      ('Main Plant', 'Sector 7G', 85.5, 92.0, 98.5, 0.0, 5.2, 1250.0, 340.5, 120.0, 32.5, -60, 'ON', 'OK')
    `);

    console.log("🎉 Database setup complete! You can now run 'node server.js'");
    connection.end();
  } catch (err) {
    console.error("❌ Error setting up database:", err);
  }
}

initializeDatabase();
