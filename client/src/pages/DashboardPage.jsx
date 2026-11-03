import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi, parkingApi } from '../services/api';
import {
  Car,
  Clock,
  MapPin,
  Zap,
  Radio,
  CheckCircle2,
  CalendarCheck,
  Compass,
  ArrowRight,
  PlusCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  Ticket,
  DoorOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Fetch active session & facility locations
  const loadDashboardData = async () => {
    try {
      const locRes = await parkingApi.getLocations();
      if (locRes?.data) setLocations(locRes.data);
      else if (Array.isArray(locRes)) setLocations(locRes);

      if (isAuthenticated) {
        try {
          const bookRes = await bookingApi.getActive();
          if (bookRes?.data) setActiveBooking(bookRes.data);
          else setActiveBooking(null);
        } catch {
          setActiveBooking(null);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  // Live countdown clock for active booking
  useEffect(() => {
    if (!activeBooking?.endTime) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(activeBooking.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Expired / In Grace Period');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBooking]);

  const handleExtend = async (hours) => {
    if (!activeBooking) return;
    setExtending(true);
    try {
      await bookingApi.extend(activeBooking.id || activeBooking._id, hours);
      await loadDashboardData();
    } catch (err) {
      alert(`Could not extend booking: ${err.message}`);
    } finally {
      setExtending(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBooking) return;
    if (!window.confirm('Are you sure you want to cancel this booking and free the bay?')) return;
    try {
      await bookingApi.cancel(activeBooking.id || activeBooking._id, 'Driver requested cancellation');
      await loadDashboardData();
    } catch (err) {
      alert(`Could not cancel booking: ${err.message}`);
    }
  };

  // Aggregated Stats
  const totalSlots = locations.reduce((acc, l) => acc + (l.totalSlots || 0), 0) || 84;
  const availableSlots = locations.reduce((acc, l) => acc + (l.availableSlots || 0), 0) || 74;
  const evSlots = locations.reduce((acc, l) => acc + (l.evSlots || 0), 0) || 16;

  return (
    <div className="page-container">
      {/* Top Welcome & Identity Hero */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <span className="badge badge-green">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }}></span>
              SYSTEM ONLINE
            </span>
            <span className="badge badge-sand">
              <Radio size={12} /> ATLAS CLOUD V2
            </span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isAuthenticated ? `Welcome back, ${user?.fullName || 'Driver'}` : 'Intelligent Parking Network'}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '640px' }}>
            Real-time occupancy analytics, contactless RFID boom gate automation, and instant EV bay reservations across 4 connected hubs.
          </p>
        </div>

        {/* Quick Driver Action */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <Link to="/book" className="btn btn-primary" style={{ padding: '0.85rem 1.4rem' }}>
            <CalendarCheck size={18} />
            <span>Reserve a Bay</span>
          </Link>
          <Link to="/find" className="btn btn-outline" style={{ padding: '0.85rem 1.3rem' }}>
            <Compass size={18} />
            <span>Explore Hubs</span>
          </Link>
        </div>
      </div>

      {/* Network Live Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {/* Metric 1 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Available Bays
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="var(--green-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {availableSlots} <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>/ {totalSlots}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--green-primary)', fontWeight: '600', marginTop: '0.35rem' }}>
            ● Ready for immediate parking
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              EV Fast Chargers
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="var(--blue-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {evSlots} <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Bays Active</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--blue-primary)', fontWeight: '600', marginTop: '0.35rem' }}>
            Up to 150kW fast DC charging
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Smart Gate Sensor
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DoorOpen size={18} color="var(--amber-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            RFID Synced
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.35rem' }}>
            Hands-free boom barrier ready
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Registered Vehicle
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-sand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={18} color="var(--text-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {user?.vehicleNumber ? (
              <span className="badge-plate">{user.vehicleNumber}</span>
            ) : (
              <span style={{ fontSize: '1.1rem', color: 'var(--text-tertiary)' }}>No vehicle set</span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
            RFID: <span className="font-mono">{user?.rfid || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Active Session Section (Dynamic) */}
      {activeBooking && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid var(--blue-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.1)',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-blue" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
                <Clock size={14} /> ACTIVE PARKING PASS
              </span>
              <span className="badge badge-plate">
                {activeBooking.vehicleNumber}
              </span>
            </div>

            {/* Countdown Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--blue-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--blue-border)',
            }}>
              <Clock size={18} color="var(--blue-primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Time Remaining:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--blue-primary)', fontFamily: 'JetBrains Mono' }}>
                {timeLeft || 'Calculating...'}
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.75rem',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Location</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeBooking.location?.name || activeBooking.locationName || 'VS Mall Central'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Bay Identifier</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--blue-primary)', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                {activeBooking.slot?.slotNumber || activeBooking.slotNumber || 'B-101'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Duration & Rate</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeBooking.durationHours || 2} Hours (₹{activeBooking.totalCost || 120})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Gate Passcode</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', marginTop: '2px' }}>
                {activeBooking.bookingCode || activeBooking.accessCode || 'SP-9921'}
              </div>
            </div>
          </div>

          {/* Quick Actions for Active Booking */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleExtend(1)}
                disabled={extending}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
              >
                <PlusCircle size={15} color="var(--blue-primary)" />
                <span>Extend +1 Hr</span>
              </button>
              <button
                onClick={() => handleExtend(2)}
                disabled={extending}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
              >
                <PlusCircle size={15} color="var(--blue-primary)" />
                <span>Extend +2 Hrs</span>
              </button>
              <Link
                to="/gate"
                className="btn btn-dark"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem' }}
              >
                <DoorOpen size={15} />
                <span>Open Barrier Gate</span>
              </Link>
            </div>

            <button
              onClick={handleCancel}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1rem', color: 'var(--red-primary)', borderColor: 'var(--red-border)' }}
            >
              <XCircle size={15} />
              <span>Cancel Reservation</span>
            </button>
          </div>
        </div>
      )}

      {/* Facilities Overview Grid */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Connected Parking Hubs
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Real-time bay occupancy monitored via smart sensors
            </p>
          </div>
          <Link to="/find" style={{ fontSize: '0.875rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>View all hubs</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {locations.map((loc) => {
            const pct = Math.round(((loc.totalSlots - loc.availableSlots) / loc.totalSlots) * 100) || 15;
            return (
              <div key={loc.id || loc._id} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>{loc.name}</h3>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
                        <MapPin size={13} color="var(--text-tertiary)" />
                        <span>{loc.address}</span>
                      </div>
                    </div>
                    <span className="badge badge-sand" style={{ fontFamily: 'JetBrains Mono' }}>
                      ₹{loc.hourlyRate || 50}/hr
                    </span>
                  </div>

                  {/* Occupancy bar */}
                  <div style={{ margin: '1.25rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.785rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--green-primary)' }}>{loc.availableSlots} Bays Free</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{loc.totalSlots} Total</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 80 ? 'var(--red-primary)' : 'var(--blue-primary)', borderRadius: '9999px' }}></div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      ⚡ {loc.evSlots || 4} EV Bays
                    </span>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                      🛡️ 24/7 Security
                    </span>
                    <span className="badge badge-sand" style={{ fontSize: '0.7rem' }}>
                      📶 RFID Gate
                    </span>
                  </div>
                </div>

                <Link
                  to={`/book?locationId=${loc.id || loc._id}`}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '0.7rem', fontSize: '0.885rem', fontWeight: '700' }}
                >
                  <span>Select & Reserve Bay</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
