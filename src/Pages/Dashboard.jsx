import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'

export default function Dashboard() {
  const { session } = useAuth()
  const isProveedor = session?.rol === 'proveedor'

  const [counts, setCounts] = useState({})
  const [tableData, setTableData] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [activeCard, setActiveCard] = useState(null)

  const cards = isProveedor
    ? [
        { key: 'ordenes',    label: 'Órdenes',          color: '#3b82f6', icon: '📦', path: '/api/v1/ordenes-compra' },
        { key: 'productos',  label: 'Productos',         color: '#8b5cf6', icon: '🏷️', path: '/api/v1/products' },
        { key: 'contratos',  label: 'Contratos tarifa',  color: '#10b981', icon: '📄', path: '/api/v1/contratos-tarifa' },
        { key: 'reglas',     label: 'Reglas tarifa',     color: '#f59e0b', icon: '📋', path: '/api/v1/tarifas-reglas' },
      ]
    : [
        { key: 'ordenes',    label: 'Órdenes',           color: '#3b82f6', icon: '📦', path: '/api/v1/ordenes-compra' },
        { key: 'facturas',   label: 'Facturas',          color: '#f59e0b', icon: '🧾', path: '/api/v1/facturas' },
        { key: 'contratos',  label: 'Contratos tarifa',  color: '#10b981', icon: '📄', path: '/api/v1/contratos-tarifa' },
        { key: 'productos',  label: 'Productos',         color: '#6366f1', icon: '🛍️', path: '/api/v1/products' },
      ]

  useEffect(() => {
    async function loadCounts() {
      const results = await Promise.allSettled(cards.map(c => api.get(c.path)))
      const obj = {}
      cards.forEach((c, i) => {
        obj[c.key] = results[i].status === 'fulfilled' ? (results[i].value?.length ?? 0) : '—'
      })
      setCounts(obj)
    }
    loadCounts()
  }, [])

  const loadCardData = async (card) => {
    setActiveCard(card.key)
    setTableLoading(true)
    try {
      const data = await api.get(card.path)
      setTableData(data || [])
    } catch {
      setTableData([])
    }
    setTableLoading(false)
  }

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${session?.nombre?.split(' ')[0] ?? 'usuario'}`}
        subtitle={`Panel de ${isProveedor ? 'proveedor' : 'empresa compradora'} · ${new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div style={styles.cardGrid}>
        {cards.map(c => (
          <button key={c.key} style={{ ...styles.card, borderTop: `3px solid ${c.color}` }} onClick={() => loadCardData(c)}>
            <span style={{ fontSize: '24px' }}>{c.icon}</span>
            <div style={{ ...styles.count, color: c.color }}>{counts[c.key] ?? '—'}</div>
            <div style={styles.cardLabel}>{c.label}</div>
            <div style={styles.cardHint}>Ver detalle →</div>
          </button>
        ))}
      </div>

      {activeCard && (
        <div style={styles.tableSection}>
          <div style={styles.tableHeader}>
            <p style={styles.tableTitle}>{cards.find(c => c.key === activeCard)?.label}</p>
            <button style={styles.closeBtn} onClick={() => setActiveCard(null)}>✕ Cerrar</button>
          </div>
          <DataTable data={tableData} loading={tableLoading} />
        </div>
      )}

      {!activeCard && (
        <div style={styles.hint}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
            Hacé click en una card para ver el detalle
          </p>
        </div>
      )}
    </div>
  )
}

const styles = {
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' },
  count: { fontSize: '32px', fontWeight: '700', lineHeight: 1 },
  cardLabel: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  cardHint: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' },
  tableSection: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' },
  tableTitle: { margin: 0, fontWeight: '700', fontSize: '15px', color: '#0f172a' },
  closeBtn: { background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', color: '#64748b', cursor: 'pointer' },
  hint: { background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' },
}
