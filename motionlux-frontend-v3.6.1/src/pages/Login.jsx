import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LampVisual from '../components/LampVisual';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@motionlux.com');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="brand login-brand">
          <div className="brand-mark"><Zap size={20} fill="currentColor" /></div>
          <strong>MotionLux</strong>
        </div>
        <div className="hero-light"><LampVisual isOn /></div>
        <span className="badge">Smart IoT Lighting</span>
        <h1>Light smarter.<br /><span>Live better.</span></h1>
        <p>Control lampu, jadwal, sunrise/sunset, dan sensor gerak dari satu dashboard.</p>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to MotionLux</h2>
          <p className="muted">Gunakan akun yang dibuat di Supabase Authentication.</p>

          <label>Email</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <label>Password</label>
          <div className="input-wrap">
            <LockKeyhole size={18} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? 'text' : 'password'} required />
            <button type="button" className="input-action" onClick={() => setShow(!show)} aria-label="Tampilkan password">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn full" disabled={busy}>{busy ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </section>
    </div>
  );
}
