const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      localStorage.clear();
      window.location.href = '/login';
    }
    throw new Error(data.error?.message || 'Request failed');
  }
  return data;
}

export const money = (n) => '₹' + Number(n || 0).toFixed(2);
export const NEXT_STATUS = { Pending: 'Preparing', Preparing: 'Ready', Ready: 'Completed' };
