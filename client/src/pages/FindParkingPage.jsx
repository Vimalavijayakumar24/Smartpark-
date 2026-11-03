import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parkingApi } from '../services/api';
import {
  Search,
  MapPin,
  Zap,
  Radio,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export default function FindParkingPage() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await parkingApi.getLocations();
        if (res?.data) setLocations(res.data);
        else if (Array.isArray(res)) setLocations(res);
      } catch (err) {
        console.error('Failed to fetch parking locations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  const filtered = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.address.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'EV') return (loc.evSlots || 0) > 0;
    if (filterType === 'ECONOMY') return (loc.hourlyRate || 50) <= 50;
    if (filterType === 'VACANT') return (loc.availableSlots || 0) >= 15;

    return true;
  });

  return (
    <div className="page-container">
      {/* Title & Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem',
      }}>
        <div style={{ maxWidth: '640px', marginBottom: '1.75rem' }}>
          <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>
            <Sparkles size={12} /> REAL-TIME SENSOR NETWORK
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Find Vacant Parking Bays
          </h1>
          <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Browse live slot telemetry across commercial hubs, transit decks, and tech parks.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '280px' }}>
            <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by facility name or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType('ALL')}
              className={filterType === 'ALL' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
            >
              All Hubs ({locations.length})
            </button>
            <button
              onClick={() => setFilterType('EV')}
              className={filterType === 'EV' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
            >
              ⚡ EV Charging
            </button>
            <button
              onClick={() => setFilterType('ECONOMY')}
              className={filterType === 'ECONOMY' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
            >
              💰 Economy (≤ ₹50/hr)
            </button>
            <button
              onClick={() => setFilterType('VACANT')}
              className={filterType === 'VACANT' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
            >
              🟢 High Vacancy
            </button>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          Loading facilities from MongoDB Atlas...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          textAlign: 'center',
          border: '1px solid var(--border-light)',
        }}>
          <h3>No parking hubs matched your search</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Try clearing the search query or changing the filter.</p>
          <button onClick={() => { setSearch(''); setFilterType('ALL'); }} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
        }}>
          {filtered.map((loc) => {
            const occupied = loc.totalSlots - loc.availableSlots;
            const pct = Math.round((occupied / loc.totalSlots) * 100);

            return (
              <div key={loc.id || loc._id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {loc.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '3px' }}>
                        <MapPin size={14} color="var(--text-tertiary)" />
                        <span>{loc.address}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--blue-primary)', fontFamily: 'JetBrains Mono' }}>
                        ₹{loc.hourlyRate || 50}
                      </div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>per hour</span>
                    </div>
                  </div>

                  {/* Occupancy Indicator */}
                  <div style={{
                    margin: '1.5rem 0',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-canvas)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: '700' }}>
                      <span style={{ color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={15} /> {loc.availableSlots} Bays Available
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {occupied} / {loc.totalSlots} Occupied
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 80 ? 'var(--red-primary)' : 'var(--blue-primary)', borderRadius: '9999px' }}></div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                    <span className="badge badge-green">⚡ {loc.evSlots || 4} EV Fast Bays</span>
                    <span className="badge badge-blue">📶 Boom Gate RFID</span>
                    <span className="badge badge-sand">🅿️ Multi-Level</span>
                  </div>
                </div>

                <Link
                  to={`/book?locationId=${loc.id || loc._id}`}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
                >
                  <span>Select Bay at {loc.name}</span>
                  <ArrowRight size={17} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
