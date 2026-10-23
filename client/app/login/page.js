'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => { api('/auth/setup-status').then((d) => setNeedsSetup(d.needsSetup)).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); } catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <div className="card login">
      <h1>Counter POS</h1>
      {needsSetup && (
        <div className="error" role="status">No accounts exist yet. <Link href="/register">Create the admin account</Link> to get started.</div>
      )}
      <p className="muted">Sign in with your account.</p>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%' }} />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} />
        {error && <div className="error" role="alert">{error}</div>}
        <p><button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></p>
      </form>
      {needsSetup && <p className="muted"><Link href="/register">First time here? Register</Link></p>}
    </div>
  );
}
