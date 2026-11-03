import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  CalendarCheck,
  Ticket,
  ShieldCheck,
  DoorOpen,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Car,
  Radio,
  Sparkles,
} from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: Sparkles },
    { name: 'Find Parking', path: '/find', icon: Compass },
    { name: 'Book Bay', path: '/book', icon: CalendarCheck },
    { name: 'My Passes', path: '/bookings', icon: Ticket, authRequired: true },
    { name: 'Smart Gate', path: '/gate', icon: DoorOpen },
    { name: 'Admin', path: '/admin', icon: ShieldCheck },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header style={{
      backgroundColor: 'rgba(251, 249, 245, 0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '42px',
            height: '42px',
            backgroundColor: 'var(--text-primary)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
          }}>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.05em' }}>P</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>SmartPark</span>
              <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>AI</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.04em' }}>
              MERN EDITION
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.5rem',
        }} className="desktop-nav">
          {navLinks.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.885rem',
                  fontWeight: active ? '700' : '600',
                  color: active ? 'var(--blue-primary)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--blue-light)' : 'transparent',
                  border: active ? '1px solid var(--blue-border)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                }}
              >
                <Icon size={16} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Auth Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Driver Identity Card */}
              <div style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
              }} className="desktop-user">
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--blue-light)',
                  color: 'var(--blue-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                }}>
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user?.fullName || 'Driver'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                    <span className="badge-plate" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                      {user?.vehicleNumber || 'NO-PLATE'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Radio size={10} color="var(--green-primary)" />
                      {user?.rfid || 'RFID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                title="Sign out of SmartPark"
              >
                <LogOut size={15} />
                <span className="desktop-label">Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/login"
                className="btn btn-outline"
                style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}
              >
                <LogIn size={15} />
                <span>Log In</span>
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.875rem' }}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div style={{
          padding: '1rem 1.5rem 1.5rem',
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {isAuthenticated && user && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Car size={20} color="var(--blue-primary)" />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Vehicle: <span className="font-mono">{user.vehicleNumber}</span> | RFID: <span className="font-mono">{user.rfid}</span>
                </div>
              </div>
            </div>
          )}

          {navLinks.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  fontWeight: active ? '700' : '600',
                  color: active ? 'var(--blue-primary)' : 'var(--text-primary)',
                  backgroundColor: active ? 'var(--blue-light)' : 'transparent',
                }}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Inline Responsive Styles */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .desktop-user { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 500px) {
          .desktop-label { display: none; }
        }
      `}</style>
    </header>
  );
}
