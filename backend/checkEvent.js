const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./events.db");

db.get("SELECT * FROM events WHERE id = 1", (err, row) => {
  if (err) return console.error(err);
  console.log(row);
});
