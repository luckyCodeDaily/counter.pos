'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, money, NEXT_STATUS } from '../../../lib/api';

const FLOW = ['Pending', 'Preparing', 'Ready', 'Completed'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api(`/orders/${id}`).then((d) => setOrder(d.order)).catch((e) => setError(e.message)); }, [id]);

  async function act(path, opts) {
    setError('');
    try { const d = await api(`/orders/${id}${path}`, opts); setOrder((o) => ({ ...o, ...d.order })); }
    catch (e) { setError(e.message); }
  }

  if (!order) return error ? <div className="error">{error}</div> : <p className="muted">Loading…</p>;
  const next = NEXT_STATUS[order.status];
  const at = FLOW.indexOf(order.status);

  return (
    <>
      <div className="page-head"><h1>{order.orderNumber}</h1>
        <span><span className={`badge ${order.status}`}>{order.status}</span> <span className={`badge ${order.paymentStatus}`}>{order.paymentStatus}</span></span>
      </div>
      <div className="track">{FLOW.map((s, i) => <div key={s} className={i < at ? 'done' : i === at ? 'done now' : ''}>{s}</div>)}</div>

      <div className="detail">
        <div className="receipt">
          {order.paymentStatus === 'Paid' && <div className="stamp">PAID</div>}
          <div className="r-head"><b>Counter</b><span className="muted">{order.orderNumber}</span></div>
          <div className="r-line"><span>{order.type}{order.tableNumber && ` · Table ${order.tableNumber}`}</span><span>{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
          {order.customerName && <div className="r-line"><span>Customer</span><span>{order.customerName}</span></div>}
          <div className="r-sep" />
          {order.items.map((i) => (
            <div className="r-item" key={i.menuItem} style={{ gridTemplateColumns: '1fr auto 72px' }}>
              <div>{i.name}<small>{money(i.price)} each</small></div><span>× {i.quantity}</span><div className="r-amt">{money(i.price * i.quantity)}</div>
            </div>
          ))}
          <div className="r-sep" />
          <div className="totals">
            <div><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            {order.discountAmount > 0 && <div><span>Discount</span><span>− {money(order.discountAmount)}</span></div>}
            <div><span>Tax ({order.taxRate}%)</span><span>{money(order.taxAmount)}</span></div>
            <div className="grand"><span>Total</span><span>{money(order.total)}</span></div>
          </div>
          {order.paymentStatus === 'Paid' && <p className="muted" style={{ marginBottom: 0 }}>Paid by {order.payment.method}{order.payment.reference && ` (${order.payment.reference})`}</p>}
          <p className="muted" style={{ textAlign: 'center', marginBottom: 0 }}>Thank you, see you again!</p>
        </div>

        <div className="no-print">
          {error && <div className="error" role="alert">{error}</div>}
          {order.paymentStatus === 'Unpaid' && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2>Take payment</h2>
              <div className="row">
                <select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}><option>Cash</option><option>UPI</option><option>Card</option></select>
                <input placeholder="Reference (optional)" aria-label="Payment reference" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <p><button className="amber" onClick={() => act('/payment', { method: 'POST', body: { method, reference } })}>Record {money(order.total)} as {method}</button></p>
            </div>
          )}
          <div className="card">
            <h2>Kitchen status</h2>
            <div className="row">
              {next ? <button className="secondary" onClick={() => act('/status', { method: 'PATCH', body: { status: next } })}>Mark as {next}</button> : <span className="muted">This order is complete.</span>}
              <button className="ghost" onClick={() => window.print()}>Print bill</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
