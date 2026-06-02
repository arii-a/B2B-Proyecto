import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { useAuth } from '../AuthContext'

export default function Facturas() {
  const { session } = useAuth()

  const [facturas, setFacturas] = useState([])
  const [rawFacturas, setRawFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchFacturas = async () => {
    setLoading(true)
    setMsg('')
    try {
      const data = await api.get('/api/v1/facturas')
      const todas = data || []

      const filtradas = todas.filter(f => {
        if (session?.rol === 'proveedor') {
          return f.idOrden?.idProveedor?.idEmpresa?.id === session?.id_empresa
        }
        return f.idOrden?.idEmpresaCompradora?.id === session?.id_empresa
      })

      setRawFacturas(filtradas)
      setFacturas(filtradas.map(f => ({
        id: f.id,
        fecha: f.fecha ? new Date(f.fecha).toLocaleDateString('es-BO') : '—',
        proveedor: f.idOrden?.nombreProveedor || f.idOrden?.idProveedor?.idEmpresa?.nombre || '—',
        'empresa compradora': f.idOrden?.nombreEmpresaCompradora || f.idOrden?.idEmpresaCompradora?.nombre || '—',
        total: Number(f.total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }),
        estado: f.idEstado || '—',
      })))
    } catch (e) {
      setMsg(`Error cargando facturas: ${e.message}`)
    }
    setLoading(false)
  }

  useEffect(() => { fetchFacturas() }, [session])

  const actualizarEstado = async (idFactura, nuevoEstado) => {
    setMsg('')
    const factura = rawFacturas.find(f => f.id === idFactura)
    if (!factura) return
    try {
      await api.put(`/api/v1/facturas/${idFactura}`, {
        fecha: factura.fecha,
        total: factura.total,
        idEstado: nuevoEstado,
        idOrden: factura.idOrden?.id,
      })
      setMsg(nuevoEstado === 'pagada' ? 'Pago confirmado.' : 'Factura anulada.')
      fetchFacturas()
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    }
  }

  const dataConAcciones = facturas.map((f) => {
    const raw = rawFacturas.find(r => r.id === f.id)
    const estado = raw?.idEstado
    return {
      ...f,
      acciones:
        session?.rol === 'proveedor' && estado === 'pendiente' ? (
          <button style={styles.payBtn} onClick={() => actualizarEstado(f.id, 'pagada')}>Confirmar pago</button>
        ) : estado === 'pendiente' ? (
          <button style={styles.anularBtn} onClick={() => actualizarEstado(f.id, 'anulada')}>Anular</button>
        ) : (
          <span style={styles.noActions}>Sin acciones</span>
        ),
    }
  })

  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle={session?.rol === 'proveedor' ? 'Confirma pagos de facturas pendientes' : 'Consulta tus facturas pendientes, pagadas o anuladas'}
        action={<button onClick={fetchFacturas} style={styles.refreshBtn}>↺ Actualizar</button>}
      />
      {msg && <div style={styles.msg}>{msg}</div>}
      <DataTable data={dataConAcciones} loading={loading} emptyMsg="No hay facturas para mostrar." />
    </div>
  )
}

const styles = {
  refreshBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: '#475569' },
  msg: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#334155', fontSize: '13px' },
  payBtn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  anularBtn: { background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  noActions: { color: '#94a3b8', fontSize: '12px', fontWeight: '600' },
}
