import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { setToken } from '../api/axios';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.username || !form.password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/admin/login', form);
      setToken(data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, #0f2010 0%, #060e06 70%)',
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: '#0b170b',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 24,
          padding: 48,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🌿</div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.8rem', fontWeight: 600, color: '#5ec96c',
          }}>
            Admin Portal
          </h2>
          <p style={{ color: 'var(--soft)', fontSize: '0.82rem', marginTop: 6 }}>
            Ayyappa Tours Management
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="admin"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 14, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#5ec96c', color: '#060e06',
              border: 'none', padding: '14px',
              borderRadius: 10, fontSize: '1rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              transition: '0.3s', marginTop: 4,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {loading ? 'Signing in…' : 'Login to Dashboard'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: 22,
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)',
        }}>
          This page is for administrators only
        </p>
      </motion.div>
    </div>
  );
}