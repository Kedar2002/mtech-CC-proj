import React, { useEffect, useState } from 'react';
import { API } from './api';

import axios from "axios";

export const API = axios.create({
  baseURL: "http://13.233.146.34:5000"   // ← replace with YOUR backend IP
});

function Admin() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');

  const loadBookings = () => {
    API.get('/events/bookings').then(res => setBookings(res.data));
  };

  const loadStats = () => {
    API.get('/events/stats').then(res => setStats(res.data));
  };

  useEffect(() => {
    loadBookings();
    loadStats();
  }, []);

  const resetDB = async () => {
    if (!window.confirm('Reset all bookings and seats?')) return;
    await API.post('/events/reset');
    await Promise.all([loadBookings(), loadStats()]);
  };

  const exportCSV = () => {
    if (!bookings.length) return;

    const header = ['Name', 'Email', 'Phone', 'Event', 'Timestamp'];
    const rows = bookings.map(b => [
      b.name,
      b.email,
      b.phone,
      b.event_title,
      new Date(b.timestamp).toLocaleString()
    ]);

    const csv = [header, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBookings = bookings.filter(b => {
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <a href="/">← Back to Home</a>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Seats</div>
            <div className="stat-value">{stats.totalSeats}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available Seats</div>
            <div className="stat-value">{stats.availableSeats}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{stats.totalBookings}</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-danger" onClick={resetDB}>
          Reset Database
        </button>
        <button className="btn btn-primary" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      {/* Bookings Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Event</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(b => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.email}</td>
                <td>{b.phone}</td>
                <td>{b.event_title}</td>
                <td>{new Date(b.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {!filteredBookings.length && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;
