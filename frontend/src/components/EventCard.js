import React, { useState, useEffect } from 'react';

function EventCard({ event, seats, onBook, resetTrigger, isBooking }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    setForm({ name: '', email: '', phone: '' });
  }, [resetTrigger]);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="card">
      <h2>{event.title}</h2>
      <p>{event.description}</p>

      <h3 style={{ marginTop: 12, fontWeight: 600 }}>
        Seats Available: <span style={{ color: '#2563eb' }}>{seats}</span>
      </h3>

      <label className="label">Full Name</label>
      <input
        className="input-field"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Enter your full name"
      />

      <label className="label">Email</label>
      <input
        className="input-field"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Enter your email address"
      />

      <label className="label">Phone Number</label>
      <input
        className="input-field"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Enter phone number"
      />

      <button
        className={
          'btn ' + (seats > 0 && !isBooking ? 'btn-primary' : 'btn-disabled')
        }
        disabled={seats <= 0 || isBooking}
        onClick={() => onBook(form)}
        style={{ marginTop: 10 }}
      >
        {seats <= 0 ? 'Sold Out' : isBooking ? 'Booking...' : 'Book Seat'}
      </button>
    </div>
  );
}

export default EventCard;
