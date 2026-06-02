import { useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'

export default function TarifasProducto() {
  const [busqueda, setBusqueda] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const buscar = async () => {
    setLoading(true)
    setMsg('')
    try {
      const precios = await api.get('/api/v1/precios-base')
      const hoy = new Date().toISOString()
      const q = busqueda.trim().toLowerCase()

      const filtrados = (precios || [])
        .filter(p => {
          const vigente = (!p.vigenteHasta || p.vigenteHasta >= hoy) && p.vigenteDesde <= hoy
          if (!vigente) return false
          if (!q) return true
          const sku = p.idProducto?.sku?.toLowerCase() || ''
          const nombre = p.idProducto?.nombre?.toLowerCase() || ''
          return sku.includes(q) || nombre.includes(q)
        })
        .map(p => ({
          sku: p.idProducto?.sku || '—',
          producto: p.idProducto?.nombre || '—',
          proveedor: p.idProveedor?.idEmpresa?.nombre || p.idProveedor?.nombreEmpresa || '—',
          'precio base': Number(p.precioBase || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }),
          'vigente desde': p.vigenteDesde ? new Date(p.vigenteDesde).toLocaleDateString('es-BO') : '—',
          'vigente hasta': p.vigenteHasta ? new Date(p.vigenteHasta).toLocaleDateString('es-BO') : 'Sin vencimiento',
        }))

      setData(filtrados)
      if (filtrados.length === 0) setMsg('No se encontraron tarifas con ese criterio.')
    } catch (e) {
      setMsg(`Error buscando tarifas: ${e.message}`)
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader title="Tarifas por producto" subtitle="Consulta precios base públicos por SKU o nombre de producto" action={null} />

      <div style={styles.searchRow}>
        <input
          style={styles.input}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Buscar por SKU o nombre de producto"
        />
        <button style={styles.searchBtn} onClick={buscar}>Buscar</button>
      </div>

      {msg && <div style={styles.msg}>{msg}</div>}
      <DataTable data={data} loading={loading} emptyMsg="Busca un SKU o producto para ver tarifas." />
    </div>
  )
}

const styles = {
  searchRow: { display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px', marginBottom: '1rem' },
  input: { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' },
  searchBtn: { background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  msg: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#334155', fontSize: '13px' },
}
