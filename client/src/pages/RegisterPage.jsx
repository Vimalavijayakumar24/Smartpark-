import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Car,
  Radio,
  Lock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Exactly the 7 mandatory fields requested by specification
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    vehicleNumber: '',
    rfid: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'vehicleNumber' || name === 'rfid' ? value.toUpperCase() : value,
    }));
    setError('');
  };

  const handleGenerateRfid = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, rfid: `RF-${randomSuffix}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field Validations
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 7) {
      setError('Please provide a valid phone number (at least 7 digits).');
      return;
    }
    if (!formData.vehicleNumber.trim()) {
      setError('Vehicle Number is required (e.g., KA-01-AB-1234 or DL-3C-9999).');
      return;
    }
    if (!formData.rfid.trim()) {
      setError('RFID Number is required for smart boom gate sensor access.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      // Submits directly to MongoDB Atlas User collection
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        vehicleNumber: formData.vehicleNumber.trim(),
        rfid: formData.rfid.trim(),
        password: formData.password,
      });

      setSuccess('Account created and registered in MongoDB Atlas! Redirecting...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1200);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. The email, vehicle number, or RFID may already exist in the database.');
    } finally {
      setLoading(false);
    }
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
        maxWidth: '920px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '3.5rem 3rem',
      }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-green">
              <Sparkles size={12} /> INSTANT ACCESS
            </span>
            <span className="badge badge-sand">
              <Radio size={12} /> RFID HARDWARE SYNC
            </span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Create Your SmartPark Account
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Join the smart parking network. Register your vehicle plate and RFID tag for automated barrier entry and instant booking.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-fade-in" style={{ display: 'flex', alignItems: 'center' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Validation Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <div>{success}</div>
          </div>
        )}

        {/* Form Grid */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            columnGap: '2rem',
            rowGap: '0.5rem',
            marginBottom: '1.5rem',
          }}>
            {/* 1. Full Name */}
            <div className="form-group">
              <label className="form-label">
                <span>1. Full Name *</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="e.g. David Hasselhoff"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 2. Email Address */}
            <div className="form-group">
              <label className="form-label">
                <span>2. Email Address *</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="driver@smartpark.ai"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 3. Phone Number */}
            <div className="form-group">
              <label className="form-label">
                <span>3. Phone Number *</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="+1 (555) 234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 4. Vehicle Number (Plate) */}
            <div className="form-group">
              <label className="form-label">
                <span>4. Vehicle Number (License Plate) *</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Car size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  name="vehicleNumber"
                  className="form-input font-mono"
                  style={{ paddingLeft: '2.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  placeholder="e.g. KITT-2000 or DL-01-AB-1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 5. RFID Tag Number */}
            <div className="form-group">
              <div className="form-label">
                <span>5. RFID Tag Identifier *</span>
                <span
                  style={{ fontSize: '0.785rem', color: 'var(--blue-primary)', cursor: 'pointer', fontWeight: '700' }}
                  onClick={handleGenerateRfid}
                  title="Generate a realistic RFID tag number"
                >
                  ⚡ Auto-Assign Tag
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Radio size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  name="rfid"
                  className="form-input font-mono"
                  style={{ paddingLeft: '2.75rem', textTransform: 'uppercase' }}
                  placeholder="e.g. RF-882910"
                  value={formData.rfid}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Empty column spacer or helper text */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0' }}>
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-sand-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                border: '1px solid var(--border-light)',
                width: '100%',
              }}>
                ℹ️ <strong>Hardware Sensor Note:</strong> Your RFID card and Vehicle License Plate are automatically registered into the gate sensor database for instant touchless entry.
              </div>
            </div>

            {/* 6. Password */}
            <div className="form-group">
              <label className="form-label">
                <span>6. Password *</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 7. Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                <span>7. Confirm Password *</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <ShieldCheck size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: '700' }}
              disabled={loading}
            >
              {loading ? (
                <span>Registering Account in MongoDB Atlas...</span>
              ) : (
                <>
                  <span>Create Account & Register Driver</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Login Redirect */}
        <div style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          fontSize: '0.925rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1.75rem',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '700', color: 'var(--blue-primary)' }}>
            Log in to SmartPark
          </Link>
        </div>
      </div>
    </div>
  );
}
