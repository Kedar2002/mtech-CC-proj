const express = require('express');
const cors = require('cors');
const http = require('http');
const db = require('./db');

const app = express();

app.use(
  cors({
    origin: '*' // you can restrict to frontend URL later
  })
);
app.use(express.json());

const server = http.createServer(app);

// --- Socket.IO setup ---
const io = require('socket.io')(server, {
  cors: { origin: '*' }
});

// In-memory seat cache (kept in sync with DB)
let seatsAvailable = 50;
app.locals.seatsAvailable = seatsAvailable;

// Load initial seats from DB
db.get('SELECT available_seats FROM events WHERE id = 1', (err, row) => {
  if (err || !row) {
    console.error('Error loading seats from DB:', err);
  } else {
    seatsAvailable = row.available_seats;
    app.locals.seatsAvailable = seatsAvailable;
  }
  console.log('🎟 Seats loaded from DB:', app.locals.seatsAvailable);
});

// --- Socket.IO connection handling ---
io.on('connection', socket => {
  console.log('🔌 Client connected:', socket.id);

  // Send current seat count immediately
  socket.emit('seatUpdate', app.locals.seatsAvailable);

  // Handle booking
  socket.on('bookSeat', ({ name, email, phone }) => {
    // Basic validation
    name = (name || '').trim();
    email = (email || '').trim();
    phone = (phone || '').trim();

    if (!name || !email || !phone) {
      socket.emit('bookingResult', {
        success: false,
        message: 'Please fill in name, email, and phone.'
      });
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    const phoneDigits = phone.replace(/\D/g, '');

    if (!emailRegex.test(email)) {
      socket.emit('bookingResult', {
        success: false,
        message: 'Please enter a valid email address.'
      });
      return;
    }

    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      socket.emit('bookingResult', {
        success: false,
        message: 'Please enter a valid phone number.'
      });
      return;
    }

    let seats = app.locals.seatsAvailable;

    if (seats <= 0) {
      socket.emit('bookingResult', {
        success: false,
        message: 'Sorry, no seats are available.'
      });
      return;
    }

    seats -= 1;
    app.locals.seatsAvailable = seats;

    // Update DB
    db.run(
      'UPDATE events SET available_seats = ? WHERE id = 1',
      [seats],
      err => {
        if (err) {
          console.error('Error updating seats:', err);
          // Try to roll back memory
          app.locals.seatsAvailable += 1;
          socket.emit('bookingResult', {
            success: false,
            message: 'Something went wrong. Please try again.'
          });
          return;
        }

        db.run(
          `INSERT INTO bookings (event_id, name, email, phone)
           VALUES (1, ?, ?, ?)`,
          [name, email, phone],
          err2 => {
            if (err2) {
              console.error('Error saving booking:', err2);
              app.locals.seatsAvailable += 1;
              db.run('UPDATE events SET available_seats = ? WHERE id = 1', [
                app.locals.seatsAvailable
              ]);
              socket.emit('bookingResult', {
                success: false,
                message: 'Could not save booking. Please try again.'
              });
              return;
            }

            // Success
            socket.emit('bookingResult', {
              success: true,
              message: 'Seat booked successfully!'
            });

            // Broadcast seat update to everyone
            io.emit('seatUpdate', app.locals.seatsAvailable);
          }
        );
      }
    );
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// --- Routes (pass io + app for reset/stats) ---
const eventsRoute = require('./routes/events')(io, app);
app.use('/events', eventsRoute);

// --- Start server ---
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Public access URL: http://YOUR_BACKEND_PUBLIC_IP:${PORT}`);
});
