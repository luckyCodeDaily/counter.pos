'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

const ICONS = {
  dash: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  plus: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 8v8M8 12h8',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  cup: 'M5 8h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM17 9h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2',
  users: 'M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 20v-1a3 3 0 0 0-2-2.8M16 5.2a3 3 0 0 1 0 5.6',
  out: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
};
export const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name]} /></svg>
);

const isActive = (href, path) =>
  href === '/' || href === '/orders/new' ? path === href : path.startsWith(href) && !path.startsWith('/orders/new');

export default function Nav() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const links = [['/', 'Dashboard', 'dash'], ['/orders/new', 'New order', 'plus'], ['/orders', 'Orders', 'receipt'], ['/menu', 'Menu', 'cup'],
    ...(user.role === 'admin' ? [['/users', 'Users', 'users']] : [])];
  return (
    <aside className="side">
      <div className="logo"><i><Icon name="cup" size={20} /></i><span>Counter</span></div>
      <nav>
        {links.map(([href, label, icon]) => (
          <Link key={href} href={href} className={isActive(href, path) ? 'active' : ''}><Icon name={icon} />{label}</Link>
        ))}
      </nav>
      <div className="me">
        <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
        <div><span className="who">{user.name}</span><small>{user.role}</small></div>
        <button onClick={logout} aria-label="Log out" title="Log out"><Icon name="out" /></button>
      </div>
    </aside>
  );
}
