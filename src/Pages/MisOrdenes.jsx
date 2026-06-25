import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const ESTADO_COLORS = {
  pendiente:  { bg: '#fef9c3', color: '#854d0e' },
  aprobado:   { bg: '#dcfce7', color: '#166534' },
  pagado:     { bg: '#dbeafe', color: '#1e40af' },
  cancelado:  { bg: '#fee2e2', color: '#991b1b' },
  rechazado:  { bg: '#f1f5f9', color: '#475569' },
}

export default function MisOrdenes() {
  const { session } = useAuth()
  const location = useLocation()

  const [ordenes, setOrdenes] = useState([])
  const [rawOrdenes, setRawOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [procesando, setProcesando] = useState(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardandoOrden, setGuardandoOrden] = useState(false)
  const [qrModal, setQrModal] = useState({ open: false, qrBase64: null, ordenId: null, loading: false, amount: null })

  const [skuBusqueda, setSkuBusqueda] = useState('')
  const [buscandoSku, setBuscandoSku] = useState(false)
  const [productoEncontrado, setProductoEncontrado] = useState(null)
  const [opcionesStock, setOpcionesStock] = useState([])
  const [opcionElegida, setOpcionElegida] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [productosOrden, setProductosOrden] = useState([])

  const [esperandoWebhook, setEsperandoWebhook] = useState(false)

  const stompClientRef = useRef(null)

  const showToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4500)
  }

  const fetchOrdenes = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/v1/ordenes-compra')
      const todas = data || []
      const filtradas = todas.filter(o => {
        if (session?.rol === 'proveedor') return o.idProveedor?.idEmpresa?.id === session?.id_empresa
        return o.idEmpresaCompradora?.id === session?.id_empresa
      })
      setRawOrdenes(filtradas)
      setOrdenes(filtradas.map(o => ({
        id_orden: o.id,
        fecha_creacion: o.fecha,
        proveedor: o.idProveedor?.idEmpresa?.nombre || o.nombreProveedor || '—',
        empresa_compradora: o.idEmpresaCompradora?.nombre || o.nombreEmpresaCompradora || '—',
        usuario_comprador: o.idUsuario?.nombre || o.nombreUsuario || '—',
        total: o.total || 0,
        estado_orden: o.idEstado || '—',
      })))
    } catch (e) {
      showToast(`Error cargando órdenes: ${e.message}`, 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchOrdenes() }, [session])

  useEffect(() => {
    const ps = location.state?.preselect
    if (!ps?.sku) return
    window.history.replaceState({}, document.title)
    limpiarFormulario()
    setMostrarForm(true)
    setSkuBusqueda(ps.sku)
    buscarProductoPorSku(ps.sku)
  }, [])

  useEffect(() => {
    if (!qrModal.open || !qrModal.ordenId) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate()
        stompClientRef.current = null
      }
      setEsperandoWebhook(false)
      return
    }

    const ordenId = qrModal.ordenId
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/websocket'

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 0,
      onConnect: () => {
        client.subscribe(`/paymenting/${ordenId}`, (msg) => {
          const status = (msg.body || '').toUpperCase()
          if (['PAID', 'COMPLETED', 'CONFIRMED', 'SUCCESS'].includes(status)) {
            client.deactivate()
            stompClientRef.current = null
            setEsperandoWebhook(false)
            setQrModal({ open: false, qrBase64: null, ordenId: null, loading: false, amount: null })
            cambiarEstado(ordenId, 'pagado', 'Pago QR confirmado por Stereum. Factura generada automáticamente.')
          }
        })
        setEsperandoWebhook(true)
      },
      onStompError: () => setEsperandoWebhook(false),
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
      stompClientRef.current = null
    }
  }, [qrModal.open, qrModal.ordenId])


  const cambiarEstado = async (id_orden, nuevoEstado, triggerDesc) => {
    const raw = rawOrdenes.find(o => o.id === id_orden)
    if (!raw) { showToast('No se encontró la orden.', 'error'); return }
    setProcesando(id_orden)
    try {
      await api.put(`/api/v1/ordenes-compra/${id_orden}`, {
        total: raw.total,
        fecha: raw.fecha,
        fechaOrden: raw.fechaOrden,
        idEstado: nuevoEstado,
        idProveedor: raw.idProveedor?.id,
        idEmpresaCompradora: raw.idEmpresaCompradora?.id,
        idSucursal: raw.idSucursal?.id,
        idUsuario: raw.idUsuario?.id,
      })
      showToast(`Orden "${nuevoEstado}". ${triggerDesc}`)
      fetchOrdenes()
    } catch (e) {
      showToast(`Error: ${e.message}`, 'error')
    }
    setProcesando(null)
  }

  const buscarProductoPorSku = async (skuOverride) => {
    const sku = (skuOverride ?? skuBusqueda).trim()
    if (!sku) { showToast('Escribe un SKU para buscar.', 'error'); return }
    setBuscandoSku(true)
    setProductoEncontrado(null)
    setOpcionesStock([])
    setOpcionElegida(null)
    setPrecioInfo(null)

    try {
      const [todosProductos, todosAlmacenes] = await Promise.all([
        api.get('/api/v1/products'),
        api.get('/api/v1/producto-almacen'),
      ])

      const producto = (todosProductos || []).find(p => p.sku === sku && p.activo)
      if (!producto) { showToast('No se encontró un producto activo con ese SKU.', 'error'); setBuscandoSku(false); return }

      const opciones = (todosAlmacenes || [])
        .filter(pa => pa.idProducto === producto.id && pa.activo && pa.stock > 0)
        .map(pa => ({
          idAlmacen: pa.idAlmacen,
          idProducto: pa.idProducto,
          stock: pa.stock,
          nombreAlmacen: pa.almacen?.nombre || '—',
          idProveedor: pa.almacen?.idProveedor?.id,
          nombreProveedor: pa.almacen?.idProveedor?.idEmpresa?.nombre || '—',
        }))

      setProductoEncontrado(producto)
      setOpcionesStock(opciones)
      if (opciones.length === 0) showToast('Producto encontrado, pero sin stock disponible.', 'error')
    } catch (e) {
      showToast(`Error buscando producto: ${e.message}`, 'error')
    }
    setBuscandoSku(false)
  }

  const limpiarBusquedaProducto = () => {
    setSkuBusqueda(''); setProductoEncontrado(null); setOpcionesStock([])
    setOpcionElegida(null); setCantidad(1)
  }

  const limpiarFormulario = () => { limpiarBusquedaProducto(); setProductosOrden([]) }
  const abrirFormulario = () => { limpiarFormulario(); setMostrarForm(true) }
  const cerrarFormulario = () => { limpiarFormulario(); setMostrarForm(false) }

  const agregarProductoAOrden = () => {
    if (!productoEncontrado || !opcionElegida) { showToast('Busca un SKU y elige un proveedor/almacén.', 'error'); return }
    const cantNum = Number(cantidad)
    if (!cantNum || cantNum <= 0) { showToast('La cantidad debe ser mayor a 0.', 'error'); return }
    if (cantNum > opcionElegida.stock) { showToast(`Supera el stock disponible (${opcionElegida.stock}).`, 'error'); return }

    if (productosOrden.length > 0) {
      const primero = productosOrden[0]
      if (primero.idAlmacen !== opcionElegida.idAlmacen || primero.idProveedor !== opcionElegida.idProveedor) {
        showToast('Todos los productos deben ser del mismo proveedor y almacén.', 'error'); return
      }
    }

    const existente = productosOrden.find(p => p.idProducto === productoEncontrado.id)
    if (existente) {
      const nueva = existente.cantidad + cantNum
      if (nueva > opcionElegida.stock) { showToast(`Stock insuficiente (${opcionElegida.stock}).`, 'error'); return }
      setProductosOrden(prev => prev.map(p => p.idProducto === productoEncontrado.id ? { ...p, cantidad: nueva } : p))
    } else {
      setProductosOrden(prev => [...prev, {
        idProducto: productoEncontrado.id,
        sku: productoEncontrado.sku,
        nombre: productoEncontrado.nombre,
        cantidad: cantNum,
        stock: opcionElegida.stock,
        idAlmacen: opcionElegida.idAlmacen,
        nombreAlmacen: opcionElegida.nombreAlmacen,
        idProveedor: opcionElegida.idProveedor,
        nombreProveedor: opcionElegida.nombreProveedor,
      }])
    }
    limpiarBusquedaProducto()
    showToast('Producto agregado a la orden.')
  }

  const quitarProductoDeOrden = (idProducto) => setProductosOrden(prev => prev.filter(p => p.idProducto !== idProducto))

  const crearOrden = async () => {
    if (!session?.id_empresa || !session?.id_sucursal) { showToast('Faltan datos de empresa o sucursal en la sesión.', 'error'); return }
    if (productosOrden.length === 0) { showToast('Agrega al menos un producto.', 'error'); return }

    const primer = productosOrden[0]
    const total = 0
    setGuardandoOrden(true)
    try {
      const orden = await api.post('/api/v1/ordenes-compra', {
        total,
        fecha: new Date().toISOString(),
        fechaOrden: new Date().toISOString().split('T')[0],
        idEstado: 'pendiente',
        idProveedor: primer.idProveedor,
        idEmpresaCompradora: session.id_empresa,
        idSucursal: session.id_sucursal,
        idUsuario: session.id,
      })

      await Promise.all(productosOrden.map(p => api.post('/api/v1/detalle-orden', {
        cantidad: p.cantidad,
        precioUnitario: 0,
        subtotal: 0,
        idOrden: orden.id,
        idProducto: p.idProducto,
        idAlmacen: p.idAlmacen,
      })))

      showToast('Orden creada correctamente. Estado inicial: pendiente.')
      cerrarFormulario()
      fetchOrdenes()
    } catch (e) {
      showToast(`Error creando orden: ${e.message}`, 'error')
    }
    setGuardandoOrden(false)
  }

  const cerrarQr = () => setQrModal({ open: false, qrBase64: null, ordenId: null, loading: false, amount: null })

  const abrirQR = async (orden) => {
    const raw = rawOrdenes.find(o => o.id === orden.id_orden)
    const amount = raw?.total ?? orden.total
    setQrModal({ open: true, qrBase64: null, ordenId: orden.id_orden, loading: true, amount })
    try {
      const res = await api.post('/api/v1/stereum/charge', {
        amount,
        orderId: orden.id_orden,
      })
      setQrModal(prev => ({ ...prev, qrBase64: res?.qr_base64 ?? null, loading: false }))
    } catch (e) {
      showToast(`Error generando QR: ${e.message}`, 'error')
      cerrarQr()
    }
  }

  const pagoCompletado = async () => {
    const { ordenId } = qrModal
    cerrarQr()
    await cambiarEstado(ordenId, 'pagado', 'Pago QR completado. Factura generada automáticamente.')
  }

  const formatBOB = (val) => Number(val).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })

  return (
    <div>
      <PageHeader
        title="Órdenes de compra"
        subtitle="Crea órdenes nuevas y cambia estados para disparar los triggers de la BD"
        action={
          <div style={styles.headerActions}>
            {session?.rol !== 'proveedor' && (
              <button onClick={abrirFormulario} style={styles.newBtn}>+ Añadir nueva orden</button>
            )}
            <button onClick={fetchOrdenes} style={styles.refreshBtn}>↺ Actualizar</button>
          </div>
        }
      />

      {toast && (
        <div style={{ ...styles.toast, background: toast.tipo === 'error' ? '#fef2f2' : '#f0fdf4', borderColor: toast.tipo === 'error' ? '#fca5a5' : '#86efac' }}>
          <span style={{ color: toast.tipo === 'error' ? '#dc2626' : '#16a34a' }}>{toast.msg}</span>
        </div>
      )}

      {mostrarForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalTitle}>Añadir nueva orden</p>
                <p style={styles.modalSub}>Busca productos por SKU, agrégalos y confirma.</p>
              </div>
              <button style={styles.closeBtn} onClick={cerrarFormulario}>×</button>
            </div>

            <div style={styles.autoInfo}>
              <div><span style={styles.autoLabel}>Empresa compradora</span><strong>{session?.nombreEmpresa || session?.idEmpresa?.nombre || '—'}</strong></div>
              <div><span style={styles.autoLabel}>Sucursal</span><strong>{session?.idSucursal?.nombre || '—'}</strong></div>
              <div><span style={styles.autoLabel}>Usuario</span><strong>{session?.nombre || '—'}</strong></div>
            </div>

            <div style={styles.searchBox}>
              <label style={styles.label}>Buscar producto por SKU</label>
              <div style={styles.searchRow}>
                <input style={styles.input} value={skuBusqueda} onChange={e => setSkuBusqueda(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarProductoPorSku()} placeholder="Ej: PROD-001" />
                <button style={styles.searchBtn} onClick={buscarProductoPorSku} disabled={buscandoSku}>
                  {buscandoSku ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {productoEncontrado && (
              <div style={styles.productCard}>
                <p style={styles.productTitle}>{productoEncontrado.sku} — {productoEncontrado.nombre}</p>
                <p style={styles.productDesc}>{productoEncontrado.descripcion || 'Sin descripción'}</p>
                <p style={styles.productUnit}>Unidad: {productoEncontrado.unidadMedida || '—'}</p>
              </div>
            )}

            {opcionesStock.length > 0 && (
              <div style={styles.stockBox}>
                <p style={styles.sectionTitle}>Disponible en:</p>
                <div style={styles.optionsGrid}>
                  {opcionesStock.map(opcion => {
                    const sel = opcionElegida?.idAlmacen === opcion.idAlmacen
                    return (
                      <button key={opcion.idAlmacen}
                        style={{ ...styles.optionCard, borderColor: sel ? 'var(--c-primary)' : 'var(--c-border-mid)', background: sel ? 'var(--c-primary-light)' : 'var(--c-bg)' }}
                        onClick={() => setOpcionElegida(opcion)}>
                        <span style={styles.optionProvider}>{opcion.nombreProveedor}</span>
                        <span style={styles.optionWarehouse}>Almacén: {opcion.nombreAlmacen}</span>
                        <span style={styles.optionStock}>Stock: {opcion.stock}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {opcionElegida && (
              <div style={styles.quantityBox}>
                <label style={styles.label}>Cantidad a comprar</label>
                <div style={styles.addRow}>
                  <div style={styles.qtyControl}>
                    <button type="button" style={styles.qtyStep}
                      onClick={e => { e.preventDefault(); setCantidad(c => Math.max(1, Number(c) - 1)) }}>−</button>
                    <input
                      style={styles.qtyInput}
                      type="number" min="1" max={opcionElegida.stock}
                      value={cantidad}
                      onChange={e => setCantidad(e.target.value)}
                      onWheel={e => e.currentTarget.blur()}
                    />
                    <button type="button" style={styles.qtyStep}
                      onClick={e => { e.preventDefault(); setCantidad(c => Math.min(opcionElegida.stock, Number(c) + 1)) }}>+</button>
                  </div>
                  <button style={styles.addBtn} onClick={agregarProductoAOrden}>Agregar producto</button>
                </div>
                <p style={styles.quantityHint}>Máximo: {opcionElegida.stock}</p>
              </div>
            )}

            {productosOrden.length > 0 && (
              <div style={styles.orderList}>
                <p style={styles.sectionTitle}>Productos en la orden</p>
                {productosOrden.map(p => (
                  <div key={p.idProducto} style={styles.orderItem}>
                    <div>
                      <strong>{p.sku}</strong> — {p.nombre}
                      <br />
                      <span style={{ fontSize: '12px', color: 'var(--c-muted)' }}>
                        Cant: {p.cantidad} · {p.nombreProveedor} · {p.nombreAlmacen}
                      </span>
                    </div>
                    <button style={styles.removeBtn} onClick={() => quitarProductoDeOrden(p.idProducto)}>Quitar</button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={cerrarFormulario}>Cancelar</button>
              <button style={styles.saveBtn} onClick={crearOrden} disabled={guardandoOrden || productosOrden.length === 0}>
                {guardandoOrden ? 'Creando...' : 'Crear orden'}
              </button>
            </div>
          </div>
        </div>
      )}


      {qrModal.open && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '380px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 1.25rem', fontSize: '18px', fontWeight: '700', color: 'var(--c-text)' }}>Pago con QR</p>
            {qrModal.loading ? (
              <p style={{ color: 'var(--c-muted)', margin: '2rem 0' }}>Generando QR...</p>
            ) : qrModal.qrBase64 ? (
              <>
                <img
                  src={`data:image/jpeg;base64,${qrModal.qrBase64}`}
                  alt="QR de pago"
                  style={{ width: '220px', height: '220px', margin: '0 auto 0.75rem', display: 'block', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                {qrModal.amount != null && (
                  <div style={{ margin: '0 auto 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--c-muted)', display: 'block', marginBottom: '2px' }}>Monto a pagar</span>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--c-text)' }}>{formatBOB(qrModal.amount)}</span>
                  </div>
                )}
                {esperandoWebhook ? (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600', margin: '0 0 4px' }}>Escaneá el QR con tu billetera</p>
                    <p style={{ fontSize: '12px', color: 'var(--c-muted)', margin: 0 }}>El pago se confirmará automáticamente</p>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Escuchando confirmación...</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--c-muted)', marginBottom: '1.5rem' }}>Escaneá el QR y luego confirmá el pago</p>
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button style={styles.cancelBtn} onClick={cerrarQr}>Cancelar</button>
                  {!esperandoWebhook && (
                    <button style={{ ...styles.saveBtn, background: '#16a34a' }} onClick={pagoCompletado}>
                      Pago completado
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#dc2626', marginBottom: '1rem' }}>No se pudo generar el QR.</p>
                <button style={styles.cancelBtn} onClick={cerrarQr}>Cerrar</button>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Cargando órdenes...</p>
      ) : ordenes.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No hay órdenes.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Empresa compradora</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o, i) => {
                const estilo = ESTADO_COLORS[o.estado_orden] || ESTADO_COLORS.pendiente
                return (
                  <tr key={o.id_orden || i} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)' }}>
                    <td style={styles.td}>{o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td style={styles.td}>{o.proveedor}</td>
                    <td style={styles.td}>{o.empresa_compradora}</td>
                    <td style={styles.td}>{o.usuario_comprador}</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{formatBOB(o.total)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: estilo.bg, color: estilo.color }}>{o.estado_orden}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        {session?.rol === 'proveedor' && o.estado_orden === 'pendiente' && (
                          <>
                            <button disabled={procesando === o.id_orden} onClick={() => cambiarEstado(o.id_orden, 'aprobado', 'Trigger T3: factura generada.')}
                              style={{ ...styles.actionBtn, background: '#dcfce7', color: '#166534' }}>Aprobar</button>
                            <button disabled={procesando === o.id_orden} onClick={() => cambiarEstado(o.id_orden, 'rechazado', 'Orden rechazada.')}
                              style={{ ...styles.actionBtn, background: '#f1f5f9', color: '#475569' }}>Rechazar</button>
                          </>
                        )}
                        {session?.rol !== 'proveedor' && o.estado_orden === 'aprobado' && (
                          <button disabled={procesando === o.id_orden}
                            onClick={() => abrirQR(o)}
                            style={{ ...styles.actionBtn, background: '#eff6ff', color: '#1e40af' }}>Pagar QR</button>
                        )}
                        {session?.rol !== 'proveedor' && (o.estado_orden === 'pendiente' || o.estado_orden === 'aprobado') && (
                          <button disabled={procesando === o.id_orden}
                            onClick={() => cambiarEstado(o.id_orden, 'cancelado', o.estado_orden === 'aprobado' ? 'Factura anulada y stock devuelto.' : 'Stock revertido.')}
                            style={{ ...styles.actionBtn, background: '#fee2e2', color: '#991b1b' }}>Cancelar</button>
                        )}
                        {(o.estado_orden === 'cancelado' || o.estado_orden === 'rechazado' || o.estado_orden === 'pagado') && <span style={styles.noActions}>Sin acciones</span>}
                        {session?.rol === 'proveedor' && o.estado_orden !== 'pendiente' && <span style={styles.noActions}>Sin acciones</span>}
                      </div>
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

const styles = {
  headerActions: { display: 'flex', gap: '8px' },
  newBtn: { background: 'var(--c-primary)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: '#fff', fontWeight: '600' },
  refreshBtn: { background: 'var(--c-bg)', border: '1px solid var(--c-border-mid)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--c-muted)' },
  toast: { border: '1px solid', borderRadius: '8px', padding: '12px 16px', marginBottom: '1rem', fontSize: '14px' },
  triggerInfo: { background: 'var(--c-primary-light)', border: '1px solid var(--c-border-mid)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  triggerTitle: { margin: '0 0 8px', fontWeight: '600', fontSize: '13px', color: 'var(--c-primary)' },
  triggerGrid: { display: 'flex', flexDirection: 'column', gap: '4px' },
  triggerItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--c-text)' },
  triggerBadge: { background: 'var(--c-primary)', color: '#fff', borderRadius: '4px', padding: '1px 7px', fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  tableWrap: { overflowX: 'auto', background: 'var(--c-bg)', borderRadius: '12px', border: '1px solid var(--c-border-mid)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thead: { background: 'var(--c-primary-light)' },
  th: { padding: '11px 14px', textAlign: 'left', fontWeight: '700', color: 'var(--c-primary)', borderBottom: '1px solid var(--c-border-mid)', whiteSpace: 'nowrap' },
  td: { padding: '10px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  badge: { padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  noActions: { color: 'var(--c-muted)', fontSize: '12px', fontWeight: '600' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(6,23,93,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' },
  modal: { background: 'var(--c-bg)', borderRadius: '16px', width: '100%', maxWidth: '800px', padding: '1.5rem', boxShadow: '0 20px 60px rgba(6,23,93,0.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--c-text)' },
  modalSub: { margin: '4px 0 0', fontSize: '13px', color: 'var(--c-muted)' },
  closeBtn: { border: 'none', background: 'var(--c-primary-light)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '20px', color: 'var(--c-muted)' },
  autoInfo: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'var(--c-bg-page)', border: '1px solid var(--c-border-mid)', borderRadius: '10px', padding: '12px', marginBottom: '1rem', fontSize: '13px' },
  autoLabel: { display: 'block', color: 'var(--c-muted)', fontSize: '11px', marginBottom: '3px' },
  searchBox: { marginBottom: '1rem' },
  searchRow: { display: 'grid', gridTemplateColumns: '1fr 110px', gap: '8px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--c-muted)', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--c-border-mid)', borderRadius: '8px', fontSize: '14px', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-input-bg)' },
  searchBtn: { background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  productCard: { background: 'var(--c-bg-page)', border: '1px solid var(--c-border-mid)', borderRadius: '10px', padding: '12px', marginBottom: '1rem' },
  productTitle: { margin: '0 0 4px', fontWeight: '700', color: 'var(--c-text)' },
  productDesc: { margin: '0 0 4px', fontSize: '13px', color: 'var(--c-muted)' },
  productUnit: { margin: 0, fontSize: '12px', color: 'var(--c-muted)' },
  stockBox: { marginTop: '1rem' },
  sectionTitle: { margin: '0 0 0.75rem', fontWeight: '700', fontSize: '14px', color: 'var(--c-text)' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  optionCard: { textAlign: 'left', border: '1.5px solid', borderRadius: '10px', padding: '10px', cursor: 'pointer', background: 'var(--c-bg)' },
  optionProvider: { display: 'block', fontWeight: '700', color: 'var(--c-text)', marginBottom: '4px' },
  optionWarehouse: { display: 'block', fontSize: '13px', color: 'var(--c-muted)', marginBottom: '3px' },
  optionStock: { display: 'block', fontSize: '12px', color: '#166534', fontWeight: '600' },
  quantityBox: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--c-border-mid)' },
  addRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  qtyControl: { display: 'flex', alignItems: 'center', border: '1.5px solid var(--c-border-mid)', borderRadius: '8px', overflow: 'hidden', background: 'var(--c-bg)' },
  qtyStep: { padding: '0 12px', height: '40px', background: 'var(--c-bg-subtle)', border: 'none', fontSize: '18px', fontWeight: '600', color: 'var(--c-primary)', cursor: 'pointer', lineHeight: 1, flexShrink: 0 },
  qtyInput: { width: '60px', padding: '10px 4px', border: 'none', borderLeft: '1.5px solid var(--c-border-mid)', borderRight: '1.5px solid var(--c-border-mid)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', textAlign: 'center', MozAppearance: 'textfield' },
  addBtn: { padding: '10px 14px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  quantityHint: { margin: '6px 0 0', color: 'var(--c-muted)', fontSize: '12px' },
  orderList: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--c-border-mid)' },
  orderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'var(--c-bg-page)', border: '1px solid var(--c-border-mid)', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '13px', color: 'var(--c-text)' },
  removeBtn: { border: 'none', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  modalActions: { marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  cancelBtn: { padding: '10px 16px', background: 'var(--c-bg)', border: '1.5px solid var(--c-border-mid)', color: 'var(--c-muted)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { padding: '10px 16px', background: 'var(--c-primary)', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}
