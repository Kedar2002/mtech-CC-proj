import React, { useEffect, useState } from 'react';
import { API } from './api';
import EventCard from './components/EventCard';
import { io } from 'socket.io-client';

const socket = io('http://52.66.252.52:5000');

function Home() {
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [isBooking, setIsBooking] = useState(false);

  const loadEvent = () => {
    API.get('/events').then(res => {
      setEvent(res.data);
      setSeats(res.data.available_seats);
    });
  };

  useEffect(() => {
    loadEvent();

    const handleSeatUpdate = count => setSeats(count);
    const handleBookingResult = result => {
      setIsBooking(false);
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      if (result.success) {
        setResetTrigger(prev => prev + 1);
      }
    };

    socket.on('seatUpdate', handleSeatUpdate);
    socket.on('bookingResult', handleBookingResult);

    return () => {
      socket.off('seatUpdate', handleSeatUpdate);
      socket.off('bookingResult', handleBookingResult);
    };
  }, []);

  const handleBooking = form => {
    setStatus(null);
    setIsBooking(true);
    socket.emit('bookSeat', form);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">🎟 Event Booking</h1>
        <a href="/admin-login">Admin Login →</a>
      </div>

      {event && (
        <>
          <EventCard
            event={event}
            seats={seats}
            onBook={handleBooking}
            resetTrigger={resetTrigger}
            isBooking={isBooking}
          />

          {status && (
            <div
              className={
                'alert ' +
                (status.type === 'success' ? 'alert-success' : 'alert-error')
              }
            >
              {status.message}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
