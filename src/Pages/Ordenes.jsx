import { useEffect, useState } from 'react'
import { api } from '../api/client'

const PAGE_SIZE = 15

export default function Ordenes() {
  const [ordenes,     setOrdenes]     = useState([])
  const [rawOrdenes,  setRawOrdenes]  = useState([])
  const [msg,         setMsg]         = useState('')
  const [page,        setPage]        = useState(0)
  const [totalPages,  setTotalPages]  = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchOrdenes = async (p = 0) => {
    try {
      const res = await api.get(`/api/v1/ordenes-compra/paged?page=${p}&size=${PAGE_SIZE}`)
      const data = res?.content ?? []
      setRawOrdenes(data)
      setOrdenes(data)
      setTotalPages(res?.totalPages ?? 0)
      setTotalElements(res?.totalElements ?? 0)
      setPage(p)
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    }
  }

  useEffect(() => { fetchOrdenes(0) }, [])

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
      fetchOrdenes(page)
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} de {totalElements}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => fetchOrdenes(page - 1)} disabled={page === 0}
              style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => fetchOrdenes(i)}
                style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer',
                  background: i === page ? '#0f172a' : '#fff', color: i === page ? '#fff' : '#333' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => fetchOrdenes(page + 1)} disabled={page >= totalPages - 1}
              style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}>›</button>
          </div>
        </div>
      )}
    </div>
  )
}
