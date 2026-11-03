import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../services/api';
import {
  Ticket,
  Clock,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  PlusCircle,
  MapPin,
  Car,
  Radio,
  QrCode,
  ArrowRight,
  ShieldCheck,
  DoorOpen,
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendingId, setExtendingId] = useState(null);

  const loadBookings = async () => {
    try {
      const res = await bookingApi.getMyBookings();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setBookings(list);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleExtend = async (bookingId, hours) => {
    setExtendingId(bookingId);
    try {
      await bookingApi.extend(bookingId, hours);
      await loadBookings();
    } catch (err) {
      alert(`Could not extend booking: ${err.message}`);
    } finally {
      setExtendingId(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking and release the parking bay?')) return;
    try {
      await bookingApi.cancel(bookingId, 'Driver cancelled via web portal');
      await loadBookings();
    } catch (err) {
      alert(`Could not cancel booking: ${err.message}`);
    }
  };

  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'active');
  const pastBookings = bookings.filter((b) => b.status !== 'confirmed' && b.status !== 'active');

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div>
          <span className="badge badge-green" style={{ marginBottom: '0.45rem' }}>
            <Ticket size={12} /> DIGITAL PARKING PASSES
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            My Passes & History
          </h1>
          <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Access your contactless QR parking passes, extend parking sessions, and inspect historical receipts.
          </p>
        </div>

        <Link to="/book" className="btn btn-primary" style={{ padding: '0.85rem 1.4rem' }}>
          <CalendarCheck size={18} />
          <span>Book Another Bay</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          Loading your active passes from MongoDB Atlas...
        </div>
      ) : (
        <>
          {/* Active Pass Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Active Parking Passes ({activeBookings.length})
            </h2>

            {activeBookings.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-canvas-subtle)',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Ticket size={28} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>No active parking passes</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto 1.5rem' }}>
                  You do not currently have any active bay reservations. Reserve a bay now for touchless RFID gate access.
                </p>
                <Link to="/book" className="btn btn-primary">
                  Reserve a Bay Now
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '1.75rem',
              }}>
                {activeBookings.map((b) => {
                  const bookingId = b.id || b._id;
                  const code = b.bookingCode || b.accessCode || 'SP-0000';

                  return (
                    <div
                      key={bookingId}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid var(--green-border)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-md)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Top Pass Header */}
                      <div style={{
                        padding: '1.5rem 2rem',
                        backgroundColor: 'var(--green-light)',
                        borderBottom: '1px solid var(--green-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
                            ● ACTIVE PASS
                          </span>
                          <span className="badge-plate">
                            {b.vehicleNumber}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.785rem', color: '#065f46', fontWeight: '700' }}>
                          RFID Synced
                        </span>
                      </div>

                      {/* Main Pass Body */}
                      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* QR Code and Code Preview */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.5rem',
                          padding: '1.25rem',
                          backgroundColor: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--border-light)',
                        }}>
                          {/* Mock SVG QR Code */}
                          <div style={{
                            width: '92px',
                            height: '92px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <QrCode size={78} color="var(--text-primary)" />
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Gate Access Passcode
                            </span>
                            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', marginTop: '2px' }}>
                              {code}
                            </div>
                            <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Scan at RFID sensor column or entrance tablet
                            </div>
                          </div>
                        </div>

                        {/* Pass Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Facility</span>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                              {b.location?.name || b.locationName || 'VS Mall Central'}
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Reserved Bay</span>
                            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--blue-primary)', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                              {b.slot?.slotNumber || b.slotNumber || 'B-101'}
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Duration & Paid</span>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                              {b.durationHours || 2} Hours (₹{b.totalCost || 100})
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>RFID Card</span>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', fontFamily: 'JetBrains Mono', color: 'var(--text-primary)', marginTop: '2px' }}>
                              {b.rfid || 'RF-SENSOR'}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          borderTop: '1px solid var(--border-light)',
                          paddingTop: '1.25rem',
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleExtend(bookingId, 1)}
                              disabled={extendingId === bookingId}
                              className="btn btn-outline"
                              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                            >
                              <PlusCircle size={14} color="var(--blue-primary)" />
                              <span>+1 Hr</span>
                            </button>
                            <button
                              onClick={() => handleExtend(bookingId, 2)}
                              disabled={extendingId === bookingId}
                              className="btn btn-outline"
                              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                            >
                              <PlusCircle size={14} color="var(--blue-primary)" />
                              <span>+2 Hrs</span>
                            </button>
                            <Link
                              to="/gate"
                              className="btn btn-dark"
                              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                            >
                              <DoorOpen size={14} />
                              <span>Simulate Gate</span>
                            </Link>
                          </div>

                          <button
                            onClick={() => handleCancel(bookingId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--red-primary)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <XCircle size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past History Table */}
          {pastBookings.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                Past Parking History ({pastBookings.length})
              </h2>

              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.885rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Code</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Facility</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Bay</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Vehicle</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Amount</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBookings.map((b) => (
                      <tr key={b.id || b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>
                          {b.bookingCode || b.accessCode || 'SP-OLD'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          {b.location?.name || b.locationName || 'VS Mall'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'JetBrains Mono', color: 'var(--blue-primary)', fontWeight: '700' }}>
                          {b.slot?.slotNumber || b.slotNumber || 'B-101'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span className="badge-plate" style={{ fontSize: '0.725rem' }}>{b.vehicleNumber}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>
                          ₹{b.totalCost || 50}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span className={`badge ${b.status === 'completed' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.75rem' }}>
                            {b.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
