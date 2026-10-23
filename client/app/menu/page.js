'use client';
import { useEffect, useState } from 'react';
import { api, money } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';

const blank = { name: '', category: '', price: '', isAvailable: true };

export default function Menu() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    const qs = new URLSearchParams({ ...(search && { search }), ...(category && { category }), ...(admin && { includeInactive: 'true' }) });
    api('/menu?' + qs).then((d) => setItems(d.items)).catch((e) => setError(e.message));
  };
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [search, category]); // eslint-disable-line

  async function save(e) {
    e.preventDefault(); setError('');
    try {
      await api(editing ? `/menu/${editing}` : '/menu', { method: editing ? 'PUT' : 'POST', body: form });
      setForm(blank); setEditing(null); load();
    } catch (err) { setError(err.message); }
  }
  const patch = (it, body) => api(`/menu/${it._id}`, { method: 'PUT', body }).then(load).catch((e) => setError(e.message));

  return (
    <>
      <h1>Menu</h1>
      <div className="row" style={{ marginBottom: '.8rem' }}>
        <input placeholder="Search items" aria-label="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input placeholder="Category" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      {admin && (
        <form className="card row" onSubmit={save} style={{ marginBottom: '1rem' }}>
          <input placeholder="Name" aria-label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Category" aria-label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Price" aria-label="Price" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: 100 }} />
          <label className="row" style={{ margin: 0 }}><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} /> Available</label>
          <button>{editing ? 'Save changes' : 'Add item'}</button>
          {editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>}
        </form>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th className="num">Price</th><th>Status</th>{admin && <th></th>}</tr></thead>
          <tbody>{items.map((it) => (
            <tr key={it._id} style={{ opacity: it.isActive ? 1 : 0.5 }}>
              <td>{it.name}</td><td>{it.category}</td><td className="num">{money(it.price)}</td>
              <td>{!it.isActive ? 'Deactivated' : it.isAvailable ? 'Available' : 'Unavailable'}</td>
              {admin && (
                <td className="row">
                  <button className="ghost small" onClick={() => { setEditing(it._id); setForm({ name: it.name, category: it.category, price: it.price, isAvailable: it.isAvailable }); }}>Edit</button>
                  {it.isActive && <button className="ghost small" onClick={() => patch(it, { isAvailable: !it.isAvailable })}>{it.isAvailable ? 'Mark unavailable' : 'Mark available'}</button>}
                  <button className="ghost small" onClick={() => patch(it, { isActive: !it.isActive })}>{it.isActive ? 'Deactivate' : 'Reactivate'}</button>
                </td>
              )}
            </tr>))}
          </tbody>
        </table>
        {items.length === 0 && <p className="muted">No items found.</p>}
      </div>
    </>
  );
}
