'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import Nav from './Nav';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const PUBLIC = ['/login', '/register'];

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('user'))); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !user && !PUBLIC.includes(path)) router.replace('/login');
  }, [ready, user, path, router]);

  function startSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    router.replace('/');
  }
  async function login(email, password) {
    startSession(await api('/auth/login', { method: 'POST', body: { email, password } }));
  }
  async function registerAdmin(name, email, password) {
    startSession(await api('/auth/register-admin', { method: 'POST', body: { name, email, password } }));
  }
  function logout() {
    localStorage.clear();
    setUser(null);
    router.replace('/login');
  }

  if (!ready) return null;
  if (!user && !PUBLIC.includes(path)) return null;
  return (
    <Ctx.Provider value={{ user, login, registerAdmin, logout }}>
      {user ? (
        <div className="shell"><Nav /><main className="content">{children}</main></div>
      ) : (
        <main className="public">{children}</main>
      )}
    </Ctx.Provider>
  );
}
