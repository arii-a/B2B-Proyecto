import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const TABS = [
  { label: 'Solicitudes pendientes', key: 'pendientes' },
  { label: 'Aprobados',              key: 'aprobados'  },
  { label: 'Sin solicitud',          key: 'sin'        },
]
const PAGE_SIZE = 10

export default function AdminProveedores() {
  const [proveedores, setProveedores] = useState([])
  const [empresas, setEmpresas]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState(0)
  const [pages, setPages]             = useState({ pendientes: 0, aprobados: 0, sin: 0 })
  const [selected, setSelected]       = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback]       = useState(null)

  const cargar = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const [provData, empData] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/empresas'),
      ])
      const provArr = Array.isArray(provData) ? provData : (provData?.content ?? [])
      const empArr  = Array.isArray(empData)  ? empData  : (empData?.content  ?? [])
      setProveedores(provArr)
      setEmpresas(empArr)
    } catch (e) {
      setFeedback({ ok: false, msg: `Error cargando datos: ${e.message}` })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const provEmpIds = new Set(proveedores.map(p => p.idEmpresa?.id).filter(Boolean))

  const lists = {
    pendientes: proveedores.filter(p => !p.activo).map(p => ({
      type: 'proveedor', provId: p.id, activo: false, empresa: p.idEmpresa ?? {},
    })),
    aprobados: proveedores.filter(p => p.activo).map(p => ({
      type: 'proveedor', provId: p.id, activo: true, empresa: p.idEmpresa ?? {},
    })),
    sin: empresas.filter(e => !provEmpIds.has(e.id)).map(e => ({
      type: 'empresa', provId: null, activo: null, empresa: e,
    })),
  }

  const currentKey  = TABS[tab].key
  const currentList = lists[currentKey]
  const currentPage = pages[currentKey]
  const totalPages  = Math.ceil(currentList.length / PAGE_SIZE)
  const pageSlice   = currentList.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const changeTab = (i) => { setTab(i); setSelected(null); setFeedback(null) }

  const changePage = (p) => {
    setPages(prev => ({ ...prev, [currentKey]: p }))
    setSelected(null)
  }

  const updateActivo = async (provId, nuevoActivo) => {
    setActionLoading(true)
    setFeedback(null)
    try {
      await api.put(`/api/v1/proveedores/${provId}`, { activo: nuevoActivo })
      setFeedback({ ok: true, msg: nuevoActivo ? 'Proveedor aprobado exitosamente.' : 'Proveedor desactivado correctamente.' })
      setSelected(prev => prev ? { ...prev, activo: nuevoActivo } : prev)
      await cargar()
    } catch (e) {
      setFeedback({ ok: false, msg: e.message || 'Error al actualizar el proveedor.' })
    }
    setActionLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Gestión de Proveedores"
        subtitle="Revisá solicitudes, aprobá proveedores y gestioná el estado de cada empresa"
      />

      {/* ── Tab bar ── */}
      <div style={s.tabBar}>
        {TABS.map((t, i) => (
          <button key={t.key} style={{ ...s.tab, ...(tab === i ? s.tabActive : {}) }} onClick={() => changeTab(i)}>
            {t.label}
            <span style={{ ...s.tabBadge, ...(tab === i ? s.tabBadgeActive : {}) }}>
              {lists[t.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content row ── */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.tableWrapper}>
            {loading ? (
              <p style={s.empty}>Cargando...</p>
            ) : currentList.length === 0 ? (
              <p style={s.empty}>
                {tab === 0 ? 'No hay solicitudes pendientes.' :
                 tab === 1 ? 'No hay proveedores aprobados.' :
                 'Todas las empresas tienen solicitud enviada.'}
              </p>
            ) : (
              <>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Empresa', 'Razón social', 'NIT', 'Dominio', 'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.map((item, i) => {
                      const isSelected = selected?.empresa?.id === item.empresa?.id
                      return (
                        <tr
                          key={item.provId ?? item.empresa?.id}
                          onClick={() => { setSelected(item); setFeedback(null) }}
                          style={{
                            background: isSelected ? '#EEF1FB' : i % 2 === 0 ? '#fff' : '#F7F8FC',
                            cursor:     'pointer',
                            borderLeft: `3px solid ${isSelected ? '#06175D' : 'transparent'}`,
                          }}
                        >
                          <td style={{ ...s.td, fontWeight: 600 }}>{item.empresa?.nombre || '—'}</td>
                          <td style={s.td}>{item.empresa?.razonSocial || '—'}</td>
                          <td style={s.td}>{item.empresa?.nit || '—'}</td>
                          <td style={s.td}>{item.empresa?.dominio || '—'}</td>
                          <td style={s.td}>
                            {tab === 0 && <Chip color="#d97706" bg="#fffbeb">Pendiente</Chip>}
                            {tab === 1 && <Chip color="#16a34a" bg="#f0fdf4">Aprobado</Chip>}
                            {tab === 2 && <Chip color="#9599AE" bg="#F7F8FC">Sin solicitud</Chip>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <Paginacion
                  page={currentPage}
                  totalPages={totalPages}
                  totalElements={currentList.length}
                  pageSize={PAGE_SIZE}
                  onChange={changePage}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <DetailPanel
            item={selected}
            feedback={feedback}
            loading={actionLoading}
            onAprobar={    () => updateActivo(selected.provId, true)  }
            onDesaprobar={ () => updateActivo(selected.provId, false) }
            onClose={() => { setSelected(null); setFeedback(null) }}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Detail Panel ─────────────────────────────────────────────────────────── */

function DetailPanel({ item, feedback, loading, onAprobar, onDesaprobar, onClose }) {
  const { empresa, type, activo } = item

  const statusLabel = activo === true  ? 'Proveedor aprobado'
                    : activo === false ? 'Solicitud pendiente'
                    : 'Sin solicitud'
  const statusColor = activo === true  ? '#16a34a'
                    : activo === false ? '#d97706'
                    : '#9599AE'

  return (
    <div style={s.panel}>
      <div style={s.panelHead}>
        <div style={s.panelAvatar}>{empresa?.nombre?.charAt(0)?.toUpperCase() ?? 'E'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={s.panelNombre}>{empresa?.nombre ?? '—'}</p>
          <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>● {statusLabel}</span>
        </div>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      {feedback && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12,
          background: feedback.ok ? '#f0fdf4' : '#fef2f2',
          color:      feedback.ok ? '#16a34a'  : '#dc2626',
          border:     `1px solid ${feedback.ok ? '#bbf7d0' : '#fca5a5'}`,
        }}>{feedback.msg}</div>
      )}

      <div style={s.panelScroll}>
        <PanelSection number="1" title="Identificación Legal y Tributaria">
          <PanelRow label="Nombre comercial"            value={empresa?.nombre}      />
          <PanelRow label="Razón social"                 value={empresa?.razonSocial} />
          <PanelRow label="NIT / Identificación Fiscal"  value={empresa?.nit}         />
          <PanelRow label="Dominio"                      value={empresa?.dominio}     />
          <PanelRow label="Matrícula de Comercio"        value={null}                 />
          <PanelRow label="Registro FUNDAEMPRESA"        value={null}                 />
        </PanelSection>

        <PanelSection number="2" title="Representación Legal">
          <PanelRow label="Nombre del representante" value={null} />
          <PanelRow label="Cargo"                    value={null} />
          <PanelRow label="Tipo de documento"        value={null} />
          <PanelRow label="Número de documento"      value={null} />
        </PanelSection>

        <PanelSection number="3" title="Información Financiera y Bancaria">
          <PanelRow label="Banco"            value={null} />
          <PanelRow label="Número de cuenta" value={null} />
          <PanelRow label="Titular"          value={null} />
          <PanelRow label="Domicilio fiscal" value={null} />
        </PanelSection>
      </div>

      <div style={s.panelActions}>
        {type === 'proveedor' && !activo && (
          <button style={s.approveBtn} onClick={onAprobar} disabled={loading}>
            {loading ? 'Procesando...' : '✓ Aprobar como proveedor'}
          </button>
        )}
        {type === 'proveedor' && activo && (
          <button style={s.rejectBtn} onClick={onDesaprobar} disabled={loading}>
            {loading ? 'Procesando...' : '✕ Desactivar proveedor'}
          </button>
        )}
        {type === 'empresa' && (
          <p style={{ margin: 0, fontSize: 13, color: '#9599AE' }}>
            Esta empresa no ha enviado solicitud de verificación.
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function PanelSection({ number, title, children }) {
  return (
    <div style={s.pSection}>
      <div style={s.pSectionHead}>
        <span style={s.pSectionNum}>{number}</span>
        <p style={s.pSectionTitle}>{title}</p>
      </div>
      <div style={s.pGrid}>{children}</div>
    </div>
  )
}

function PanelRow({ label, value }) {
  const isEmpty = value == null || value === ''
  return (
    <div>
      <p style={s.pLabel}>{label}</p>
      <p style={{ ...s.pValue, color: isEmpty ? '#C4C7D6' : '#1A1D3B', fontStyle: isEmpty ? 'italic' : 'normal' }}>
        {isEmpty ? 'No proporcionado' : value}
      </p>
    </div>
  )
}

function Chip({ color, bg, children }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color }}>
      {children}
    </span>
  )
}

function Paginacion({ page, totalPages, totalElements, pageSize, onChange }) {
  return (
    <div style={s.pagination}>
      <span style={s.pageInfo}>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} de {totalElements}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={s.pageBtn} onClick={() => onChange(page - 1)} disabled={page === 0}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} style={{ ...s.pageBtn, ...(i === page ? s.pageBtnActive : {}) }} onClick={() => onChange(i)}>{i + 1}</button>
        ))}
        <button style={s.pageBtn} onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>›</button>
      </div>
    </div>
  )
}

/* ─── Styles ────────────────────────────────────────────────────────────────── */
const s = {
  tabBar:       { display: 'flex', gap: 4, marginBottom: '1rem', background: '#fff', border: '1px solid #DDE0EE', borderRadius: 10, padding: 4 },
  tab:          { flex: 1, padding: '8px 14px', border: 'none', borderRadius: 7, background: 'transparent', fontSize: 13, fontWeight: 500, color: '#9599AE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s' },
  tabActive:    { background: '#EEF1FB', color: '#06175D', fontWeight: 700 },
  tabBadge:     { padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#EEF1FB', color: '#9599AE' },
  tabBadgeActive:{ background: '#06175D', color: '#fff' },

  tableWrapper: { background: '#fff', border: '1px solid #DDE0EE', borderRadius: 10, overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:           { padding: '10px 14px', background: '#EEF1FB', color: '#06175D', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #DDE0EE', whiteSpace: 'nowrap' },
  td:           { padding: '10px 14px', color: '#1A1D3B', borderBottom: '1px solid #F0F2FA', whiteSpace: 'nowrap' },
  empty:        { padding: '2rem', color: '#9599AE', fontSize: 14, textAlign: 'center' },
  pagination:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #F0F2FA' },
  pageInfo:     { fontSize: 12, color: '#9599AE' },
  pageBtn:      { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: '#fff', color: '#9599AE', border: '1px solid #DDE0EE', borderRadius: 6, cursor: 'pointer' },
  pageBtnActive:{ background: '#06175D', color: '#fff', borderColor: '#06175D' },

  panel:        { width: 320, flexShrink: 0, background: '#fff', border: '1px solid #DDE0EE', borderRadius: 10, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)', overflow: 'hidden' },
  panelHead:    { display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', borderBottom: '1px solid #F0F2FA', flexShrink: 0 },
  panelAvatar:  { width: 42, height: 42, borderRadius: 10, background: '#06175D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 },
  panelNombre:  { margin: 0, fontWeight: 700, fontSize: 14, color: '#1A1D3B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  closeBtn:     { background: 'none', border: 'none', color: '#9599AE', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 4 },
  panelScroll:  { flex: 1, overflowY: 'auto', padding: '1rem' },

  pSection:     { marginBottom: '1.25rem' },
  pSectionHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' },
  pSectionNum:  { width: 22, height: 22, borderRadius: '50%', background: '#EEF1FB', color: '#06175D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 },
  pSectionTitle:{ margin: 0, fontWeight: 700, fontSize: 12, color: '#1A1D3B' },
  pGrid:        { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  pLabel:       { margin: 0, fontSize: 11, fontWeight: 600, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .4 },
  pValue:       { margin: '2px 0 0', fontSize: 13, fontWeight: 600 },

  panelActions: { padding: '1rem', borderTop: '1px solid #F0F2FA', flexShrink: 0 },
  approveBtn:   { width: '100%', padding: '10px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  rejectBtn:    { width: '100%', padding: '10px', background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
