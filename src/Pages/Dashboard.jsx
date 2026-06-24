import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])

const fmtMoney = (n) =>
  n == null || isNaN(Number(n))
    ? '—'
    : `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : '—')

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
}

const ESTADO = {
  pendiente:  { bg: '#fffbeb', color: '#d97706', label: 'Pendiente'  },
  aprobado:   { bg: '#f0fdf4', color: '#16a34a', label: 'Aprobado'   },
  pagada:     { bg: '#f0fdf4', color: '#16a34a', label: 'Pagada'     },
  cancelado:  { bg: '#fef2f2', color: '#dc2626', label: 'Cancelado'  },
  rechazado:  { bg: '#fef2f2', color: '#dc2626', label: 'Rechazado'  },
}
const estadoStyle = (e) =>
  ESTADO[e?.toLowerCase()] ?? { bg: 'var(--c-border-light)', color: 'var(--c-muted)', label: e ?? '—' }

/* ─── Icon ─────────────────────────────────────────────────────────────────── */
function Ic({ n, size = 20 }) {
  const d = {
    money:    ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'],
    box:      ['M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', 'M3.27 6.96L12 12.01l8.73-5.05', 'M12 22.08V12'],
    file:     ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
    contract: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M9 12h6', 'M9 16h4'],
    truck:    ['M1 3h15v13H1z', 'M16 8h4l3 3v5h-7V8z', 'M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z', 'M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z'],
    users:    ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
    clock:    ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 6v6l4 2'],
    tag:      ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z', 'M7 7h.01'],
    zap:      ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
    arrow:    ['M5 12h14', 'M12 5l7 7-7 7'],
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(d[n] ?? []).map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

/* ─── Admin dashboard ───────────────────────────────────────────────────────── */
function AdminDashboard({ session }) {
  const navigate = useNavigate()

  const [comisiones,  setComisiones]  = useState([])
  const [ordenes,     setOrdenes]     = useState([])
  const [proveedores, setProveedores] = useState([])
  const [empresas,    setEmpresas]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [hovered,     setHovered]     = useState(null)

  useEffect(() => {
    const load = async () => {
      const [comRes, ordRes, provRes, empRes] = await Promise.allSettled([
        api.get('/api/v1/comisiones'),
        api.get('/api/v1/ordenes-compra'),
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/empresas?page=0&size=1000&sortBy=nombre'),
      ])
      setComisiones(norm(comRes.status === 'fulfilled' ? comRes.value : []))
      setOrdenes(norm(ordRes.status === 'fulfilled' ? ordRes.value : []))
      setProveedores(norm(provRes.status === 'fulfilled' ? provRes.value : []))
      const empData = empRes.status === 'fulfilled' ? empRes.value : []
      setEmpresas(norm(Array.isArray(empData) ? empData : (empData?.content ?? [])))
      setLoading(false)
    }
    load()
  }, [])

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalComisiones = comisiones.reduce((acc, c) => acc + Number(c.montoComision || 0), 0)
  const totalVolumen    = ordenes.reduce((acc, o) => acc + Number(o.total || 0), 0)
  const totalOrdenes    = ordenes.length

  const now = Date.now()
  const ms24h = 24 * 60 * 60 * 1000
  const ms7d  = 7  * 24 * 60 * 60 * 1000

  const com24h = comisiones.filter(c => now - new Date(c.fecha).getTime() <= ms24h)
  const com7d  = comisiones.filter(c => now - new Date(c.fecha).getTime() <= ms7d)
  const total24h = com24h.reduce((acc, c) => acc + Number(c.montoComision || 0), 0)
  const total7d  = com7d.reduce((acc, c)  => acc + Number(c.montoComision || 0), 0)

  // Top 5 proveedores por comisión generada
  const comByProv = {}
  comisiones.forEach(c => {
    const nombre = c.idProveedor?.idEmpresa?.nombre ?? c.nombreProveedor ?? 'Desconocido'
    comByProv[nombre] = (comByProv[nombre] || 0) + Number(c.montoComision || 0)
  })
  const topProveedores = Object.entries(comByProv).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCom = topProveedores[0]?.[1] || 1

  const recentCom = [...comisiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8)

  const kpis = [
    {
      key: 'comisiones', label: 'Comisiones cobradas', icon: 'money',
      value: fmtMoney(totalComisiones), sub: `de ${comisiones.length} transacciones`,
      grad: 'linear-gradient(135deg,#065f46,#059669)',
    },
    {
      key: 'volumen', label: 'Volumen operado', icon: 'zap',
      value: fmtMoney(totalVolumen), sub: `en ${totalOrdenes} órdenes totales`,
      grad: 'linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))',
    },
    {
      key: '24h', label: 'Comisiones últimas 24h', icon: 'zap',
      value: fmtMoney(total24h), sub: `${com24h.length} transacciones`,
      grad: 'linear-gradient(135deg,#1e1b4b,#4f46e5)',
    },
    {
      key: '7d', label: 'Comisiones últimos 7 días', icon: 'clock',
      value: fmtMoney(total7d), sub: `${com7d.length} transacciones`,
      grad: 'linear-gradient(135deg,#78350f,#d97706)',
    },
  ]

  return (
    <div>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroCircle1} /><div style={s.heroCircle2} />
        <div style={s.heroLeft}>
          <p style={s.heroGreet}>{greeting()},</p>
          <h1 style={s.heroName}>{session?.nombre ?? 'Administrador'}</h1>
          <div style={s.heroBadgeRow}>
            <span style={s.heroBadge}>Administrador</span>
            <span style={s.heroEmpresa}>Marketplace B2B</span>
          </div>
        </div>
        <div style={s.heroSummary}>
          <div style={s.heroStat}>
            <p style={s.heroStatVal}>{loading ? '—' : fmtMoney(totalComisiones)}</p>
            <p style={s.heroStatLbl}>Comisiones cobradas</p>
          </div>
          <div style={s.heroStatDivider} />
          <div style={s.heroStat}>
            <p style={s.heroStatVal}>{loading ? '—' : fmtMoney(totalVolumen)}</p>
            <p style={s.heroStatLbl}>Volumen operado</p>
          </div>
          <div style={s.heroStatDivider} />
          <div style={s.heroStat}>
            <p style={s.heroStatVal}>{loading ? '—' : totalOrdenes}</p>
            <p style={s.heroStatLbl}>Órdenes totales</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        {kpis.map(c => (
          <button key={c.key}
            style={{
              ...s.kpiCard,
              cursor: c.action ? 'pointer' : 'default',
              transform: hovered === c.key && c.action ? 'translateY(-3px)' : 'none',
              boxShadow: hovered === c.key && c.action ? '0 8px 24px rgba(6,23,93,0.16)' : '0 2px 8px rgba(6,23,93,0.07)',
            }}
            onClick={c.action}
            onMouseEnter={() => setHovered(c.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ ...s.iconBox, background: c.grad }}><Ic n={c.icon} size={18} /></div>
              {c.alert && <span style={s.alertDot} />}
            </div>
            <p style={s.kpiValue}>{loading ? '—' : c.value}</p>
            <p style={s.kpiLabel}>{c.label}</p>
            <p style={s.kpiSub}>{c.sub}</p>
            {c.action && <div style={s.kpiLink}><span>Ver detalle</span><Ic n="arrow" size={11} /></div>}
          </button>
        ))}
      </div>

      {/* Contenido principal */}
      <div style={s.splitLayout}>

        {/* Últimas comisiones */}
        <div style={s.mainCard}>
          <div style={s.cardHead}>
            <p style={s.cardTitle}>Últimas comisiones cobradas</p>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 500 }}>
              {comisiones.length} registros totales
            </span>
          </div>
          {loading ? (
            <p style={s.emptyMsg}>Cargando...</p>
          ) : recentCom.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ color: 'var(--c-border)', display: 'flex', justifyContent: 'center' }}>
                <Ic n="money" size={36} />
              </div>
              <p style={s.emptyTitle}>Sin comisiones registradas</p>
              <p style={s.emptySub}>Las comisiones se generan automáticamente por cada venta procesada en la plataforma.</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Proveedor</th>
                  <th style={s.th}>Venta del proveedor</th>
                  <th style={s.th}>Mi comisión</th>
                  <th style={s.th}>Regla</th>
                  <th style={s.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentCom.map((c, i) => (
                  <tr key={c.id ?? i} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-alt)' }}>
                    <td style={{ ...s.td, fontWeight: 600 }}>
                      {c.idProveedor?.idEmpresa?.nombre ?? c.nombreProveedor ?? '—'}
                    </td>
                    <td style={s.td}>{fmtMoney(c.montoProveedor)}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: '#059669' }}>
                      {fmtMoney(c.montoComision)}
                    </td>
                    <td style={{ ...s.td, fontSize: 11, color: 'var(--c-muted)' }}>
                      {c.idReglaComision?.tipo ?? c.nombreReglaComision ?? '—'}
                    </td>
                    <td style={{ ...s.td, color: 'var(--c-muted)' }}>{fmtDate(c.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Columna derecha */}
        <div style={s.rightCol}>

          {/* Top proveedores */}
          <div style={s.sideCard}>
            <p style={s.cardTitle}>Top proveedores</p>
            <p style={{ margin: '2px 0 14px', fontSize: 11, color: 'var(--c-muted)' }}>Por comisión generada para la plataforma</p>
            {loading || topProveedores.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--c-muted)', margin: 0 }}>Sin datos aún.</p>
            ) : (
              topProveedores.map(([nombre, monto], i) => (
                <div key={nombre} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      <span style={{ color: 'var(--c-muted)', marginRight: 5 }}>#{i + 1}</span>{nombre}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', flexShrink: 0, marginLeft: 6 }}>
                      {fmtMoney(monto)}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: 'var(--c-border-light)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,var(--c-primary),#4f46e5)', width: `${Math.round((monto / maxCom) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { session } = useAuth()
  const navigate    = useNavigate()
  const isProveedor = session?.rol === 'proveedor'
  const isAdmin     = session?.rol === 'admin'

  const [ordenes,   setOrdenes]   = useState([])
  const [contratos, setContratos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [hovered,   setHovered]   = useState(null)

  useEffect(() => {
    if (isAdmin) { setLoading(false); return }
    load()
  }, [session?.id_empresa])

  const load = async () => {
    setLoading(true)
    try {
      const [ordRes, conRes] = await Promise.allSettled([
        api.get('/api/v1/ordenes-compra'),
        api.get('/api/v1/contratos-tarifa'),
      ])
      let ords = norm(ordRes.status === 'fulfilled' ? ordRes.value : [])
      let cons = norm(conRes.status === 'fulfilled' ? conRes.value : [])

      if (isProveedor) {
        ords = ords.filter(o => o.idProveedor?.idEmpresa?.id === session?.id_empresa)
        cons = cons.filter(c => c.idProveedor?.idEmpresa?.id === session?.id_empresa)
      } else {
        ords = ords.filter(o => o.idEmpresaCompradora?.id === session?.id_empresa)
        cons = cons.filter(c => c.idEmpresa?.id === session?.id_empresa)
      }
      setOrdenes(ords)
      setContratos(cons)
    } catch {}
    setLoading(false)
  }

  if (isAdmin) return <AdminDashboard session={session} />

  /* ── Derived metrics ── */
  const totalMonto       = ordenes.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const pendientes       = ordenes.filter(o => o.idEstado?.toLowerCase() === 'pendiente').length
  const completadas      = ordenes.filter(o => ['aprobado', 'pagada'].includes(o.idEstado?.toLowerCase())).length
  const canceladas       = ordenes.filter(o => ['cancelado', 'rechazado'].includes(o.idEstado?.toLowerCase())).length
  const contratosActivos = contratos.filter(c => c.activo).length
  const recentOrdenes    = [...ordenes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8)

  const total     = ordenes.length || 1
  const breakdown = [
    { label: 'Pendientes',  val: pendientes,  color: '#d97706', pct: Math.round((pendientes  / total) * 100) },
    { label: 'Completadas', val: completadas,  color: '#16a34a', pct: Math.round((completadas  / total) * 100) },
    { label: 'Canceladas',  val: canceladas,  color: '#dc2626', pct: Math.round((canceladas  / total) * 100) },
  ]

  const kpiCards = isProveedor ? [
    { key: 'ingresos',    label: 'Ingresos generados',    value: fmtMoney(totalMonto),  sub: `de ${ordenes.length} órdenes recibidas`, icon: 'money',    grad: 'linear-gradient(135deg,#065f46,#059669)' },
    { key: 'pendientes',  label: 'Órdenes pendientes',    value: pendientes,             sub: pendientes === 0 ? 'Sin órdenes por procesar' : 'requieren atención', icon: 'clock', grad: 'linear-gradient(135deg,#78350f,#d97706)', alert: pendientes > 0, action: () => navigate('/mis-ordenes') },
    { key: 'procesadas',  label: 'Procesadas / Pagadas',  value: completadas,            sub: `${Math.round((completadas / total) * 100)}% de éxito`, icon: 'box', grad: 'linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))', action: () => navigate('/mis-ordenes') },
    { key: 'contratos',   label: 'Contratos activos',     value: contratosActivos,       sub: `${contratos.length} contratos en total`, icon: 'contract', grad: 'linear-gradient(135deg,#1e1b4b,#4f46e5)', action: () => navigate('/contratos') },
  ] : [
    { key: 'gastado',     label: 'Total en compras',      value: fmtMoney(totalMonto),  sub: `en ${ordenes.length} órdenes`, icon: 'money', grad: 'linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))' },
    { key: 'pendientes',  label: 'Órdenes pendientes',    value: pendientes,             sub: pendientes === 0 ? 'Todo al día' : 'esperando aprobación', icon: 'clock', grad: 'linear-gradient(135deg,#78350f,#d97706)', alert: pendientes > 0, action: () => navigate('/mis-ordenes') },
    { key: 'completadas', label: 'Órdenes completadas',   value: completadas,            sub: `${Math.round((completadas / total) * 100)}% de éxito`, icon: 'box', grad: 'linear-gradient(135deg,#065f46,#059669)', action: () => navigate('/mis-ordenes') },
    { key: 'contratos',   label: 'Contratos vigentes',    value: contratosActivos,       sub: `${contratos.length} contratos en total`, icon: 'contract', grad: 'linear-gradient(135deg,#1e1b4b,#4f46e5)', action: () => navigate('/contratos') },
  ]


  return (
    <div>
      <HeroBanner session={session} role={session?.rol} totalMonto={totalMonto} totalOrdenes={ordenes.length} />

      {/* ── KPI Cards ── */}
      <div style={s.kpiGrid}>
        {kpiCards.map(c => (
          <button key={c.key}
            style={{
              ...s.kpiCard,
              cursor: c.action ? 'pointer' : 'default',
              transform: hovered === c.key && c.action ? 'translateY(-3px)' : 'none',
              boxShadow: hovered === c.key && c.action ? '0 8px 24px rgba(6,23,93,0.16)' : '0 2px 8px rgba(6,23,93,0.07)',
            }}
            onClick={c.action}
            onMouseEnter={() => setHovered(c.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ ...s.iconBox, background: c.grad }}><Ic n={c.icon} size={18} /></div>
              {c.alert && <span style={s.alertDot} />}
            </div>
            <p style={s.kpiValue}>{loading ? '—' : c.value}</p>
            <p style={s.kpiLabel}>{c.label}</p>
            <p style={s.kpiSub}>{c.sub}</p>
            {c.action && <div style={s.kpiLink}><span>Ver detalle</span><Ic n="arrow" size={11} /></div>}
          </button>
        ))}
      </div>

      {/* ── Split layout ── */}
      <div style={s.splitLayout}>

        {/* Recent orders table */}
        <div style={s.mainCard}>
          <div style={s.cardHead}>
            <p style={s.cardTitle}>{isProveedor ? 'Órdenes recibidas' : 'Últimas órdenes'}</p>
            <button style={s.viewAllBtn} onClick={() => navigate('/mis-ordenes')}>
              Ver todas <Ic n="arrow" size={12} />
            </button>
          </div>

          {loading ? (
            <p style={s.emptyMsg}>Cargando...</p>
          ) : recentOrdenes.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ color: 'var(--c-border)', display: 'flex', justifyContent: 'center' }}><Ic n="box" size={36} /></div>
              <p style={s.emptyTitle}>Sin órdenes aún</p>
              <p style={s.emptySub}>
                {isProveedor ? 'Las órdenes que recibas aparecerán aquí.' : 'Crea tu primera orden desde "Mis órdenes".'}
              </p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}># Orden</th>
                  <th style={s.th}>{isProveedor ? 'Comprador' : 'Proveedor'}</th>
                  <th style={s.th}>Total</th>
                  <th style={s.th}>Estado</th>
                  <th style={s.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrdenes.map((o, i) => {
                  const st = estadoStyle(o.idEstado)
                  const counterpart = isProveedor
                    ? (o.idEmpresaCompradora?.nombre ?? '—')
                    : (o.idProveedor?.idEmpresa?.nombre ?? '—')
                  return (
                    <tr key={o.id ?? i} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-alt)' }}>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 700, color: 'var(--c-primary)', fontSize: 12 }}>
                        #{shortId(o.id)}
                      </td>
                      <td style={{ ...s.td, fontWeight: 500 }}>{counterpart}</td>
                      <td style={{ ...s.td, fontWeight: 700 }}>{fmtMoney(o.total)}</td>
                      <td style={s.td}>
                        <span style={{ ...s.statusChip, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ ...s.td, color: 'var(--c-muted)' }}>{fmtDate(o.fecha)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={s.rightCol}>

          {/* Status breakdown */}
          <div style={s.sideCard}>
            <p style={s.cardTitle}>Estado de órdenes</p>
            {loading || ordenes.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--c-muted)', margin: '8px 0 0' }}>Sin datos aún.</p>
            ) : (
              <>
                <div style={s.stackedBar}>
                  {breakdown.map(b => b.val > 0 && (
                    <div key={b.label} style={{ width: `${b.pct}%`, background: b.color, borderRadius: 4, minWidth: 4 }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {breakdown.map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--c-text)', fontWeight: 500 }}>{b.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>{b.val}</span>
                        <span style={{ fontSize: 11, color: 'var(--c-border)', width: 30, textAlign: 'right' }}>{b.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={s.totalRow}>
                  <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Total órdenes</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-primary)' }}>{ordenes.length}</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ─── Hero Banner ───────────────────────────────────────────────────────────── */
function HeroBanner({ session, role, totalMonto, totalOrdenes }) {
  const rolLabel = { admin: 'Administrador', proveedor: 'Proveedor', empresa: 'Empresa compradora' }
  return (
    <div style={s.hero}>
      <div style={s.heroCircle1} /><div style={s.heroCircle2} />
      <div style={s.heroLeft}>
        <p style={s.heroGreet}>{greeting()},</p>
        <h1 style={s.heroName}>{session?.nombre ?? 'usuario'}</h1>
        <div style={s.heroBadgeRow}>
          <span style={s.heroBadge}>{rolLabel[role] ?? 'Usuario'}</span>
          {session?.nombreEmpresa && <span style={s.heroEmpresa}>{session.nombreEmpresa}</span>}
        </div>
      </div>
      {role !== 'admin' && (
        <div style={s.heroSummary}>
          <div style={s.heroStat}>
            <p style={s.heroStatVal}>{fmtMoney(totalMonto)}</p>
            <p style={s.heroStatLbl}>{role === 'proveedor' ? 'En ingresos' : 'En compras'}</p>
          </div>
          <div style={s.heroStatDivider} />
          <div style={s.heroStat}>
            <p style={s.heroStatVal}>{totalOrdenes ?? '—'}</p>
            <p style={s.heroStatLbl}>Órdenes totales</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Styles ────────────────────────────────────────────────────────────────── */
const s = {
  hero:            { background: 'linear-gradient(135deg,var(--c-primary) 0%,var(--c-primary-mid) 100%)', borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', minHeight: 120 },
  heroCircle1:     { position: 'absolute', right: -20, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
  heroCircle2:     { position: 'absolute', right: 120, bottom: -50, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' },
  heroLeft:        { zIndex: 1 },
  heroGreet:       { margin: '0 0 2px', fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 },
  heroName:        { margin: '0 0 10px', fontSize: 24, fontWeight: 800, color: '#fff' },
  heroBadgeRow:    { display: 'flex', alignItems: 'center', gap: 8 },
  heroBadge:       { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' },
  heroEmpresa:     { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  heroSummary:     { zIndex: 1, display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 22px' },
  heroStat:        { textAlign: 'center' },
  heroStatVal:     { margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 },
  heroStatLbl:     { margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 },
  heroStatDivider: { width: 1, height: 36, background: 'rgba(255,255,255,0.15)' },

  kpiGrid:         { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.25rem' },
  kpiCard:         { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.1rem', textAlign: 'left', transition: 'transform .18s, box-shadow .18s' },
  iconBox:         { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 },
  alertDot:        { width: 8, height: 8, borderRadius: '50%', background: '#d97706', marginTop: 6 },
  kpiValue:        { margin: '0 0 2px', fontSize: 26, fontWeight: 800, color: 'var(--c-primary)', lineHeight: 1 },
  kpiLabel:        { margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: 'var(--c-text)' },
  kpiSub:          { margin: '0 0 10px', fontSize: 11, color: 'var(--c-muted)' },
  kpiLink:         { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 },

  adminCard:       { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.1rem 1.25rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 },
  adminCardLabel:  { flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--c-text)', margin: 0 },

  splitLayout:     { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', alignItems: 'flex-start' },
  mainCard:        { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' },
  cardHead:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border-light)' },
  cardTitle:       { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--c-primary)' },
  viewAllBtn:      { display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', cursor: 'pointer' },

  table:           { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:              { padding: '9px 14px', background: 'var(--c-bg-subtle)', color: 'var(--c-muted)', fontWeight: 700, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: .4 },
  td:              { padding: '11px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)' },
  statusChip:      { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },

  emptyState:      { padding: '3rem 2rem', textAlign: 'center' },
  emptyTitle:      { fontSize: 15, fontWeight: 700, color: 'var(--c-text)', margin: '12px 0 4px' },
  emptySub:        { fontSize: 12, color: 'var(--c-muted)', margin: 0 },
  emptyMsg:        { padding: '2rem', color: 'var(--c-muted)', fontSize: 14, textAlign: 'center', margin: 0 },

  rightCol:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sideCard:        { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.1rem 1.25rem' },

  stackedBar:      { height: 8, borderRadius: 6, display: 'flex', gap: 3, marginTop: 12, background: 'var(--c-border-light)' },
  totalRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--c-border-light)' },

}
