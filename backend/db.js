const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./events.db");

db.serialize(() => {
  console.log("🔧 Initializing SQLite database...");

  // Create events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      title TEXT,
      description TEXT,
      total_seats INTEGER,
      available_seats INTEGER
    )
  `);

  // Create bookings table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      name TEXT,
      email TEXT,
      phone TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure default event exists
  db.get("SELECT * FROM events WHERE id = 1", (err, row) => {
    if (!row) {
      console.log("⚠ No event found — inserting default event (50 seats).");
      db.run(
        `INSERT INTO events
        (id, title, description, total_seats, available_seats)
        VALUES (1, 'Tech Conference 2025', 'A futuristic tech expo.', 50, 50)`
      );
    } else {
      console.log("✔ Event exists:", row);
    }
  });
});

module.exports = db;
