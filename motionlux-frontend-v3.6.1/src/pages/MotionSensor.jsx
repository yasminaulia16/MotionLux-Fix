import { useEffect, useState } from 'react';
import { Activity, Radio, Save, Timer, Zap } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import LockNotice from '../components/LockNotice';
import { useApp } from '../context/AppContext';

const MIN_SECONDS = 10;
const MAX_SECONDS = 3600;

// 120 detik -> { amount: 2, unit: 'minute' }, 45 detik -> { amount: 45, unit: 'second' }
const splitDuration = (seconds) => {
  const s = Number(seconds) > 0 ? Number(seconds) : 60;
  return s % 60 === 0 ? { amount: String(s / 60), unit: 'minute' } : { amount: String(s), unit: 'second' };
};
const formatDuration = (seconds) => {
  const { amount, unit } = splitDuration(seconds);
  return `${amount} ${unit === 'minute' ? 'menit' : 'detik'}`;
};

export default function MotionSensor() {
  const { motion, lamps, motionEvents, updateMotion, testMotion } = useApp();
  const [lampId, setLampId] = useState('');
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('minute');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Sinkron hanya saat nilai dari server benar-benar berubah, bukan tiap polling 5 detik,
  // supaya perubahan yang belum disimpan tidak ter-reset.
  const loaded = Boolean(motion);
  const serverLampId = motion?.lamp_id;
  const serverDuration = motion?.duration_seconds;
  const firstLampId = lamps[0]?.id;
  useEffect(() => {
    if (!loaded) return;
    setLampId(String(serverLampId || firstLampId || ''));
    const d = splitDuration(serverDuration);
    setAmount(d.amount);
    setUnit(d.unit);
  }, [loaded, serverLampId, serverDuration, firstLampId]);

  if (!motion) return <div className="loading-screen">Loading sensor...</div>;

  const target = lamps.find((lamp) => lamp.id === Number(lampId));
  const locked = Boolean(target?.is_locked);
  const latest = motionEvents?.[0];

  const seconds = Math.round(Number(String(amount).replace(',', '.')) * (unit === 'minute' ? 60 : 1));
  const durationOk = Number.isFinite(seconds) && seconds >= MIN_SECONDS && seconds <= MAX_SECONDS;

  const save = async () => {
    if (!durationOk) {
      setFormError('Durasi harus antara 10 detik sampai 60 menit.');
      return;
    }
    setFormError('');
    setSaving(true);
    await updateMotion({ enabled: true, lamp_id: Number(lampId), duration_seconds: seconds });
    setSaving(false);
  };

  return (
    <div>
      <SectionHeader
        title="Motion Sensor"
        description="PIR HC-SR501 mendeteksi gerakan dan mengontrol lampu sesuai mode Motion Sensor."
        action={<span className="online-chip"><span className="status-dot" />PIR enabled</span>}
      />
      {locked && <LockNotice />}

      <div className="sensor-grid">
        <section className="card sensor-main">
          <div className="sensor-radar active"><Radio size={30} /><span /></div>
          <p className="eyebrow">PIR HC-SR501</p>
          <h3>Sensor aktif</h3>
          <p className="muted">Target lampu: {target?.name || '-'} · mode fisik mengikuti pengaturan lampu.</p>
          <div className="sensor-actions">
            <button className="secondary-btn" onClick={testMotion} disabled={locked}><Activity size={17} /> Test Motion</button>
            <div className="mini-info">
              <Zap size={16} />
              <span>
                {latest
                  ? `Last detection: ${new Date(latest.detected_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Belum ada deteksi'}
              </span>
            </div>
            <div className="mini-info">
              <Timer size={16} />
              <span>Lampu menyala {formatDuration(serverDuration)} setelah gerakan</span>
            </div>
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Settings</p>
          <h3>Sensor behavior</h3>
          <label>Lampu yang dikontrol</label>
          <select value={lampId} onChange={(e) => setLampId(e.target.value)}>
            {lamps.map((lamp) => <option value={lamp.id} key={lamp.id}>{lamp.name} · {lamp.room}</option>)}
          </select>

          <label>Durasi lampu menyala setelah ada gerakan</label>
          <div className="duration-row">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.,]/g, '')); setFormError(''); }}
              placeholder="1"
            />
            <select value={unit} onChange={(e) => { setUnit(e.target.value); setFormError(''); }}>
              <option value="second">Detik</option>
              <option value="minute">Menit</option>
            </select>
          </div>
          <p className={`helper-text ${formError || !durationOk ? 'field-error' : ''}`}>
            {formError || (durationOk
              ? `Lampu mati otomatis ${formatDuration(seconds)} setelah gerakan terakhir terdeteksi. (min. 10 detik, maks. 60 menit)`
              : 'Durasi harus antara 10 detik sampai 60 menit.')}
          </p>

          <button className="primary-btn" onClick={save} disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save Settings'}</button>
          <p className="muted helper-text">Untuk kontrol otomatis PIR, pilih mode <strong>Motion Sensor</strong> di Lamp Control.</p>
        </section>
      </div>
    </div>
  );
}
