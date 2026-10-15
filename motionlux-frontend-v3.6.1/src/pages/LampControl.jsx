import { Activity, Clock3, Power, SunMedium } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LampVisual from '../components/LampVisual';
import LockNotice from '../components/LockNotice';

const modes = [
  ['manual', 'Manual', Power, 'Kontrol ON/OFF langsung'],
  ['schedule', 'Schedule', Clock3, 'Ikuti jadwal aktif'],
  ['sunrise_sunset', 'Sunrise / Sunset', SunMedium, 'Ikuti waktu matahari'],
  ['motion', 'Motion Sensor', Activity, 'Ikuti event PIR']
];

export default function LampControl() {
  const { lampId } = useParams();
  const { lamps, toggleLamp, setLampMode } = useApp();
  const lamp = lamps.find((x) => String(x.id) === String(lampId)) || lamps[0];

  if (!lamp) return <div className="loading-screen">Loading lamp...</div>;
  const online = Boolean(lamp.online);

  return (
    <div>
      <Link className="back-link" to="/">← Dashboard</Link>
      {lamp.is_locked && <LockNotice />}
      <div className="control-grid">
        <section className="card center-card">
          <div className={`live-badge ${online ? 'online' : ''}`}><span /> {online ? 'ESP32 ONLINE' : 'ESP32 OFFLINE'}</div>
          <LampVisual isOn={lamp.is_on} />
          <h2>{lamp.is_on ? 'LIGHT ON' : 'LIGHT OFF'}</h2>
          <p className="muted">{lamp.name} · {lamp.room}</p>
          <div className="mode-chip"><span /> {modes.find((m) => m[0] === lamp.mode)?.[1] || lamp.mode}</div>
        </section>

        <section className="card controls-card">
          <div className="control-row">
            <div>
              <span className="control-label">Manual power</span>
              <strong>{lamp.is_on ? 'Lampu sedang menyala' : 'Lampu sedang mati'}</strong>
            </div>
            <button
              type="button"
              className={`switch ${lamp.is_on ? 'checked' : ''}`}
              onClick={() => toggleLamp(lamp.id, !lamp.is_on)}
              disabled={lamp.is_locked}
              aria-label="Toggle lamp"
            ><span /></button>
          </div>
          <p className="helper-text">Menekan ON/OFF akan mengembalikan mode ke <strong>Manual</strong>.</p>

          <div className="divider" />
          <p className="eyebrow">Control mode</p>
          <div className="mode-grid">
            {modes.map(([id, label, Icon, desc]) => (
              <button
                key={id}
                className={`mode-option ${lamp.mode === id ? 'selected' : ''}`}
                onClick={() => setLampMode(lamp.id, id)}
                disabled={lamp.is_locked}
              >
                <Icon size={20} />
                <div><strong>{label}</strong><span>{desc}</span></div>
                <span className="mode-check">{lamp.mode === id ? 'Active' : ''}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
