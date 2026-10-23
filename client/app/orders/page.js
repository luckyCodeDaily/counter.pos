'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, money } from '../../lib/api';

const STATUSES = ['', 'Pending', 'Preparing', 'Ready', 'Completed'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ ...(search && { search }), ...(status && { status }) });
      api('/orders?' + qs).then((d) => setOrders(d.orders)).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search, status]);

  return (
    <>
      <h1>Orders</h1>
      <div className="row" style={{ marginBottom: '.8rem' }}>
        <input placeholder="Search by order number" aria-label="Search by order number" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card">
        {orders.length === 0 ? <p className="muted">No orders match. Clear the filters or create a new order.</p> : (
          <table>
            <thead><tr><th>Order</th><th>Type</th><th>Status</th><th>Payment</th><th>Time</th><th className="num">Total</th></tr></thead>
            <tbody>{orders.map((o) => (
              <tr key={o._id}>
                <td><Link href={`/orders/${o._id}`}>{o.orderNumber}</Link></td><td>{o.type}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td><span className={`badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                <td>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="num">{money(o.total)}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
