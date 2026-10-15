import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

const C = createContext(null);

export function AppProvider({ children }) {
  const [lamps, setLamps] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sun, setSun] = useState(null);
  const [motion, setMotion] = useState(null);
  const [motionEvents, setMotionEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const refresh = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const d = await api('/dashboard');
      setLamps(d.lamps || []);
      setSchedules(d.schedules || []);
      setSun(d.sun || null);
      setMotion(d.motion || null);
      setMotionEvents(d.motion_events || []);
    } catch (e) {
      if (!silent) notify(e.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(true), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const toggleLamp = useCallback(async (id, isOn) => {
    try {
      const d = await api(`/lamps/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_on: isOn }) });
      setLamps((items) => items.map((lamp) => lamp.id === id ? { ...lamp, ...d } : lamp));
      notify(`Lampu ${isOn ? 'dinyalakan' : 'dimatikan'}.`, 'success');
      refresh(true);
    } catch (e) { notify(e.message, 'error'); }
  }, [notify, refresh]);

  const setLampMode = useCallback(async (id, mode) => {
    try {
      const d = await api(`/lamps/${id}/mode`, { method: 'PATCH', body: JSON.stringify({ mode }) });
      setLamps((items) => items.map((lamp) => lamp.id === id ? { ...lamp, ...d } : lamp));
      notify('Mode berhasil diperbarui dan automation langsung dievaluasi.', 'success');
      refresh(true);
    } catch (e) { notify(e.message, 'error'); }
  }, [notify, refresh]);

  const setLampShutdown = useCallback(async (id, locked) => {
    try {
      const d = await api(`/lamps/${id}/shutdown`, { method: 'PATCH', body: JSON.stringify({ locked }) });
      setLamps((items) => items.map((lamp) => lamp.id === id ? { ...lamp, ...d } : lamp));
      notify(locked ? 'Lampu di-shutdown. User tidak bisa menyalakan lampu.' : 'Shutdown dicabut. User bisa menyalakan lampu lagi.', 'success');
      refresh(true);
      return true;
    } catch (e) { notify(e.message, 'error'); return false; }
  }, [notify, refresh]);

  const addSchedule = useCallback(async (payload) => {
    try {
      const d = await api('/schedules', { method: 'POST', body: JSON.stringify(payload) });
      setSchedules((items) => [...items, d].sort((a, b) => String(a.on_time).localeCompare(String(b.on_time))));
      notify('Jadwal berhasil ditambahkan.', 'success');
      return { ok: true, data: d };
    } catch (e) {
      notify(e.message, 'error');
      return { ok: false, message: e.message };
    }
  }, [notify]);

  const updateSchedule = useCallback(async (id, payload) => {
    try {
      const d = await api(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setSchedules((items) => items.map((s) => s.id === id ? d : s));
      const onlyStatus = Object.keys(payload).length === 1 && 'is_active' in payload;
      notify(onlyStatus ? (d.is_active ? 'Jadwal diaktifkan.' : 'Jadwal dinonaktifkan.') : 'Jadwal diperbarui.', 'success');
      return true;
    } catch (e) { notify(e.message, 'error'); return false; }
  }, [notify]);

  const deleteSchedule = useCallback(async (id) => {
    try {
      await api(`/schedules/${id}`, { method: 'DELETE' });
      setSchedules((items) => items.filter((s) => s.id !== id));
      notify('Jadwal dihapus.', 'success');
      return true;
    } catch (e) { notify(e.message, 'error'); return false; }
  }, [notify]);

  const updateSun = useCallback(async (payload) => {
    try {
      const d = await api('/sun', { method: 'PUT', body: JSON.stringify(payload) });
      setSun(d);
      notify('Pengaturan lokasi dan sunrise/sunset diperbarui.', 'success');
      return true;
    } catch (e) { notify(e.message, 'error'); return false; }
  }, [notify]);

  const updateMotion = useCallback(async (payload) => {
    try {
      const d = await api('/motion', { method: 'PUT', body: JSON.stringify(payload) });
      setMotion(d);
      notify('Pengaturan sensor diperbarui.', 'success');
      return true;
    } catch (e) { notify(e.message, 'error'); return false; }
  }, [notify]);

  const testMotion = useCallback(async () => {
    try {
      const d = await api('/motion/test', { method: 'POST' });
      setLamps((items) => items.map((lamp) => lamp.id === d.lamp.id ? { ...lamp, ...d.lamp } : lamp));
      setMotionEvents((events) => [d.event, ...events]);
      notify('Gerakan terdeteksi. Lampu dinyalakan.', 'success');
      return true;
    } catch (e) { notify(e.message, 'error'); return false; }
  }, [notify]);

  const value = useMemo(() => ({
    lamps, schedules, sun, motion, motionEvents, loading, refresh,
    toggleLamp, setLampMode, setLampShutdown, addSchedule, updateSchedule, deleteSchedule,
    updateSun, updateMotion, testMotion, notify
  }), [lamps, schedules, sun, motion, motionEvents, loading, refresh, toggleLamp, setLampMode, setLampShutdown, addSchedule, updateSchedule, deleteSchedule, updateSun, updateMotion, testMotion, notify]);

  return <C.Provider value={value}>{children}{toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}</C.Provider>;
}

export const useApp = () => useContext(C);
