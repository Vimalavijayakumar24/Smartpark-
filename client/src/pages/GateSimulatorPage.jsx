import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gateApi } from '../services/api';
import {
  DoorOpen,
  Radio,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function GateSimulatorPage() {
  const { user } = useAuth();

  const [rfid, setRfid] = useState(user?.rfid || 'RF-882910');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || 'KITT-2000');
  const [actionType, setActionType] = useState('entry'); // 'entry' or 'exit'

  // Gate Animation State
  const [barrierState, setBarrierState] = useState('closed'); // 'closed', 'authenticating', 'open'
  const [gateMessage, setGateMessage] = useState('TAP RFID OR SCAN LICENSE PLATE');
  const [logs, setLogs] = useState([
    { time: 'Ready', text: 'IoT Boom Barrier Controller initialized on Cluster0.' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!rfid.trim() && !vehicleNumber.trim()) {
      alert('Please provide an RFID tag or Vehicle Number to authenticate.');
      return;
    }

    setLoading(true);
    setBarrierState('authenticating');
    setGateMessage('AUTHENTICATING SENSOR TELEMETRY...');

    try {
      const payload = {
        rfid: rfid.trim().toUpperCase(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
      };

      const res = actionType === 'entry'
        ? await gateApi.entry(payload)
        : await gateApi.exit(payload);

      // Open Barrier Animation
      setBarrierState('open');
      const assignedSlot = res?.data?.slotNumber || res?.slotNumber || 'B-101';
      const driverName = res?.data?.user?.fullName || user?.fullName || 'Driver';

      if (actionType === 'entry') {
        setGateMessage(`ACCESS GRANTED: WELCOME ${driverName.toUpperCase()}! PROCEED TO BAY ${assignedSlot}`);
        setLogs((prev) => [
          { time: new Date().toLocaleTimeString(), text: `[ENTRY GRANTED] Barrier opened for ${payload.vehicleNumber} (RFID: ${payload.rfid}) -> Assigned Slot: ${assignedSlot}` },
          ...prev,
        ]);
      } else {
        setGateMessage(`EXIT VERIFIED: THANK YOU ${driverName.toUpperCase()}! DRIVE SAFELY.`);
        setLogs((prev) => [
          { time: new Date().toLocaleTimeString(), text: `[EXIT COMPLETED] Barrier opened for ${payload.vehicleNumber}. Parking session closed.` },
          ...prev,
        ]);
      }

      // Automatically lower barrier after 4.5 seconds
      setTimeout(() => {
        setBarrierState('closed');
        setGateMessage('TAP RFID OR SCAN LICENSE PLATE');
      }, 4500);

    } catch (err) {
      console.error('Gate simulation failed:', err);
      setBarrierState('closed');
      setGateMessage(`ACCESS DENIED: ${err.message.toUpperCase()}`);
      setLogs((prev) => [
        { time: new Date().toLocaleTimeString(), text: `[ACCESS REJECTED] ${err.message}` },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-amber" style={{ marginBottom: '0.45rem' }}>
          <Radio size={12} /> HARDWARE SENSOR EMULATOR
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Smart Boom Barrier Gate Simulator
        </h1>
        <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Test contactless vehicle entry and exit with simulated RFID antennas, optical plate recognition, and animated boom barrier arms.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Left: Animated Barrier Gate Visualizer */}
        <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* LCD Status Screen */}
          <div style={{
            width: '100%',
            backgroundColor: '#0f172a',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
            border: '2px solid #334155',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          }}>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              GATE 01 - AUTOMATED BOOM SENSOR
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontWeight: '700',
              fontSize: '1rem',
              color: barrierState === 'open' ? '#34d399' : barrierState === 'authenticating' ? '#fbbf24' : '#f87171',
              letterSpacing: '0.04em',
            }}>
              {gateMessage}
            </div>
          </div>

          {/* Boom Barrier Graphic */}
          <div style={{
            width: '100%',
            height: '240px',
            backgroundColor: 'var(--bg-canvas-subtle)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 2rem 2.5rem 2rem',
            overflow: 'hidden',
          }}>
            {/* Lane Markers */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: 0,
              right: 0,
              height: '4px',
              borderBottom: '3px dashed #cbd5e1',
            }}></div>

            {/* Traffic Light Column */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '30px',
              backgroundColor: '#1e293b',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid #475569',
            }}>
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: barrierState === 'closed' ? '#ef4444' : '#475569',
                boxShadow: barrierState === 'closed' ? '0 0 10px #ef4444' : 'none',
              }}></span>
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: barrierState === 'authenticating' ? '#f59e0b' : '#475569',
                boxShadow: barrierState === 'authenticating' ? '0 0 10px #f59e0b' : 'none',
              }}></span>
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: barrierState === 'open' ? '#10b981' : '#475569',
                boxShadow: barrierState === 'open' ? '0 0 10px #10b981' : 'none',
              }}></span>
            </div>

            {/* Gate Column Pylon */}
            <div style={{
              width: '44px',
              height: '140px',
              backgroundColor: '#334155',
              borderRadius: '8px 8px 0 0',
              border: '2px solid #1e293b',
              position: 'relative',
              zIndex: 10,
              marginLeft: '60px',
            }}>
              {/* Pivot axis */}
              <div style={{
                position: 'absolute',
                top: '18px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '20px',
                backgroundColor: '#f59e0b',
                borderRadius: '50%',
                border: '3px solid #1e293b',
              }}></div>
            </div>

            {/* Boom Barrier Arm */}
            <div style={{
              position: 'absolute',
              bottom: '135px',
              left: '124px',
              width: '240px',
              height: '12px',
              background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 12px, #ffffff 12px, #ffffff 24px)',
              borderRadius: '6px',
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
              transformOrigin: '0% 50%',
              transform: barrierState === 'open' ? 'rotate(-75deg)' : 'rotate(0deg)',
              transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}></div>
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Barrier Status:{' '}
            <span style={{
              color: barrierState === 'open' ? 'var(--green-primary)' : 'var(--red-primary)',
              fontWeight: '800',
              textTransform: 'uppercase',
            }}>
              {barrierState}
            </span>
          </div>
        </div>

        {/* Right: Simulation Controller Form */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            RFID Sensor Controller
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Trigger touchless gate entry or exit check for your registered vehicle.
          </p>

          {/* Action Selector: Entry vs Exit */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            padding: '4px',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.5rem',
          }}>
            <button
              type="button"
              onClick={() => setActionType('entry')}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: '700',
                backgroundColor: actionType === 'entry' ? 'var(--blue-primary)' : 'transparent',
                color: actionType === 'entry' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              📥 Gate Entrance
            </button>
            <button
              type="button"
              onClick={() => setActionType('exit')}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: '700',
                backgroundColor: actionType === 'exit' ? 'var(--blue-primary)' : 'transparent',
                color: actionType === 'exit' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              📤 Gate Exit
            </button>
          </div>

          {/* RFID Tag */}
          <div className="form-group">
            <label className="form-label">
              <span>RFID Card Identifier</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Radio size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input font-mono"
                style={{ paddingLeft: '2.75rem', textTransform: 'uppercase' }}
                value={rfid}
                onChange={(e) => setRfid(e.target.value.toUpperCase())}
                placeholder="RF-882910"
              />
            </div>
          </div>

          {/* Vehicle License Plate */}
          <div className="form-group">
            <label className="form-label">
              <span>Vehicle License Plate</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Car size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input font-mono"
                style={{ paddingLeft: '2.75rem', textTransform: 'uppercase' }}
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="KITT-2000"
              />
            </div>
          </div>

          {/* Simulate Action Button */}
          <button
            type="button"
            onClick={handleSimulate}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', fontWeight: '700', marginTop: '1rem' }}
          >
            {loading ? (
              <span>Authenticating Sensor...</span>
            ) : (
              <>
                <span>Simulate {actionType === 'entry' ? 'Entrance' : 'Exit'} (Tap RFID)</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Telemetry Event Stream */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              Real-Time Gate Telemetry Feed
            </div>
            <div style={{
              maxHeight: '140px',
              overflowY: 'auto',
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              fontFamily: 'JetBrains Mono',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {logs.map((log, idx) => (
                <div key={idx}>
                  <span style={{ color: '#64748b' }}>[{log.time}]</span> {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
