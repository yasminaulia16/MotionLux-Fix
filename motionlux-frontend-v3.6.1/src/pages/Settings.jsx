import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SectionHeader from '../components/SectionHeader';

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'User';

  useEffect(() => setName(profile?.name || ''), [profile?.name]);

  const save = async () => {
    if (!name.trim()) return setMessage('Nama tidak boleh kosong.');
    try {
      setSaving(true);
      await updateProfile(name.trim());
      setMessage('Profil berhasil disimpan.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Settings" description="Kelola profil akun MotionLux." />
      <section className="card form-card">
        <p className="eyebrow">Profile</p>
        <div className="profile-big">
          <div className="avatar large">{(name || 'U').slice(0, 2).toUpperCase()}</div>
          <div><strong>{name || 'User'}</strong><span>{roleLabel}</span></div>
        </div>

        <label>Nama</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pengguna" />
        <label>Email</label>
        <input value={profile?.email || ''} disabled />
        <label>Role</label>
        <div className="role-box"><ShieldCheck size={18} />{roleLabel}</div>

        <button className="primary-btn" onClick={save} disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save Changes'}</button>
        {message && (() => {
          const success = message.includes('berhasil');
          return (
            <p className={`feedback-line ${success ? 'success-text' : 'error-text'}`}>
              {success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{message}
            </p>
          );
        })()}
      </section>
    </div>
  );
}
