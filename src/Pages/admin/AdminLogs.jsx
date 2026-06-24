import { useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const isoToDisplay = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}
const displayToISO = (s) => {
  const [d, m, y] = s.split('/')
  if (!d || !m || !y) return ''
  return `20${y.slice(-2)}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const hoy   = new Date().toISOString().split('T')[0]
const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

export default function AdminLogs() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [from, setFrom] = useState(isoToDisplay(hace30))
  const [to, setTo] = useState(isoToDisplay(hoy))
  const PAGE_SIZE = 10

  const cargar = async (p) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/logs?page=${p}&size=${PAGE_SIZE}&from=${displayToISO(from)}&to=${displayToISO(to)}`)
      setData(res.content ?? [])
      setTotalPages(res.totalPages ?? 0)
      setTotalElements(res.totalElements ?? 0)
    } catch {
      setData([])
    }
    setLoading(false)
  }

  const cambiarPagina = (p) => { setPage(p); cargar(p) }

  const buscar = () => { setPage(0); cargar(0) }

  return (
    <div>
      <PageHeader title="Logs del sistema" subtitle="Auditoría de actividad" />

      <div style={styles.filtros}>
        <div style={styles.filtroGroup}>
          <label style={styles.label}>Desde</label>
          <input type="text" placeholder="dd/mm/aa" maxLength={8} style={styles.input} value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div style={styles.filtroGroup}>
          <label style={styles.label}>Hasta</label>
          <input type="text" placeholder="dd/mm/aa" maxLength={8} style={styles.input} value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button style={styles.btn} onClick={buscar}>Buscar</button>
      </div>

      <div style={styles.tableWrapper}>
        {loading ? <p style={styles.empty}>Cargando...</p> : !data.length && !totalElements ? (
          <p style={styles.empty}>Presiona Buscar para cargar logs.</p>
        ) : data.length === 0 ? <p style={styles.empty}>Sin logs en ese rango.</p> : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>{['Nivel', 'Descripción', 'Fecha'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.map((l, i) => (
                  <tr key={l.id ?? i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--c-bg-subtle)' }}>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...levelColor(l.level) }}>{l.level}</span>
                    </td>
                    <td style={{ ...styles.td, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.descripcion}</td>
                    <td style={styles.td}>{l.createdDate ? new Date(l.createdDate).toLocaleString('es-BO') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginacion page={page} totalPages={totalPages} totalElements={totalElements} pageSize={PAGE_SIZE} onChange={cambiarPagina} />
          </>
        )}
      </div>
    </div>
  )
}

function levelColor(level) {
  const map = { ERROR: { background: '#fef2f2', color: '#b91c1c' }, WARN: { background: '#fffbeb', color: '#b45309' }, INFO: { background: '#f0fdf4', color: '#15803d' }, DEBUG: { background: '#eff6ff', color: '#1d4ed8' }, TRACE: { background: '#f5f3ff', color: '#6d28d9' } }
  return map[level] ?? { background: 'var(--c-primary-light)', color: 'var(--c-muted)' }
}

function Paginacion({ page, totalPages, totalElements, pageSize, onChange }) {
  return (
    <div style={styles.pagination}>
      <span style={styles.pageInfo}>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} de {totalElements}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={styles.pageBtn} onClick={() => onChange(page - 1)} disabled={page === 0}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} style={{ ...styles.pageBtn, ...(i === page ? styles.pageBtnActive : {}) }} onClick={() => onChange(i)}>{i + 1}</button>
        ))}
        <button style={styles.pageBtn} onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>›</button>
      </div>
    </div>
  )
}

const styles = {
  filtros: { display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' },
  filtroGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--c-muted)' },
  input: { padding: '8px 12px', border: '1.5px solid var(--c-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--c-text)' },
  btn: { padding: '8px 20px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  tableWrapper: { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '10px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: '700', textAlign: 'left', borderBottom: '1px solid var(--c-border)' },
  td: { padding: '9px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)' },
  badge: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' },
  empty: { padding: '2rem', color: 'var(--c-muted)', fontSize: '14px' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--c-border-light)' },
  pageInfo: { fontSize: '12px', color: 'var(--c-muted)' },
  pageBtn: { padding: '4px 10px', fontSize: '12px', fontWeight: '600', background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1px solid var(--c-border)', borderRadius: '6px', cursor: 'pointer' },
  pageBtnActive: { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },
}
