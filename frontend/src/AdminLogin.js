import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const correctPassword = 'admin123'; // simple front-end gate

  const login = () => {
    if (password === correctPassword) {
      navigate('/admin');
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <div className="login-box">
      <h2>Admin Login</h2>

      <input
        type="password"
        placeholder="Enter admin password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button className="btn btn-primary" onClick={login}>
        Login
      </button>

      <a href="/" style={{ display: 'block', marginTop: 18 }}>
        ← Back to Home
      </a>
    </div>
  );
}

export default AdminLogin;
