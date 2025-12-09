const express = require('express');
const cors = require('cors');
const http = require('http');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Create socket server
const io = require('socket.io')(server, {
  cors: { origin: '*' }
});

// In-memory seat count storage
let seatsAvailable = 50;

// Store it globally so routes can modify it
app.locals.seatsAvailable = seatsAvailable;

// Load seats from DB on startup
db.get('SELECT available_seats FROM events WHERE id = 1', (err, row) => {
  if (err || !row) {
    console.log('⚠ Could not load seats — using default 50');
  } else {
    seatsAvailable = row.available_seats;
    app.locals.seatsAvailable = seatsAvailable;
  }
  console.log('🎟 Seats loaded from DB:', app.locals.seatsAvailable);
});

// Socket.io logic
io.on('connection', socket => {
  console.log('🔌 Client connected');

  // Send latest seats on connect
  socket.emit('seatUpdate', app.locals.seatsAvailable);

  // Booking handler
  socket.on('bookSeat', ({ name, email, phone }) => {
    let seats = app.locals.seatsAvailable;

    if (seats > 0) {
      seats -= 1;

      // Update memory & DB
      app.locals.seatsAvailable = seats;

      db.run('UPDATE events SET available_seats = ? WHERE id = 1', [seats]);

      db.run(
        `INSERT INTO bookings (event_id, name, email, phone)
         VALUES (1, ?, ?, ?)`,
        [name, email, phone]
      );

      // Notify all clients
      io.emit('seatUpdate', seats);
    }
  });
});

// Load routes & send io instance
const eventsRoute = require('./routes/events')(io, app);
app.use('/events', eventsRoute);

// Start server
server.listen(5000, () => {
  console.log('🚀 Backend running on http://localhost:5000');
});
