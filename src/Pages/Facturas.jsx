import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const ESTADO_COLORS = {
  pagado:   { bg: '#dbeafe', color: '#1e40af' },
  pendiente:{ bg: '#fef9c3', color: '#854d0e' },
  anulado:  { bg: '#fee2e2', color: '#991b1b' },
  emitido:  { bg: '#dcfce7', color: '#166534' },
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Facturas() {
  const { session } = useAuth()
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchFacturas = async () => {
    setLoading(true)
    setMsg('')
    try {
      const data = await api.get('/api/v1/facturas')
      const todas = data || []
      const filtradas = todas.filter(f => {
        if (session?.rol === 'proveedor')
          return f.idOrden?.idProveedor?.idEmpresa?.id === session?.id_empresa
        return f.idOrden?.idEmpresaCompradora?.id === session?.id_empresa
      })
      setFacturas(filtradas)
    } catch (e) {
      setMsg(`Error cargando facturas: ${e.message}`)
    }
    setLoading(false)
  }

  useEffect(() => { fetchFacturas() }, [session])

  const abrirPdf = (id) => {
    const token = localStorage.getItem('b2b_token') || ''
    const url = `${API_URL}/api/v1/facturas/${id}/pdf`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('No se pudo generar el PDF')
        return res.blob()
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        window.open(blobUrl, '_blank')
      })
      .catch(e => setMsg(`Error: ${e.message}`))
  }

  const formatBOB = v => Number(v).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })
  const formatFecha = f => f ? new Date(f).toLocaleDateString('es-BO') : '—'

  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle={session?.rol === 'proveedor' ? 'Facturas de tus ventas' : 'Consulta tus facturas'}
        action={<button onClick={fetchFacturas} style={s.refreshBtn}>↺ Actualizar</button>}
      />
      {msg && <div style={s.msg}>{msg}</div>}

      {loading ? (
        <div style={s.empty}><div style={s.spinner} /><span style={{ color: 'var(--c-muted)' }}>Cargando...</span></div>
      ) : facturas.length === 0 ? (
        <p style={s.emptyText}>No hay facturas para mostrar.</p>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['ID', 'Fecha', 'Proveedor', 'Empresa Compradora', 'Total', 'Estado', 'Acciones'].map(col => (
                  <th key={col} style={s.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturas.map((f, i) => {
                const estado = f.idEstado || 'pendiente'
                const estilo = ESTADO_COLORS[estado] || ESTADO_COLORS.pendiente
                return (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)' }}>
                    <td style={s.td}><span style={s.idText}>{f.id?.substring(0, 8).toUpperCase()}</span></td>
                    <td style={s.td}>{formatFecha(f.fecha)}</td>
                    <td style={s.td}>{f.idOrden?.idProveedor?.idEmpresa?.nombre || '—'}</td>
                    <td style={s.td}>{f.idOrden?.idEmpresaCompradora?.nombre || '—'}</td>
                    <td style={{ ...s.td, fontWeight: '600' }}>{formatBOB(f.total)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: estilo.bg, color: estilo.color }}>{estado}</span>
                    </td>
                    <td style={s.td}>
                      <button style={s.pdfBtn} onClick={() => abrirPdf(f.id)}>
                        ↓ Ver PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s = {
  refreshBtn:  { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--c-muted)' },
  msg:         { background: 'var(--c-bg-page)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: 'var(--c-text)', fontSize: '13px' },
  tableWrap:   { overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--c-border)', background: 'var(--c-bg)' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th:          { padding: '11px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: '700', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--c-border)', textTransform: 'capitalize', fontSize: '12px', letterSpacing: '.3px' },
  td:          { padding: '10px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  badge:       { display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' },
  idText:      { fontFamily: 'monospace', fontSize: '12px', color: 'var(--c-muted)' },
  pdfBtn:      { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  empty:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '2.5rem', justifyContent: 'center' },
  emptyText:   { color: 'var(--c-muted)', padding: '2rem', fontSize: '13px', textAlign: 'center' },
  spinner:     { width: '18px', height: '18px', border: '2px solid var(--c-border)', borderTop: '2px solid var(--c-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
