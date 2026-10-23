'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, money } from '../lib/api';
import { useAuth } from '../components/AuthProvider';

const FLOW = ['Pending', 'Preparing', 'Ready', 'Completed'];

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/reports/daily-sales').then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <div className="error">{error}</div>;
  if (!d) return <p className="muted">Loading today’s numbers…</p>;

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const paidCount = d.byPaymentMethod.reduce((s, m) => s + m.count, 0);
  const pretty = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div className="page-head">
        <div><h1>{greet}, {user.name.split(' ')[0]}</h1><p className="muted" style={{ margin: '.2rem 0 0' }}>{pretty}</p></div>
        <Link className="btn amber" href="/orders/new">+ New order</Link>
      </div>

      <div className="hero">
        <section className="sales">
          <span>Sales collected today</span>
          <b>{money(d.dailySales)}</b>
          {d.byPaymentMethod.length === 0
            ? <span className="chip">No payments recorded yet</span>
            : d.byPaymentMethod.map((m) => <span className="chip" key={m.method}>{m.method} {money(m.amount)}</span>)}
        </section>
        <section className="card">
          <h2>Order flow</h2>
          <div className="steps">
            {FLOW.map((s) => <div key={s} className={`step ${s}`}><b>{d.byStatus[s] || 0}</b><span>{s}</span></div>)}
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {d.totalOrders} orders today · {d.completedOrders} completed
            {paidCount > 0 && ` · average bill ${money(d.dailySales / paidCount)}`}
          </p>
        </section>
      </div>

      <div className="card">
        <div className="row between"><h2>Recent orders</h2><Link href="/orders">View all</Link></div>
        {d.recentOrders.length === 0 ? <p className="muted">No orders yet today. Start one to see it here.</p> : (
          <table>
            <thead><tr><th>Order</th><th>Type</th><th>Status</th><th>Payment</th><th className="num">Total</th></tr></thead>
            <tbody>{d.recentOrders.map((o) => (
              <tr key={o._id}>
                <td><Link href={`/orders/${o._id}`}>{o.orderNumber}</Link></td><td>{o.type}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td><span className={`badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                <td className="num">{money(o.total)}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
