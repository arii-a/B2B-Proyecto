import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([])
  const [rawOrdenes, setRawOrdenes] = useState([])
  const [msg, setMsg] = useState('')

  const fetchOrdenes = async () => {
    try {
      const data = await api.get('/api/v1/ordenes-compra')
      setRawOrdenes(data || [])
      setOrdenes(data || [])
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    }
  }

  useEffect(() => { fetchOrdenes() }, [])

  const cambiarEstado = async (orden, nuevoEstado) => {
    setMsg('')
    try {
      await api.put(`/api/v1/ordenes-compra/${orden.id}`, {
        total: orden.total,
        fecha: orden.fecha,
        fechaOrden: orden.fechaOrden,
        idEstado: nuevoEstado,
        idProveedor: orden.idProveedor?.id,
        idEmpresaCompradora: orden.idEmpresaCompradora?.id,
        idSucursal: orden.idSucursal?.id,
        idUsuario: orden.idUsuario?.id,
      })
      setMsg(`Orden actualizada a "${nuevoEstado}". Trigger ejecutado.`)
      fetchOrdenes()
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    }
  }

  return (
    <div>
      <h2>Órdenes — Triggers T2 y T3</h2>
      <p style={{ color: '#555' }}>
        <b>T2:</b> Cancelar una orden revierte el stock.<br />
        <b>T3:</b> Aprobar una orden genera una factura automáticamente.
      </p>
      {msg && <p style={{ background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '8px' }}>{msg}</p>}
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#e2e8f0' }}>
            <th style={{ padding: '8px' }}>ID Orden</th>
            <th style={{ padding: '8px' }}>Total</th>
            <th style={{ padding: '8px' }}>Estado</th>
            <th style={{ padding: '8px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o, i) => (
            <tr key={o.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
              <td style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#888' }}>{o.id}</td>
              <td style={{ padding: '6px 8px' }}>{Number(o.total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</td>
              <td style={{ padding: '6px 8px' }}>
                <span style={{
                  background: { pendiente: '#fef9c3', aprobado: '#dcfce7', cancelado: '#fee2e2', rechazado: '#e2e8f0' }[o.idEstado],
                  padding: '2px 8px', borderRadius: '999px', fontSize: '0.8rem'
                }}>{o.idEstado}</span>
              </td>
              <td style={{ padding: '6px 8px', display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => cambiarEstado(o, 'aprobado')}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                  Aprobar
                </button>
                <button onClick={() => cambiarEstado(o, 'cancelado')}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={() => cambiarEstado(o, 'rechazado')}
                  style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                  Rechazar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
