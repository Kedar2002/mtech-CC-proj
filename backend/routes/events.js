module.exports = function (io, app) {
  const express = require('express');
  const router = express.Router();
  const db = require('../db');

  // Get event info
  router.get('/', (req, res) => {
    db.get('SELECT * FROM events WHERE id = 1', (err, row) => {
      if (err) return res.status(500).json({ error: err });
      res.json(row);
    });
  });

  // Get all bookings
  router.get('/bookings', (req, res) => {
    db.all(
      `SELECT b.id, b.name, b.email, b.phone, b.timestamp,
              e.title AS event_title
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       ORDER BY b.timestamp DESC`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
      }
    );
  });

  // RESET DB – FIXED VERSION
  router.post('/reset', (req, res) => {
    db.serialize(() => {
      db.run('DELETE FROM bookings');

      db.run(
        'UPDATE events SET available_seats = total_seats WHERE id = 1',
        () => {
          db.get(
            'SELECT available_seats FROM events WHERE id = 1',
            (err, row) => {
              if (err) return res.status(500).json({ error: err });

              const newSeats = row.available_seats;

              // 🔥 FIX: update backend in-memory variable
              app.locals.seatsAvailable = newSeats;

              // Emit update after DB finishes writing
              setTimeout(() => {
                io.emit('seatUpdate', newSeats);
              }, 50);

              return res.json({
                success: true,
                message: 'Database reset successfully.',
                available_seats: newSeats
              });
            }
          );
        }
      );
    });
  });

  return router;
};
