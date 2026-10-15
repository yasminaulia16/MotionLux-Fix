import { Lock, LockOpen, Power } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import LampVisual from '../components/LampVisual';
import { useApp } from '../context/AppContext';

export default function Shutdown() {
  const { lamps, loading, setLampShutdown } = useApp();

  if (loading && !lamps.length) return <div className="loading-screen">Loading lamp...</div>;
  if (!lamps.length) {
    return (
      <div className="empty-state">
        <Power size={34} />
        <strong>Belum ada lampu</strong>
        <span>Tambahkan device lamp di database terlebih dahulu.</span>
      </div>
    );
  }

  const toggle = (lamp) => {
    if (!lamp.is_locked && !window.confirm(`Shutdown "${lamp.name}"?\n\nLampu akan dimatikan dan user tidak bisa menyalakannya sampai kamu mengaktifkannya kembali.`)) return;
    setLampShutdown(lamp.id, !lamp.is_locked);
  };

  return (
    <div>
      <SectionHeader
        title="Shutdown Lamp"
        description="Matikan lampu dari admin. Selama di-shutdown, user tidak bisa menyalakan lampu."
      />

      <div className="shutdown-grid">
        {lamps.map((lamp) => (
          <section key={lamp.id} className={`card shutdown-card ${lamp.is_locked ? 'locked' : ''}`}>
            <div className={`shutdown-badge ${lamp.is_locked ? 'locked' : ''}`}>
              {lamp.is_locked ? <Lock size={15} /> : <Power size={15} />}
              {lamp.is_locked ? 'SHUTDOWN' : 'NORMAL'}
            </div>
            <LampVisual isOn={lamp.is_on} />
            <h3>{lamp.name}</h3>
            <p className="muted">{lamp.room} · {lamp.is_on ? 'Menyala' : 'Mati'}</p>

            <p className="helper-text shutdown-note">
              {lamp.is_locked
                ? 'Lampu dikunci. User tidak dapat menyalakan lampu, mengganti mode, atau memakai sensor gerak.'
                : 'Lampu bisa dikontrol user seperti biasa. Shutdown akan mematikan lampu dan mengunci kontrolnya.'}
            </p>

            <button className={lamp.is_locked ? 'primary-btn' : 'danger-btn'} onClick={() => toggle(lamp)}>
              {lamp.is_locked ? <><LockOpen size={18} /> Aktifkan Kembali</> : <><Power size={18} /> Shutdown Lamp</>}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
