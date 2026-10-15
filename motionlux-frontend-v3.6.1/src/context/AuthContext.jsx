import { createContext, useCallback, useEffect, useState, useContext } from 'react';
import { api } from '../services/api';

const C = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => localStorage.getItem('motionlux_token'));
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!session) { setLoading(false); return; }
      try {
        const d = await api('/auth/me');
        setProfile(d.profile);
      } catch {
        localStorage.removeItem('motionlux_token');
        setSession(null);
        setProfile(null);
      } finally { setLoading(false); }
    })();
  }, [session]);

  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('motionlux_token', d.session.access_token);
    setProfile(d.profile);
    setSession(d.session.access_token);
    return d.profile;
  }, []);

  const updateProfile = useCallback(async (name) => {
    const d = await api('/settings/profile', { method: 'PUT', body: JSON.stringify({ name }) });
    setProfile(d);
    return d;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('motionlux_token');
    setSession(null);
    setProfile(null);
  }, []);

  // Otomatis logout kalau backend menolak token (kadaluarsa)
  useEffect(() => {
    window.addEventListener('motionlux:unauthorized', logout);
    return () => window.removeEventListener('motionlux:unauthorized', logout);
  }, [logout]);

  return <C.Provider value={{ session, profile, loading, login, logout, updateProfile }}>{children}</C.Provider>;
}
export const useAuth = () => useContext(C);
