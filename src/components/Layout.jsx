import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext'

const C = {
  primary:  '#06175D',
  dk:       '#000053',
  muted:    '#9599AE',
  white:    '#FFFFFF',
  bg:       '#F0F2FA',
  border:   '#DDE0EE',
  text:     '#1A1D3B',
}

const proveedorLinks = [
  { to: '/dashboard',       icon: 'dashboard',    label: 'Dashboard'           },
  { to: '/mis-ordenes',     icon: 'orders',       label: 'Mis órdenes'         },
  { to: '/mis-productos',   icon: 'misproductos', label: 'Mis productos'       },
  { to: '/almacenes',       icon: 'almacenes',    label: 'Almacenes'           },
  { to: '/sucursales',      icon: 'sucursales',   label: 'Sucursales'          },
  { to: '/contratos',       icon: 'contratos',    label: 'Contratos'           },
  { to: '/facturas',        icon: 'facturas',     label: 'Facturas'            },
  { to: '/mi-empresa',      icon: 'miempresa',    label: 'Mi empresa'          },
  { to: '/mi-cuenta',       icon: 'cuenta',       label: 'Mi cuenta'           },
]

const empresaLinks = [
  { to: '/dashboard',   icon: 'dashboard',  label: 'Dashboard'          },
  { to: '/catalogo',    icon: 'catalogo',   label: 'Catálogo'           },
  { to: '/mis-ordenes', icon: 'orders',     label: 'Mis órdenes'        },
  { to: '/facturas',    icon: 'facturas',   label: 'Facturas'           },
  { to: '/contratos',   icon: 'contratos',  label: 'Contratos'          },
  { to: '/proveedores', icon: 'truck',      label: 'Proveedores'        },
  { to: '/sucursales',  icon: 'sucursales', label: 'Sucursales'         },
  { to: '/mi-empresa',  icon: 'miempresa',  label: 'Mi empresa'         },
  { to: '/mi-cuenta',   icon: 'cuenta',     label: 'Mi cuenta'          },
]

const adminLinks = [
  { to: '/dashboard',      icon: 'dashboard', label: 'Dashboard'   },
  { to: '/admin/empresas', icon: 'empresas',  label: 'Empresas'    },
  { to: '/admin/ordenes',  icon: 'orders',    label: 'Órdenes'     },
  { to: '/admin/productos',icon: 'productos', label: 'Productos'   },
  { to: '/admin/usuarios', icon: 'usuarios',  label: 'Usuarios'    },
  { to: '/admin/logs',     icon: 'logs',      label: 'Logs'        },
]

const rolLabel = { admin: 'Administrador', proveedor: 'Proveedor', empresa: 'Empresa compradora' }

export default function Layout({ children }) {
  const { session, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const links = session?.rol === 'admin' ? adminLinks
    : session?.rol === 'proveedor' ? proveedorLinks
    : empresaLinks

  return (
    <div style={s.shell}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandLogo}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="white" fillOpacity=".15"/>
              <path d="M7 21L14 7L21 21H7Z" fill="white"/>
            </svg>
          </div>
          <div>
            <p style={s.brandName}>Marketplace B2B</p>
            <p style={s.brandSub}>{rolLabel[session?.rol] ?? 'Panel'}</p>
          </div>
        </div>

        {/* User pill */}
        <div style={s.userPill}>
          <div style={s.avatar}>{session?.nombre?.charAt(0).toUpperCase() ?? 'U'}</div>
          <div style={{ minWidth: 0 }}>
            <p style={s.userName}>{session?.nombre ?? 'Usuario'}</p>
            <p style={s.userEmail}>{session?.email ?? ''}</p>
          </div>
        </div>

        <div style={s.divider} />

        {/* Nav */}
        <nav style={s.nav}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) })}>
              <span style={s.linkIcon}><NavIcon type={l.icon} /></span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <button onClick={logout} style={s.logout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar sesión
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={s.main}>
        {/* Top bar */}
        <header style={s.topbar}>
          <div style={s.topbarInner}>
            <p style={s.topbarTitle}>{session?.nombreEmpresa ?? 'Mi empresa'}</p>
            <div style={s.topbarBadge}>{rolLabel[session?.rol]}</div>
          </div>
          <button onClick={toggle} style={s.themeBtn} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? '☀' : '☾'}
          </button>
        </header>

        <div style={s.content} className="animate-in">
          {children}
        </div>
      </div>
    </div>
  )
}

function NavIcon({ type }) {
  const p = {
    dashboard:  <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    orders:     <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    stock:      <><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    contratos:  <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    reglas:     <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
    productos:  <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    precios:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    facturas:   <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    resumen:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    truck:      <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    perfil:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    empresas:   <><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/><line x1="9" y1="12" x2="15" y2="12"/></>,
    logs:       <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    usuarios:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    catalogo:      <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="16" y1="10" x2="8" y2="10"/><line x1="16" y1="14" x2="8" y2="14"/></>,
    misproductos:  <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><path d="M7 21h10"/><path d="M12 17v4"/><circle cx="7" cy="6" r="1"/></>,
    almacenes:     <><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/><line x1="9" y1="12" x2="15" y2="12"/></>,
    cuenta:     <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>,
    sucursales: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    miempresa:  <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {p[type] ?? null}
    </svg>
  )
}

const s = {
  shell:      { display: 'flex', minHeight: '100vh', background: 'var(--c-bg-page)' },

  sidebar:    { width: '248px', flexShrink: 0, background: '#06175D', display: 'flex',
                flexDirection: 'column', padding: '1.25rem 1rem', gap: '0',
                height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' },

  brand:      { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' },
  brandLogo:  { width: '38px', height: '38px', borderRadius: '9px', background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName:  { fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '.3px' },
  brandSub:   { fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '1px' },

  userPill:   { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px', padding: '10px 12px', marginBottom: '1rem', overflow: 'hidden' },
  avatar:     { width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '14px', flexShrink: 0 },
  userName:   { fontSize: '13px', fontWeight: '600', color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail:  { fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' },

  divider:    { height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 0 0.75rem' },

  nav:        { display: 'flex', flexDirection: 'column', gap: '2px' },
  link:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'all .15s' },
  linkActive: { background: 'rgba(255,255,255,0.12)', color: '#fff' },
  linkIcon:   { fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 },

  logout:     { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)',
                borderRadius: '8px', padding: '8px 12px', fontSize: '12px', marginTop: '1rem',
                cursor: 'pointer', transition: 'all .15s' },

  main:       { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  topbar:     { background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)',
                padding: '0 2rem', height: '52px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', boxShadow: 'var(--c-shadow-sm)' },
  topbarInner:{ display: 'flex', alignItems: 'center', gap: '12px' },
  topbarTitle:{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' },
  topbarBadge:{ fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: '20px' },
  themeBtn:   { background: 'none', border: '1.5px solid var(--c-border)', borderRadius: '8px',
                padding: '5px 10px', fontSize: '15px', cursor: 'pointer', color: 'var(--c-muted)',
                lineHeight: 1, transition: 'all .15s' },

  content:    { padding: '1.75rem 2rem', flex: 1 },
}
