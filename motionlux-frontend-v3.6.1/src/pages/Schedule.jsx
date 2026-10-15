import { useMemo, useState } from 'react';
import { CalendarClock, Edit3, Plus, Trash2, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import LockNotice from '../components/LockNotice';
import { useApp } from '../context/AppContext';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const emptyForm = { name: '', lamp_id: '', on_time: '18:00', off_time: '22:00', repeat_days: [...days], is_active: true };
const hhmm = (t) => String(t).slice(0, 5);

export default function Schedule() {
  const { schedules, lamps, addSchedule, updateSchedule, deleteSchedule, notify } = useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const sorted = useMemo(() => [...schedules].sort((a, b) => String(a.on_time).localeCompare(String(b.on_time))), [schedules]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isLocked = (lampId) => Boolean(lamps.find((l) => String(l.id) === String(lampId))?.is_locked);
  const anyLocked = lamps.some((l) => l.is_locked);

  const openAdd = () => {
    setEdit(null);
    setForm({ ...emptyForm, lamp_id: lamps[0]?.id || '' });
    setOpen(true);
  };
  const openEdit = (s) => {
    setEdit(s);
    setForm({
      name: s.name,
      lamp_id: s.lamp_id,
      on_time: hhmm(s.on_time),
      off_time: hhmm(s.off_time),
      repeat_days: s.repeat_days?.length ? s.repeat_days : [...days],
      is_active: s.is_active
    });
    setOpen(true);
  };
  const close = () => {
    if (saving) return;
    setOpen(false);
    setEdit(null);
  };

  const toggleActive = async (s) => {
    if (togglingId || isLocked(s.lamp_id)) return;
    setTogglingId(s.id);
    await updateSchedule(s.id, { is_active: !s.is_active });
    setTogglingId(null);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.repeat_days.length) return notify('Pilih minimal satu hari.', 'error');
    if (form.on_time === form.off_time) return notify('Waktu nyala dan mati tidak boleh sama.', 'error');
    setSaving(true);
    const payload = { ...form, lamp_id: Number(form.lamp_id) };
    const ok = edit ? await updateSchedule(edit.id, payload) : (await addSchedule(payload)).ok;
    setSaving(false);
    if (ok) close();
  };

  return (
    <div>
      <SectionHeader
        title="Lighting Schedule"
        description="Atur waktu ON dan OFF lampu. Jadwal aktif dievaluasi otomatis setiap beberapa detik."
        action={<button className="primary-btn" onClick={openAdd}><Plus size={18} /> Add Schedule</button>}
      />

      {anyLocked && <LockNotice />}

      <section className="card schedule-card">
        <div className="table-title">
          <div className="title-icon"><CalendarClock size={19} /></div>
          <div><strong>{schedules.length} schedule</strong><span>Semua jadwal tersimpan di Supabase.</span></div>
        </div>

        {sorted.length === 0 ? (
          <div className="empty-state">
            <CalendarClock size={32} />
            <strong>Belum ada jadwal</strong>
            <span>Tambahkan jadwal pertama untuk mengotomatisasi lampu.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Schedule</th><th>Lampu</th><th>ON</th><th>OFF</th><th>Hari</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.lamps?.name || lamps.find((l) => l.id === s.lamp_id)?.name || '-'}</td>
                    <td><span className="time-pill">{hhmm(s.on_time)}</span></td>
                    <td><span className="time-pill off">{hhmm(s.off_time)}</span></td>
                    <td><span className="days-text">{(s.repeat_days || []).join(' · ')}</span></td>
                    <td>
                      <div className="status-cell">
                        <button
                          type="button"
                          className={`switch ${s.is_active ? 'checked' : ''}`}
                          onClick={() => toggleActive(s)}
                          disabled={togglingId === s.id || isLocked(s.lamp_id)}
                          aria-label={s.is_active ? 'Nonaktifkan jadwal' : 'Aktifkan jadwal'}
                          title={isLocked(s.lamp_id) ? 'Lampu di-shutdown oleh admin' : s.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                        ><span /></button>
                        <span className={`status-tag ${s.is_active ? 'active' : 'paused'}`}>{s.is_active ? 'Aktif' : 'Non-aktif'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={() => openEdit(s)} title="Edit"><Edit3 size={16} /></button>
                        <button className="icon-btn danger" onClick={() => deleteSchedule(s.id)} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {open && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Schedule</p>
                <h3>{edit ? 'Edit Schedule' : 'Add Schedule'}</h3>
                <span className="modal-sub">Gunakan waktu berbeda untuk ON dan OFF.</span>
              </div>
              <button type="button" className="icon-btn" onClick={close}><X size={18} /></button>
            </div>

            <label>Nama Schedule</label>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Night Lighting" required />

            <label>Lampu</label>
            <select value={form.lamp_id} onChange={(e) => set({ lamp_id: Number(e.target.value) })} required>
              {lamps.map((l) => <option value={l.id} key={l.id}>{l.name} · {l.room}</option>)}
            </select>

            <div className="two-col">
              <div>
                <label>Waktu ON</label>
                <input type="time" value={form.on_time} onChange={(e) => set({ on_time: e.target.value })} required />
              </div>
              <div>
                <label>Waktu OFF</label>
                <input type="time" value={form.off_time} onChange={(e) => set({ off_time: e.target.value })} required />
              </div>
            </div>

            <label>Hari aktif</label>
            <div className="day-grid">
              {days.map((d) => (
                <label className={`day ${form.repeat_days.includes(d) ? 'selected' : ''}`} key={d}>
                  <input
                    type="checkbox"
                    checked={form.repeat_days.includes(d)}
                    onChange={(e) => set({ repeat_days: e.target.checked ? [...form.repeat_days, d] : form.repeat_days.filter((x) => x !== d) })}
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>

            <label className="checkbox-line">
              <input type="checkbox" checked={form.is_active} disabled={Boolean(edit) && isLocked(form.lamp_id)} onChange={(e) => set({ is_active: e.target.checked })} />
              <span>Aktifkan jadwal setelah disimpan</span>
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={close}>Cancel</button>
              <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : edit ? 'Save Changes' : 'Create Schedule'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
