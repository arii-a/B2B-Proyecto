import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const PAGE_SIZE = 15

const TABS = [
  { key: 'todas',     label: 'Todas'      },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobado',  label: 'Aprobadas'  },
  { key: 'cancelado', label: 'Canceladas' },
  { key: 'rechazado', label: 'Rechazadas' },
]

const ESTADO_COLORS = {
  pendiente: { bg: '#fef9c3', color: '#854d0e' },
  aprobado:  { bg: '#dcfce7', color: '#166534' },
  cancelado: { bg: '#fee2e2', color: '#dc2626' },
  rechazado: { bg: '#e2e8f0', color: '#475569' },
}

export default function AdminOrdenes() {
  const [ordenes,       setOrdenes]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [msg,           setMsg]           = useState(null)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [tab,           setTab]           = useState('todas')
  const [counts,        setCounts]        = useState({})

  const fetch = async (p = 0, currentTab = tab) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/ordenes-compra/paged?page=${p}&size=${PAGE_SIZE}`)
      const all = res?.content ?? []
      setOrdenes(all)
      setTotalPages(res?.totalPages ?? 0)
      setTotalElements(res?.totalElements ?? 0)
      setPage(p)

      // Count per estado from current page (approximate)
      const c = {}
      all.forEach(o => { c[o.idEstado] = (c[o.idEstado] || 0) + 1 })
      setCounts(c)
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
    setLoading(false)
  }

  useEffect(() => { fetch(0, tab) }, [])

  const cambiarEstado = async (orden, nuevoEstado) => {
    setMsg(null)
    try {
      await api.put(`/api/v1/ordenes-compra/${orden.id}`, {
        total:               orden.total,
        fecha:               orden.fecha,
        fechaOrden:          orden.fechaOrden,
        idEstado:            nuevoEstado,
        idProveedor:         orden.idProveedor?.id,
        idEmpresaCompradora: orden.idEmpresaCompradora?.id,
        idSucursal:          orden.idSucursal?.id,
        idUsuario:           orden.idUsuario?.id,
      })
      setMsg({ ok: true, text: `Orden actualizada a "${nuevoEstado}"` })
      fetch(page, tab)
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
  }

  const visible = tab === 'todas' ? ordenes : ordenes.filter(o => o.idEstado === tab)

  return (
    <div>
      <PageHeader
        title="Órdenes de compra"
        subtitle={`${totalElements} órdenes en total`}
      />

      {/* Tabs */}
      <div style={s.tabBar}>
        {TABS.map(t => (
          <button key={t.key}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => { setTab(t.key); fetch(0, t.key) }}>
            {t.label}
            {t.key !== 'todas' && counts[t.key] > 0 && (
              <span style={{ ...s.badge, background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'var(--c-primary-light)', color: tab === t.key ? '#fff' : 'var(--c-primary)' }}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ ...s.feedback, background: msg.ok ? '#f0fdf4' : '#fef2f2', color: msg.ok ? '#166534' : '#dc2626', border: `1px solid ${msg.ok ? '#bbf7d0' : '#fca5a5'}` }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={s.tableWrap}><p style={s.empty}>Cargando...</p></div>
      ) : visible.length === 0 ? (
        <div style={s.tableWrap}><p style={s.empty}>No hay órdenes{tab !== 'todas' ? ` con estado "${tab}"` : ''}.</p></div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['ID', 'Empresa compradora', 'Proveedor', 'Sucursal', 'Total', 'Fecha', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((o, i) => {
                const ec = ESTADO_COLORS[o.idEstado] ?? { bg: 'var(--c-bg-subtle)', color: 'var(--c-muted)' }
                return (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)' }}>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 11, color: 'var(--c-muted)' }}>{String(o.id).slice(0, 8)}…</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{o.idEmpresaCompradora?.nombre || '—'}</td>
                    <td style={s.td}>{o.idProveedor?.idEmpresa?.nombre || '—'}</td>
                    <td style={s.td}>{o.idSucursal?.nombre || '—'}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>
                      {Number(o.total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      {(o.fecha || o.fechaOrden) ? new Date(o.fecha || o.fechaOrden).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={s.td}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ec.bg, color: ec.color }}>
                        {o.idEstado}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      {o.idEstado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={s.btnOk}  onClick={() => cambiarEstado(o, 'aprobado')}>Aprobar</button>
                          <button style={s.btnDel} onClick={() => cambiarEstado(o, 'rechazado')}>Rechazar</button>
                        </div>
                      )}
                      {o.idEstado === 'aprobado' && (
                        <button style={s.btnDel} onClick={() => cambiarEstado(o, 'cancelado')}>Cancelar</button>
                      )}
                      {(o.idEstado === 'cancelado' || o.idEstado === 'rechazado') && (
                        <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={s.pagination}>
              <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} de {totalElements}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={s.pageBtn} onClick={() => fetch(page - 1)} disabled={page === 0}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} style={{ ...s.pageBtn, ...(i === page ? s.pageBtnActive : {}) }} onClick={() => fetch(i)}>{i + 1}</button>
                ))}
                <button style={s.pageBtn} onClick={() => fetch(page + 1)} disabled={page >= totalPages - 1}>›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  tabBar:      { display: 'flex', gap: 4, marginBottom: '1rem', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, padding: 4 },
  tab:         { flex: 1, padding: '8px 14px', border: 'none', borderRadius: 7, background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--c-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive:   { background: 'var(--c-primary)', color: '#fff', fontWeight: 700 },
  badge:       { padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  feedback:    { borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: '1rem' },

  tableWrap:   { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:          { padding: '10px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--c-border)', whiteSpace: 'nowrap' },
  td:          { padding: '10px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)' },
  empty:       { padding: '2.5rem', color: 'var(--c-muted)', fontSize: 14, textAlign: 'center', margin: 0 },

  btnOk:       { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnDel:      { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'var(--c-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' },

  pagination:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--c-border-light)' },
  pageBtn:     { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1px solid var(--c-border)', borderRadius: 6, cursor: 'pointer' },
  pageBtnActive: { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },
}
