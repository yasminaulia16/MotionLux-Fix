import { Activity, CalendarClock, Lightbulb, Map, Power, ShieldCheck, SunMedium } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import LampVisual from '../components/LampVisual';
import LockNotice from '../components/LockNotice';
import { useApp } from '../context/AppContext';

const modeLabel = { manual: 'Manual', schedule: 'Schedule', sunrise_sunset: 'Sunrise / Sunset', motion: 'Motion Sensor' };
const fmtCoord = (v) => (Number.isFinite(Number(v)) ? Number(v).toFixed(4) : '-');

export default function Dashboard() {
  const { lamps, schedules, sun, motion, loading, toggleLamp } = useApp();
  const lamp = lamps[0];

  if (loading && !lamp) return <div className="loading-screen">Loading MotionLux...</div>;
  if (!lamp) {
    return (
      <div className="empty-state">
        <Lightbulb size={34} />
        <strong>Belum ada lampu</strong>
        <span>Tambahkan device lamp di database terlebih dahulu.</span>
      </div>
    );
  }

  const activeSchedules = schedules.filter((s) => s.is_active).length;
  const calculated = sun?.calculated || {};
  const desired = lamp.automation?.desired_is_on;

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        description="Kontrol dan pantau sistem pencahayaan MotionLux."
        action={<div className="online-chip"><span className="status-dot" /> API connected</div>}
      />

      {lamp.is_locked && <LockNotice />}

      <div className="stats-grid">
        <div className="stat">
          <Lightbulb />
          <span>Lampu utama</span>
          <strong>{lamp.is_on ? 'ON' : 'OFF'}</strong>
          <small>{lamp.is_locked ? 'Shutdown oleh admin' : lamp.online ? 'ESP32 online' : 'ESP32 offline'}</small>
        </div>
        <div className="stat">
          <CalendarClock />
          <span>Schedule aktif</span>
          <strong>{activeSchedules}</strong>
          <small>Aturan tersimpan</small>
        </div>
        <div className="stat">
          <Map />
          <span>Lokasi</span>
          <strong className="stat-long">{sun?.location_name || '-'}</strong>
          <small>{fmtCoord(sun?.latitude)}, {fmtCoord(sun?.longitude)}</small>
        </div>
        <div className="stat">
          <Activity />
          <span>PIR Sensor</span>
          <strong>ACTIVE</strong>
          <small>{motion?.lamps?.name || 'Motion input'}</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card hero-card">
          <div className="hero-info">
            <p className="eyebrow">Primary lamp</p>
            <h3>{lamp.name}</h3>
            <p className="muted">{lamp.room} · {lamp.online ? 'online' : 'offline'}</p>
            <div className="mode-chip"><span /> Mode {modeLabel[lamp.mode] || lamp.mode}</div>
          </div>
          <LampVisual isOn={lamp.is_on} />
          <div className="lamp-state">
            <strong>{lamp.is_on ? 'LIGHT ON' : 'LIGHT OFF'}</strong>
            <span className="desired-state">Automation target: {desired ? 'ON' : 'OFF'}</span>
            <button className={`power-btn ${lamp.is_on ? 'on' : ''}`} onClick={() => toggleLamp(lamp.id, !lamp.is_on)} disabled={lamp.is_locked}>
              <Power size={18} />{lamp.is_locked ? 'Locked' : lamp.is_on ? 'Turn Off' : 'Turn On'}
            </button>
            <Link className="secondary-btn" to={`/lamps/${lamp.id}`}>Open Control</Link>
          </div>
        </section>

        <section className="card quick-card">
          <p className="eyebrow">System overview</p>
          <h3>Automation status</h3>
          <div className="quick-row">
            <ShieldCheck />
            <div><strong>Backend ready</strong><span>API + Supabase connected</span></div>
          </div>
          <div className="quick-row">
            <CalendarClock />
            <div><strong>{schedules.length} schedules</strong><span>Duplicate time validation enabled</span></div>
          </div>
          <div className="quick-row">
            <SunMedium />
            <div><strong>{calculated.sunrise || '--:--'} / {calculated.sunset || '--:--'}</strong><span>Sunrise / Sunset hari ini</span></div>
          </div>
          <div className="quick-row">
            <Activity />
            <div><strong>PIR enabled</strong><span>HC-SR501 integration</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
