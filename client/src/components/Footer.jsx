import React from 'react';
import { Link } from 'react-router-dom';
import { Database, ShieldCheck, Cpu, Clock, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid var(--border-light)',
      paddingTop: '3.5rem',
      paddingBottom: '2.5rem',
      marginTop: 'auto',
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
      }}>
        {/* Top 4 Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem',
        }}>
          {/* Col 1: Brand & DB Status */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'var(--text-primary)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '1.1rem',
              }}>
                P
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                SmartPark AI
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Full-stack MERN autonomous parking intelligence platform. Real-time bay occupancy, RFID telemetry, and automated barrier control.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              backgroundColor: 'var(--green-light)',
              border: '1px solid var(--green-border)',
              borderRadius: '9999px',
              fontSize: '0.785rem',
              fontWeight: '700',
              color: '#065f46',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--green-primary)',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)',
              }}></span>
              MongoDB Atlas Active (Cluster0)
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li><Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Live Dashboard</Link></li>
              <li><Link to="/find" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Find Vacant Slots</Link></li>
              <li><Link to="/book" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Reserve Parking Bay</Link></li>
              <li><Link to="/bookings" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>My Passes & QR</Link></li>
              <li><Link to="/gate" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gate Simulator</Link></li>
              <li><Link to="/admin" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Network Console</Link></li>
            </ul>
          </div>

          {/* Col 3: Facilities */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Connected Hubs
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--green-primary)" /> VS Mall Central (Floor 1-3)
              </li>
              <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--green-primary)" /> Metro Intermodal Deck
              </li>
              <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--green-primary)" /> City Center Plaza
              </li>
              <li style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--green-primary)" /> Silicon Tech Park Bay
              </li>
            </ul>
          </div>

          {/* Col 4: Architecture */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Enterprise Architecture
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Database size={16} color="var(--blue-primary)" />
                <span>MongoDB Mongoose Atlas Sharded</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Cpu size={16} color="var(--blue-primary)" />
                <span>Express REST & JWT Auth Guard</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Clock size={16} color="var(--amber-primary)" />
                <span>30-min Auto Release Daemon</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={16} color="var(--green-primary)" />
                <span>256-bit Encrypted Passcode Tokens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', marginBottom: '1.75rem' }}></div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.825rem',
          color: 'var(--text-tertiary)',
        }}>
          <div>
            © {new Date().getFullYear()} SmartPark AI Technologies Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>API Docs</span>
            <span>Cluster Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
