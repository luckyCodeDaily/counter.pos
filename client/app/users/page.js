'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';

const blank = { name: '', email: '', password: '', role: 'staff' };

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = () => api('/auth/users').then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  useEffect(() => { if (user.role === 'admin') load(); }, []); // eslint-disable-line

  if (user.role !== 'admin') return <div className="error">Only the admin can manage users.</div>;

  async function add(e) {
    e.preventDefault(); setError(''); setOk('');
    try {
      await api('/auth/register', { method: 'POST', body: form });
      setOk(`Created ${form.role} account for ${form.email}`);
      setForm(blank); load();
    } catch (err) { setError(err.message); }
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h1>Users</h1>
      <form className="card row" onSubmit={add} style={{ marginBottom: '1rem' }}>
        <input placeholder="Full name" aria-label="Full name" required value={form.name} onChange={set('name')} />
        <input placeholder="Email" aria-label="Email" type="email" required value={form.email} onChange={set('email')} />
        <input placeholder="Password (6+)" aria-label="Password" type="password" minLength={6} required value={form.password} onChange={set('password')} />
        <select aria-label="Role" value={form.role} onChange={set('role')}><option value="staff">Staff</option><option value="admin">Admin</option></select>
        <button>Add user</button>
      </form>
      {error && <div className="error" role="alert">{error}</div>}
      {ok && <p style={{ color: 'var(--ok)' }}>{ok}</p>}
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
