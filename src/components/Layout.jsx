import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV = [
  { to: '/',             label: '📊 Dashboard'     },
  { to: '/schools',      label: '🏫 Schools'        },
  { to: '/subscriptions',label: '💳 Subscriptions'  },
  { to: '/payments',     label: '💰 Payments'       },
  { to: '/invoices',     label: '🧾 Invoices'       },
  { to: '/feedback',     label: '💬 Feedback'       },
  { to: '/announcements',label: '📢 Announcements'  },
  { to: '/team',         label: '👥 Team'           },
]

const s = {
  wrap:    { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' },
  sidebar: { width: 220, background: '#1e293b', display: 'flex', flexDirection: 'column' },
  logo:    { padding: '20px 16px', borderBottom: '1px solid #334155' },
  logoH:   { color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 },
  logoS:   { color: '#94a3b8', fontSize: 12, margin: 0, marginTop: 2 },
  nav:     { flex: 1, padding: '12px 8px' },
  link:    { display: 'block', padding: '10px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 14, marginBottom: 4 },
  active:  { background: '#3b82f6', color: '#fff' },
  footer:  { padding: '16px', borderTop: '1px solid #334155' },
  user:    { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  logoutBtn: { width: '100%', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  main:    { flex: 1, display: 'flex', flexDirection: 'column' },
  topbar:  { height: 56, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px' },
  topTitle:{ fontWeight: 600, color: '#1e293b', fontSize: 16 },
  content: { flex: 1, padding: 24, overflowY: 'auto' },
}

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={s.wrap}>
      <div style={s.sidebar}>
        <div style={s.logo}>
          <img src="/logo-horizontal.svg" alt="Vikashana" style={{ height:36, width:'auto', display:'block', filter:'brightness(0) invert(1)' }} />
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:6, fontWeight:600, letterSpacing:'0.5px' }}>Super Admin</div>
        </div>
        <nav style={s.nav}>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({ ...s.link, ...(isActive ? s.active : {}) })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={s.footer}>
          <p style={s.user}>{user?.name}</p>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div style={s.main}>
        <div style={s.content}>{children}</div>
      </div>
    </div>
  )
}
