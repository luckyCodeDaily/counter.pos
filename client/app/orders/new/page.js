'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, money } from '../../../lib/api';

const EMOJI = [[/cold|iced|frappe|shake/i, '🧋'], [/chai|tea/i, '🍵'], [/coffee|latte|cappuccino|espresso|mocha/i, '☕'],
  [/sandwich|toast/i, '🥪'], [/wrap|roll/i, '🌯'], [/fries/i, '🍟'], [/burger/i, '🍔'], [/pizza/i, '🍕'],
  [/brownie|cake|pastry|dessert|cookie/i, '🍰'], [/juice|lemon/i, '🧃'], [/salad/i, '🥗'], [/pasta|noodle/i, '🍝']];
const BY_CATEGORY = { beverages: '☕', snacks: '🥪', desserts: '🍰' };
const emojiFor = (m) => (EMOJI.find(([re]) => re.test(m.name)) || [])[1] || BY_CATEGORY[m.category.toLowerCase()] || '🍽️';

export default function NewOrder() {
  const router = useRouter();
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState({}); // menuItemId -> quantity
  const [type, setType] = useState('Dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState({ type: 'percent', value: 0 });
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/menu').then((d) => setMenu(d.items)).catch((e) => setError(e.message)); }, []);

  const categories = useMemo(() => ['All', ...new Set(menu.map((m) => m.category))], [menu]);
  const shown = menu.filter((m) => (category === 'All' || m.category === category) && m.name.toLowerCase().includes(search.toLowerCase()));
  const lines = Object.entries(cart).map(([id, quantity]) => ({ menuItemId: id, quantity, item: menu.find((m) => m._id === id) })).filter((l) => l.item);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const payload = () => ({
    type, tableNumber, customerName, discount,
    items: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
  });

  // Totals always come from the server (/orders/preview)
  useEffect(() => {
    if (lines.length === 0) { setTotals(null); return; }
    const t = setTimeout(() => {
      api('/orders/preview', { method: 'POST', body: payload() })
        .then((d) => { setTotals(d.totals); setError(''); })
        .catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, discount]);

  const setQty = (id, q) => setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = Math.min(q, 99); return n; });

  async function place() {
    setBusy(true); setError('');
    try {
      const { order } = await api('/orders', { method: 'POST', body: payload() });
      router.push(`/orders/${order._id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <>
      <div className="page-head"><h1>New order</h1></div>
      <div className="pos">
        <section>
          <input placeholder="Search menu" aria-label="Search menu" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', maxWidth: 360 }} />
          <div className="tabs">
            {categories.map((c) => <button key={c} className={c === category ? 'on' : ''} onClick={() => setCategory(c)}>{c}</button>)}
          </div>
          <div className="menu-grid">
            {shown.map((m) => (
              <button key={m._id} className={`tile ${cart[m._id] ? 'in' : ''}`} disabled={!m.isAvailable} onClick={() => setQty(m._id, (cart[m._id] || 0) + 1)}>
                <span className="emoji" aria-hidden="true">{emojiFor(m)}</span>
                <span className="name">{m.name}</span>
                <span className="price">{m.isAvailable ? money(m.price) : 'Sold out'}</span>
                {cart[m._id] > 0 && <span className="qty">{cart[m._id]}</span>}
              </button>
            ))}
            {shown.length === 0 && <p className="muted">No menu items match.</p>}
          </div>
        </section>

        <aside className="ticket-col">
          <div className="receipt">
            <div className="r-head"><b>Counter</b><span className="muted">{count} item{count === 1 ? '' : 's'} in this order</span></div>
            <div className="row between">
              <div className="seg">
                {['Dine-in', 'Takeaway'].map((t) => <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>)}
              </div>
              {type === 'Dine-in' && <input placeholder="Table" aria-label="Table number" size={6} value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />}
            </div>
            <input placeholder="Customer name (optional)" aria-label="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', marginTop: '.6rem' }} />
            <div className="r-sep" />

            {lines.length === 0 ? <p className="muted">Tap a menu item to add it.</p> : lines.map((l) => (
              <div className="r-item" key={l.menuItemId}>
                <div>{l.item.name}<small>{money(l.item.price)} each</small></div>
                <div className="stepper">
                  <button aria-label={`Decrease ${l.item.name}`} onClick={() => setQty(l.menuItemId, l.quantity - 1)}>−</button>
                  <span>{l.quantity}</span>
                  <button aria-label={`Increase ${l.item.name}`} onClick={() => setQty(l.menuItemId, l.quantity + 1)}>+</button>
                </div>
                <div className="r-amt">{money(l.item.price * l.quantity)}</div>
              </div>
            ))}

            <div className="r-sep" />
            <div className="r-line">
              <span>Discount</span>
              <span className="row" style={{ gap: '.3rem', flexWrap: 'nowrap' }}>
                <select aria-label="Discount type" value={discount.type} onChange={(e) => setDiscount({ ...discount, type: e.target.value })}><option value="percent">%</option><option value="flat">₹</option></select>
                <input type="number" min="0" aria-label="Discount value" value={discount.value} onChange={(e) => setDiscount({ ...discount, value: e.target.value })} style={{ width: 70 }} />
              </span>
            </div>
            {totals && (
              <div className="totals" style={{ marginTop: '.4rem' }}>
                <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
                {totals.discountAmount > 0 && <div><span>Discount</span><span>− {money(totals.discountAmount)}</span></div>}
                <div><span>Tax ({totals.taxRate}%)</span><span>{money(totals.taxAmount)}</span></div>
                <div className="grand"><span>Total</span><span>{money(totals.total)}</span></div>
              </div>
            )}
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="row">
            <button className="amber" style={{ flex: 1, justifyContent: 'center', padding: '.75rem' }} disabled={busy || lines.length === 0} onClick={place}>
              {busy ? 'Placing…' : totals ? `Place order · ${money(totals.total)}` : 'Place order'}
            </button>
            <button className="ghost" disabled={lines.length === 0} onClick={() => setCart({})}>Clear</button>
          </div>
        </aside>
      </div>
    </>
  );
}
