import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'user' };

export default function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    api('/users').then(setUsers).catch((e) => setError(e.message));
  }, [isAdmin]);

  if (!isAdmin) return <div className="card">Access denied.</div>;

  const openAdd = () => { setEdit(null); setForm(emptyForm); setError(''); setOpen(true); };
  const openEdit = (u) => { setEdit(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setError(''); setOpen(true); };
  const close = () => { setOpen(false); setEdit(null); setForm(emptyForm); };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (edit) {
        const d = await api(`/users/${edit.id}`, { method: 'PUT', body: JSON.stringify({ name: form.name, role: form.role }) });
        setUsers((x) => x.map((u) => (u.id === d.id ? d : u)));
      } else {
        const d = await api('/users', { method: 'POST', body: JSON.stringify(form) });
        setUsers((x) => [d, ...x]);
      }
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      setUsers((x) => x.filter((u) => u.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <SectionHeader
        title="User Management"
        description="Admin dapat menambah, mengubah role, dan menghapus user."
        action={<button className="primary-btn" onClick={openAdd}><Plus size={18} /> Add User</button>}
      />
      {error && !open && <div className="error-box">{error}</div>}

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nama</th><th>Email</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-btn" onClick={() => openEdit(u)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn danger" onClick={() => del(u.id)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Admin</p>
                <h3>{edit ? 'Edit User' : 'Add User'}</h3>
              </div>
              <button type="button" className="icon-btn" onClick={close}><X size={18} /></button>
            </div>

            <label>Nama</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>Email</label>
            <input required disabled={!!edit} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {!edit && (
              <>
                <label>Password</label>
                <input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </>
            )}
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            {error && <div className="error-box">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={close}>Cancel</button>
              <button className="primary-btn" disabled={saving}>{saving ? 'Saving...' : edit ? 'Save Changes' : 'Create User'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
