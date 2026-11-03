import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parkingApi, bookingApi } from '../services/api';
import {
  Car,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Radio,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function BookSlotPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(searchParams.get('locationId') || '');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [filterType, setFilterType] = useState('ALL'); // ALL, EV, STANDARD
  const [durationHours, setDurationHours] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('FASTAG');

  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [rfid, setRfid] = useState(user?.rfid || '');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update vehicle info when user context changes
  useEffect(() => {
    if (user?.vehicleNumber && !vehicleNumber) setVehicleNumber(user.vehicleNumber);
    if (user?.rfid && !rfid) setRfid(user.rfid);
  }, [user]);

  // Load locations
  useEffect(() => {
    async function initLocations() {
      try {
        const res = await parkingApi.getLocations();
        const locs = res?.data || (Array.isArray(res) ? res : []);
        setLocations(locs);

        if (!selectedLocationId && locs.length > 0) {
          setSelectedLocationId(locs[0].id || locs[0]._id);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    }
    initLocations();
  }, []);

  // Load slots whenever location changes
  useEffect(() => {
    if (!selectedLocationId) return;

    async function loadSlots() {
      try {
        const res = await parkingApi.getSlots(selectedLocationId);
        const data = res?.data || (Array.isArray(res) ? res : []);
        setSlots(data);
        setSelectedSlot(null);
      } catch (err) {
        console.error('Failed to load slots:', err);
      }
    }
    loadSlots();
  }, [selectedLocationId]);

  const activeLocation = locations.find((l) => (l.id || l._id) === selectedLocationId);
  const hourlyRate = activeLocation?.hourlyRate || 50;
  const totalCost = hourlyRate * durationHours;

  // Filter slots for current level and type
  const visibleSlots = slots.filter((slot) => {
    if (slot.level !== selectedLevel) return false;
    if (filterType === 'EV' && slot.type !== 'ev') return false;
    if (filterType === 'STANDARD' && slot.type !== 'standard') return false;
    return true;
  });

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/book' } } });
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available parking bay from the grid below.');
      return;
    }

    if (!vehicleNumber.trim()) {
      setError('Vehicle License Plate Number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingApi.create({
        locationId: selectedLocationId,
        slotId: selectedSlot.id || selectedSlot._id,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        rfid: rfid.trim().toUpperCase(),
        durationHours: Number(durationHours),
        paymentMethod,
      });

      // Navigate to My Bookings pass view
      navigate('/bookings', { replace: true });
    } catch (err) {
      console.error('Booking failed:', err);
      setError(err.message || 'Failed to complete reservation. The slot may have just been reserved by another driver.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>
          <Sparkles size={12} /> INTERACTIVE BAY ALLOCATION
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Reserve Your Parking Bay
        </h1>
        <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Select your target facility, pick your desired parking bay from the live sensor grid, and lock your spot.
        </p>
      </div>

      {error && (
        <div className="alert alert-error animate-fade-in" style={{ display: 'flex', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Main Grid: Bay Map & Reservation Form */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Left: Interactive 2D Bay Map */}
        <div className="card" style={{ padding: '2rem' }}>
          {/* Facility Picker Tabs */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Select Parking Facility
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {locations.map((loc) => {
                const isSelected = (loc.id || loc._id) === selectedLocationId;
                return (
                  <button
                    key={loc.id || loc._id}
                    type="button"
                    onClick={() => setSelectedLocationId(loc.id || loc._id)}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '700' : '600',
                      backgroundColor: isSelected ? 'var(--blue-primary)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      border: isSelected ? '1px solid var(--blue-primary)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {loc.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floor & Filter Controls */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.5rem',
          }}>
            {/* Level toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Floor:</span>
              <button
                type="button"
                onClick={() => setSelectedLevel(1)}
                className={selectedLevel === 1 ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Level 1
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevel(2)}
                className={selectedLevel === 2 ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Level 2
              </button>
            </div>

            {/* Bay Filter */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.785rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  backgroundColor: filterType === 'ALL' ? 'var(--text-primary)' : '#ffffff',
                  color: filterType === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('EV')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.785rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  backgroundColor: filterType === 'EV' ? 'var(--blue-primary)' : '#ffffff',
                  color: filterType === 'EV' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                }}
              >
                ⚡ EV Fast
              </button>
            </div>
          </div>

          {/* Grid Legend */}
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.785rem', fontWeight: '600', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '14px', height: '14px', backgroundColor: '#ffffff', border: '2px solid var(--green-primary)', borderRadius: '4px' }}></span>
              <span>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '14px', height: '14px', backgroundColor: 'var(--blue-primary)', borderRadius: '4px' }}></span>
              <span>Selected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '14px', height: '14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}></span>
              <span>Occupied</span>
            </div>
          </div>

          {/* The 2D Visual Bay Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: '0.75rem',
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            border: '2px dashed var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            minHeight: '260px',
          }}>
            {visibleSlots.map((slot) => {
              const isOccupied = slot.isOccupied || slot.isReserved;
              const isSelected = selectedSlot && (selectedSlot.id || selectedSlot._id) === (slot.id || slot._id);
              const isEv = slot.type === 'ev';

              return (
                <button
                  key={slot.id || slot._id}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    height: '84px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '2.5px solid var(--blue-primary)'
                      : isOccupied
                      ? '1px solid #e2e8f0'
                      : '2px solid var(--green-primary)',
                    backgroundColor: isSelected
                      ? 'var(--blue-light)'
                      : isOccupied
                      ? '#f1f5f9'
                      : '#ffffff',
                    cursor: isOccupied ? 'not-allowed' : 'pointer',
                    boxShadow: isSelected ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {isEv && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'var(--blue-primary)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                    }}>
                      ⚡
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'JetBrains Mono',
                    fontWeight: '800',
                    fontSize: '0.925rem',
                    color: isOccupied ? '#94a3b8' : isSelected ? 'var(--blue-primary)' : 'var(--text-primary)',
                  }}>
                    {slot.slotNumber}
                  </span>
                  <span style={{
                    fontSize: '0.675rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: isOccupied ? '#94a3b8' : isSelected ? 'var(--blue-primary)' : 'var(--green-primary)',
                  }}>
                    {isOccupied ? 'Taken' : isSelected ? 'Selected' : 'Free'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Booking Summary & Final Confirmation Card */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Reservation Details
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Review your rate and select parking duration.
          </p>

          <form onSubmit={handleBooking}>
            {/* Selected Bay preview */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Selected Bay
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: selectedSlot ? 'var(--blue-primary)' : 'var(--text-tertiary)', fontFamily: 'JetBrains Mono' }}>
                  {selectedSlot ? selectedSlot.slotNumber : 'Pick a bay'}
                </div>
              </div>
              {selectedSlot && (
                <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                  Level {selectedSlot.level} • {selectedSlot.type.toUpperCase()}
                </span>
              )}
            </div>

            {/* Vehicle Plate */}
            <div className="form-group">
              <label className="form-label">
                <span>Vehicle License Plate</span>
              </label>
              <input
                type="text"
                className="form-input font-mono"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                placeholder="e.g. KA-01-AB-1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* RFID Tag */}
            <div className="form-group">
              <label className="form-label">
                <span>RFID Gate Card Number</span>
              </label>
              <input
                type="text"
                className="form-input font-mono"
                style={{ textTransform: 'uppercase' }}
                placeholder="e.g. RF-882910"
                value={rfid}
                onChange={(e) => setRfid(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* Duration Slider */}
            <div className="form-group" style={{ margin: '1.75rem 0' }}>
              <div className="form-label">
                <span>Duration</span>
                <span style={{ color: 'var(--blue-primary)', fontWeight: '800' }}>
                  {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--blue-primary)',
                  cursor: 'pointer',
                  margin: '0.5rem 0',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <span>1 hr</span>
                <span>4 hrs</span>
                <span>8 hrs</span>
                <span>12 hrs</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">
                <span>Payment & Verification</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('FASTAG')}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    backgroundColor: paymentMethod === 'FASTAG' ? 'var(--blue-light)' : '#ffffff',
                    color: paymentMethod === 'FASTAG' ? 'var(--blue-primary)' : 'var(--text-secondary)',
                    border: paymentMethod === 'FASTAG' ? '1.5px solid var(--blue-primary)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ FastTag / RFID Auto
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    backgroundColor: paymentMethod === 'CARD' ? 'var(--blue-light)' : '#ffffff',
                    color: paymentMethod === 'CARD' ? 'var(--blue-primary)' : 'var(--text-secondary)',
                    border: paymentMethod === 'CARD' ? '1.5px solid var(--blue-primary)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                  }}
                >
                  💳 UPI / Card
                </button>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-canvas-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1.75rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span>Hourly Rate</span>
                <span>₹{hourlyRate} / hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                <span>Duration</span>
                <span>× {durationHours} hrs</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-light)', marginBottom: '0.65rem' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--blue-primary)' }}>₹{totalCost}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', fontWeight: '700' }}
              disabled={submitting || !selectedSlot}
            >
              {submitting ? (
                <span>Confirming Booking in Atlas...</span>
              ) : (
                <>
                  <span>Confirm & Lock Parking Bay</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
