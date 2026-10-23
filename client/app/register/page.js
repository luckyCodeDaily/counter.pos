'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';

export default function Register() {
  const { registerAdmin } = useAuth();
  const [open, setOpen] = useState(null); // null = checking
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/auth/setup-status').then((d) => setOpen(d.needsSetup)).catch((e) => { setError(e.message); setOpen(false); }); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await registerAdmin(form.name, form.email, form.password); } catch (err) { setError(err.message); setBusy(false); }
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (open === null) return <p>Checking setup…</p>;
  if (!open) return (
    <div className="card login">
      <h1>Registration is closed</h1>
      <p className="muted">The admin account already exists. Ask the admin to create your staff account.</p>
      {error && <div className="error">{error}</div>}
      <Link className="btn" href="/login">Go to sign in</Link>
    </div>
  );
  return (
    <div className="card login">
      <h1>Create admin account</h1>
      <p className="muted">This first account becomes the admin. It can add staff later.</p>
      <form onSubmit={submit}>
        <label htmlFor="n">Full name</label>
        <input id="n" required value={form.name} onChange={set('name')} style={{ width: '100%' }} />
        <label htmlFor="e">Email</label>
        <input id="e" type="email" required value={form.email} onChange={set('email')} style={{ width: '100%' }} />
        <label htmlFor="p">Password (6+ characters)</label>
        <input id="p" type="password" minLength={6} required value={form.password} onChange={set('password')} style={{ width: '100%' }} />
        {error && <div className="error" role="alert">{error}</div>}
        <p><button disabled={busy}>{busy ? 'Creating…' : 'Create admin account'}</button></p>
      </form>
    </div>
  );
}
