import React, { useState } from 'react';
import { loginUser, registerUser } from '../firebase';

const EyeIcon = ({ visible, onClick }) => (
  <span
    onClick={onClick}
    style={{
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#888',
      fontSize: 20,
      zIndex: 2
    }}
    aria-label={visible ? 'Nascondi password' : 'Mostra password'}
    tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
  >
    {visible ? (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.32 2.1-3.36 4.24-5.13M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 15.5c-1.93 0-3.5-1.57-3.5-3.5 0-.47.09-.92.26-1.33"/></svg>
    ) : (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12C2.73 15.11 7 19 12 19s9.27-3.89 11-7c-1.73-3.11-6-7-11-7S2.73 8.89 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
    )}
  </span>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Rileva dark mode
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div
      className="login-container"
      style={{
        background: isDark ? '#23232a' : 'white',
        color: isDark ? '#f2f2f7' : '#333',
        boxShadow: isDark ? '0 0 10px rgba(0,0,0,0.5)' : '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      <h2 style={{ color: isDark ? '#f2f2f7' : '#333' }}>{isLogin ? 'Accedi' : 'Registrati'}</h2>
      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="form-group">
          <label style={{ color: isDark ? '#ccc' : '#666' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              background: isDark ? '#18181a' : 'white',
              color: isDark ? '#f2f2f7' : '#333',
              border: isDark ? '1px solid #333' : '1px solid #ddd'
            }}
          />
        </div>
        <div className="form-group password-group">
          <label style={{ color: isDark ? '#ccc' : '#666' }}>Password:</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="password-input"
              style={{
                background: isDark ? '#18181a' : 'white',
                color: isDark ? '#f2f2f7' : '#333',
                border: isDark ? '1px solid #333' : '1px solid #ddd',
                width: '100%'
              }}
              autoComplete="current-password"
            />
            <span className="eye-icon">
              <EyeIcon visible={showPassword} onClick={() => setShowPassword(v => !v)} />
            </span>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" style={{ background: isDark ? '#007AFF' : '#007bff' }}>
          {isLogin ? 'Accedi' : 'Registrati'}
        </button>
      </form>
      <button
        className="switch-mode"
        onClick={() => setIsLogin(!isLogin)}
        style={{ color: isDark ? '#007AFF' : '#007bff' }}
      >
        {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
      </button>
    </div>
  );
};

export default Login; 