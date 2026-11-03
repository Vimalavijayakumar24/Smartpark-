import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Radio,
  Car,
  Clock,
  Zap,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // Strictly authenticates against MongoDB Atlas - No bypass / fake logins!
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please verify your credentials or register an account.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px - 250px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      backgroundColor: 'var(--bg-canvas)',
      width: '100%',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1180px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Left Column: Visual Showcase & Benefits */}
        <div style={{
          backgroundColor: 'var(--bg-sand-light)',
          borderRight: '1px solid var(--border-light)',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '2.5rem',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="badge badge-blue">
                <Sparkles size={12} /> SMART MOBILITY
              </span>
              <span className="badge badge-green">
                <Radio size={12} /> ATLAS SYNCED
              </span>
            </div>

            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', lineHeight: 1.25, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Your parking.<br />
              <span style={{ color: 'var(--blue-primary)' }}>Under control.</span>
            </h2>

            <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Discover available bays in real-time, reserve EV charging spaces, and experience automated hands-free RFID boom barrier access.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--blue-light)',
                  color: 'var(--blue-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Zap size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--text-primary)' }}>Live Slot Allocation</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Instant bay locking and dynamic rate calculation</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--green-light)',
                  color: 'var(--green-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Radio size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--text-primary)' }}>RFID Barrier Telemetry</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Zero-contact smart boom gate authentication</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--amber-light)',
                  color: 'var(--amber-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Clock size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--text-primary)' }}>Grace Period & Extensions</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>One-click booking extension directly from your dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Panel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
          }}>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>84</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Live Bays</div>
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--green-primary)' }}>99.8%</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Gate Uptime</div>
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--blue-primary)' }}>1.8s</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Avg Entry</div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div style={{
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--blue-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              DRIVER AUTHENTICATION
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Sign in with your verified SmartPark account to access your reserved bays.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-error animate-fade-in" style={{ display: 'flex', alignItems: 'center' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Authentication Failed:</strong> {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="form-group">
              <label className="form-label">
                <span>Email address</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="driver@smartpark.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div className="form-label">
                <span>Password</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', cursor: 'pointer' }} onClick={() => alert('Please contact the SmartPark administrator at admin@smartpark.ai to reset your credentials.')}>
                  Forgot?
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.9rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
              <input
                type="checkbox"
                id="keepSignedIn"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--blue-primary)',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="keepSignedIn" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating with Atlas...</span>
              ) : (
                <>
                  <span>Sign In to SmartPark</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--bg-canvas-subtle)',
            border: '1px dashed var(--border-light)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Demo Credentials
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Verified Atlas Accounts</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleFillDemo('user@smartpark.ai', 'password123')}
                style={{
                  fontSize: '0.785rem',
                  padding: '0.35rem 0.65rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}
              >
                👤 Standard Driver (user@smartpark.ai)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@smartpark.ai', 'admin123')}
                style={{
                  fontSize: '0.785rem',
                  padding: '0.35rem 0.65rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}
              >
                🛡️ Network Admin (admin@smartpark.ai)
              </button>
            </div>
          </div>

          {/* Registration Redirect */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}>
            Don't have a verified account yet?{' '}
            <Link to="/register" style={{ fontWeight: '700', color: 'var(--blue-primary)' }}>
              Create an account now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
