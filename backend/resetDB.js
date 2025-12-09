const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./events.db");

db.serialize(() => {
  console.log("🔄 Resetting database...");

  db.run("DELETE FROM bookings");
  db.run("UPDATE events SET available_seats = total_seats WHERE id = 1");

  console.log("✔ Reset complete");
});

db.close();
