module.exports = function (io, app) {
  const express = require('express');
  const router = express.Router();
  const db = require('../db');

  // Get single event (id = 1)
  router.get('/', (req, res) => {
    db.get('SELECT * FROM events WHERE id = 1', (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });

  // All bookings (for Admin table)
  router.get('/bookings', (req, res) => {
    db.all(
      `SELECT b.id, b.name, b.email, b.phone, b.timestamp,
              e.title AS event_title
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       ORDER BY b.timestamp DESC`,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  });

  // Simple stats for Admin dashboard
  router.get('/stats', (req, res) => {
    db.get(
      'SELECT total_seats, available_seats FROM events WHERE id = 1',
      (err, eventRow) => {
        if (err || !eventRow) {
          return res.status(500).json({ error: 'Could not load event stats' });
        }

        db.get(
          'SELECT COUNT(*) as totalBookings FROM bookings',
          (err2, countRow) => {
            if (err2 || !countRow) {
              return res
                .status(500)
                .json({ error: 'Could not load booking stats' });
            }

            res.json({
              totalSeats: eventRow.total_seats,
              availableSeats: eventRow.available_seats,
              totalBookings: countRow.totalBookings
            });
          }
        );
      }
    );
  });

  // Reset DB (clear bookings + reset seats)
  router.post('/reset', (req, res) => {
    db.serialize(() => {
      db.run('DELETE FROM bookings');

      db.run(
        'UPDATE events SET available_seats = total_seats WHERE id = 1',
        err => {
          if (err) {
            return res
              .status(500)
              .json({ success: false, message: 'Reset failed.' });
          }

          db.get(
            'SELECT available_seats FROM events WHERE id = 1',
            (err2, row) => {
              if (err2 || !row) {
                return res.status(500).json({
                  success: false,
                  message: 'Reset completed but seats could not be read.'
                });
              }

              const newSeats = row.available_seats;

              // sync in-memory cache
              app.locals.seatsAvailable = newSeats;

              // notify all clients
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
