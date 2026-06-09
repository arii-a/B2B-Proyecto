import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const ESTADO_COLORS = {
  pendiente:  { bg: '#fef9c3', color: '#854d0e' },
  aprobado:   { bg: '#dcfce7', color: '#166534' },
  cancelado:  { bg: '#fee2e2', color: '#991b1b' },
  rechazado:  { bg: '#f1f5f9', color: '#475569' },
}

export default function MisOrdenes() {
  const { session } = useAuth()

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

  const [precioInfo, setPrecioInfo] = useState(null)
  const [cargandoPrecio, setCargandoPrecio] = useState(false)
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
            cambiarEstado(ordenId, 'aprobado', 'Pago QR confirmado por Stereum. Trigger T3: factura generada.')
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

  useEffect(() => {
    if (opcionElegida && productoEncontrado) buscarPreciosYDescuentos()
    else setPrecioInfo(null)
  }, [opcionElegida, cantidad, productoEncontrado])

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

  const buscarProductoPorSku = async () => {
    const sku = skuBusqueda.trim()
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

  const buscarPreciosYDescuentos = async () => {
    if (!opcionElegida || !productoEncontrado) return
    setCargandoPrecio(true)
    setPrecioInfo(null)

    const hoy = new Date().toISOString()
    const idProducto = productoEncontrado.id
    const idProveedorAlmacen = opcionElegida.idProveedor
    const idEmpresaCompradora = session?.id_empresa
    const cantidadNum = Number(cantidad) || 1

    try {
      const [preciosData, contratosData, tramosData, detallesData] = await Promise.all([
        api.get('/api/v1/precios-base'),
        api.get('/api/v1/contratos-tarifa'),
        api.get('/api/v1/tramos-tarifa'),
        api.get('/api/v1/contratos-detalle'),
      ])

      const precioRecord = (preciosData || []).find(p =>
        p.idProducto?.id === idProducto &&
        p.idProveedor?.id === idProveedorAlmacen &&
        p.vigenteDesde <= hoy &&
        (!p.vigenteHasta || p.vigenteHasta >= hoy)
      )
      const precioBase = precioRecord ? Number(precioRecord.precioBase) : null

      const contrato = (contratosData || []).find(c =>
        c.idEmpresa?.id === idEmpresaCompradora &&
        c.idProveedor?.id === idProveedorAlmacen &&
        c.activo &&
        c.vigenteDesde <= hoy &&
        (!c.vigenteHasta || c.vigenteHasta >= hoy)
      )

      let descuentoTarifa = 0, tipoTramo = null, nombreRegla = null
      if (contrato) {
        const idRegla = contrato.idRegla?.id
        nombreRegla = contrato.idRegla?.nombre || null
        const subtotalEstimado = precioBase != null ? precioBase * cantidadNum : 0
        const tramos = (tramosData || []).filter(t => t.idRegla?.id === idRegla)

        const tramoVolumen = tramos.filter(t => t.tipo === 'volumen').find(t =>
          cantidadNum >= Number(t.cantidadMinima) && (t.cantidadMaxima == null || cantidadNum <= Number(t.cantidadMaxima))
        )
        const tramoCosto = tramos.filter(t => t.tipo === 'costo').find(t =>
          subtotalEstimado >= Number(t.cantidadMinima) && (t.cantidadMaxima == null || subtotalEstimado <= Number(t.cantidadMaxima))
        )
        const mejorTramo = [tramoVolumen, tramoCosto].filter(Boolean).sort((a, b) => Number(b.porcentajeDesc) - Number(a.porcentajeDesc))[0]
        if (mejorTramo) { descuentoTarifa = Number(mejorTramo.porcentajeDesc); tipoTramo = mejorTramo.tipo }
      }

      let descuentoContrato = 0, origenContrato = null
      if (contrato) {
        const detalles = (detallesData || []).filter(d => d.idContrato?.id === contrato.id)
        const especifico = detalles.find(d => d.idProducto?.id === idProducto)
        const general = detalles.find(d => !d.idProducto)
        const elegido = especifico || general
        if (elegido) {
          descuentoContrato = Number(elegido.porcentajeDescuento)
          origenContrato = especifico ? `SKU ${productoEncontrado.sku}` : 'general del contrato'
        }
      }

      const descuentoTotal = descuentoTarifa + descuentoContrato
      const precioFinal = precioBase != null ? precioBase * (1 - descuentoTotal / 100) : null
      setPrecioInfo({ precioBase, descuentoTarifa, tipoTramo, nombreRegla, descuentoContrato, origenContrato, descuentoTotal, precioFinal })
    } catch (e) {
      showToast(`Error consultando precios: ${e.message}`, 'error')
    }
    setCargandoPrecio(false)
  }

  const limpiarBusquedaProducto = () => {
    setSkuBusqueda(''); setProductoEncontrado(null); setOpcionesStock([])
    setOpcionElegida(null); setCantidad(1); setPrecioInfo(null)
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
        precioBase: precioInfo?.precioBase ?? null,
        precioFinal: precioInfo?.precioFinal ?? null,
        descuentoTotal: precioInfo?.descuentoTotal ?? 0,
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
    const total = Math.round(
      productosOrden.reduce((sum, p) => sum + (p.precioFinal ?? p.precioBase ?? 0) * p.cantidad, 0) * 100
    ) / 100
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
        precioUnitario: p.precioFinal ?? p.precioBase ?? 0,
        subtotal: (p.precioFinal ?? p.precioBase ?? 0) * p.cantidad,
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
    await cambiarEstado(ordenId, 'aprobado', 'Pago QR completado. Trigger T3: factura generada.')
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
                        style={{ ...styles.optionCard, borderColor: sel ? '#1e293b' : '#e2e8f0', background: sel ? '#f8fafc' : '#fff' }}
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
                  <input style={styles.qtyInput} type="number" min="1" max={opcionElegida.stock} value={cantidad}
                    onChange={e => setCantidad(e.target.value)} />
                  <button style={styles.addBtn} onClick={agregarProductoAOrden}>Agregar producto</button>
                </div>
                <p style={styles.quantityHint}>Máximo: {opcionElegida.stock}</p>
              </div>
            )}

            {opcionElegida && (
              <div style={styles.precioBox}>
                {cargandoPrecio ? (
                  <p style={styles.precioLoading}>Consultando precios y descuentos...</p>
                ) : precioInfo ? (
                  <>
                    <p style={styles.precioTitulo}>Desglose de precio</p>
                    <div style={styles.precioGrid}>
                      <div style={styles.precioFila}>
                        <span style={styles.precioLabel}>Precio base unitario</span>
                        <span style={styles.precioValor}>
                          {precioInfo.precioBase != null ? formatBOB(precioInfo.precioBase) : <em style={{ color: '#94a3b8' }}>Sin precio configurado</em>}
                        </span>
                      </div>
                      {precioInfo.descuentoTarifa > 0 && (
                        <div style={{ ...styles.precioFila, ...styles.precioDescuento }}>
                          <span style={styles.precioLabel}>
                            Descuento tarifa
                            {precioInfo.tipoTramo && <span style={styles.tramoBadge}>{precioInfo.tipoTramo}</span>}
                            {precioInfo.nombreRegla && <span style={{ color: '#64748b', fontSize: '11px' }}> · {precioInfo.nombreRegla}</span>}
                          </span>
                          <span style={{ ...styles.precioValor, color: '#16a34a', fontWeight: '700' }}>−{precioInfo.descuentoTarifa}%</span>
                        </div>
                      )}
                      {precioInfo.descuentoContrato > 0 && (
                        <div style={{ ...styles.precioFila, ...styles.precioDescuento }}>
                          <span style={styles.precioLabel}>
                            Descuento contrato
                            {precioInfo.origenContrato && <span style={{ color: '#64748b', fontSize: '11px' }}> · {precioInfo.origenContrato}</span>}
                          </span>
                          <span style={{ ...styles.precioValor, color: '#16a34a', fontWeight: '700' }}>−{precioInfo.descuentoContrato}%</span>
                        </div>
                      )}
                      {precioInfo.precioFinal != null && (
                        <div style={{ ...styles.precioFila, background: '#f0fdf4', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
                          <span style={{ ...styles.precioLabel, fontWeight: '700', color: '#166534' }}>Precio final unitario</span>
                          <span style={{ ...styles.precioValor, color: '#166534', fontWeight: '800', fontSize: '16px' }}>{formatBOB(precioInfo.precioFinal)}</span>
                        </div>
                      )}
                      {precioInfo.precioBase != null && Number(cantidad) > 0 && (
                        <div style={{ ...styles.precioFila, background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
                          <span style={{ ...styles.precioLabel, fontWeight: '700', color: '#1e40af' }}>Subtotal ({cantidad} u.)</span>
                          <span style={{ ...styles.precioValor, color: '#1e40af', fontWeight: '800', fontSize: '16px' }}>
                            {formatBOB((precioInfo.precioFinal ?? precioInfo.precioBase) * Number(cantidad))}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {productosOrden.length > 0 && (
              <div style={styles.orderList}>
                <p style={styles.sectionTitle}>Productos en la orden</p>
                {productosOrden.map(p => {
                  const precioUnit = p.precioFinal ?? p.precioBase ?? null
                  const subtotal = precioUnit != null ? precioUnit * p.cantidad : null
                  return (
                    <div key={p.idProducto} style={styles.orderItem}>
                      <div>
                        <strong>{p.sku}</strong> — {p.nombre}
                        <br />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Cant: {p.cantidad} · {p.nombreProveedor} · {p.nombreAlmacen}
                        </span>
                        {precioUnit != null && (
                          <span style={{ display: 'block', fontSize: '12px', color: '#166534', fontWeight: '600', marginTop: '2px' }}>
                            {formatBOB(precioUnit)}/u
                            {p.descuentoTotal > 0 && <span style={{ color: '#16a34a' }}> (−{p.descuentoTotal}%)</span>}
                            {subtotal != null && <span style={{ color: '#0f172a', marginLeft: '8px' }}>= {formatBOB(subtotal)}</span>}
                          </span>
                        )}
                        {precioUnit == null && (
                          <span style={{ display: 'block', fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>Sin precio configurado</span>
                        )}
                      </div>
                      <button style={styles.removeBtn} onClick={() => quitarProductoDeOrden(p.idProducto)}>Quitar</button>
                    </div>
                  )
                })}

                {/* Total de la orden */}
                <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: '#166534' }}>Total de la orden</span>
                  <span style={{ fontWeight: '800', fontSize: '18px', color: '#166534' }}>
                    {formatBOB(productosOrden.reduce((sum, p) => sum + (p.precioFinal ?? p.precioBase ?? 0) * p.cantidad, 0))}
                  </span>
                </div>
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

      <div style={styles.triggerInfo}>
        <p style={styles.triggerTitle}>Flujo activo en esta pantalla</p>
        <div style={styles.triggerGrid}>
          <div style={styles.triggerItem}><span style={styles.triggerBadge}>Nuevo</span><span>Buscar SKU → agregar productos → crear orden pendiente</span></div>
          <div style={styles.triggerItem}><span style={styles.triggerBadge}>T2</span><span>Cancelar → revierte stock en almacén automáticamente</span></div>
          <div style={styles.triggerItem}><span style={styles.triggerBadge}>T3</span><span>Aprobar → genera factura pendiente automáticamente</span></div>
        </div>
      </div>

      {qrModal.open && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '380px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 1.25rem', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Pago con QR</p>
            {qrModal.loading ? (
              <p style={{ color: '#64748b', margin: '2rem 0' }}>Generando QR...</p>
            ) : qrModal.qrBase64 ? (
              <>
                <img
                  src={`data:image/jpeg;base64,${qrModal.qrBase64}`}
                  alt="QR de pago"
                  style={{ width: '220px', height: '220px', margin: '0 auto 0.75rem', display: 'block', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                {qrModal.amount != null && (
                  <div style={{ margin: '0 auto 1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Monto a pagar</span>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{formatBOB(qrModal.amount)}</span>
                  </div>
                )}
                {esperandoWebhook ? (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600', margin: '0 0 4px' }}>Escaneá el QR con tu billetera</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>El pago se confirmará automáticamente</p>
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Escuchando confirmación...</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem' }}>Escaneá el QR y luego confirmá el pago</p>
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
                  <tr key={o.id_orden || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={styles.td}>{o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-BO') : '—'}</td>
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
                        {session?.rol !== 'proveedor' && o.estado_orden === 'pendiente' && (
                          <button disabled={procesando === o.id_orden}
                            onClick={() => abrirQR(o)}
                            style={{ ...styles.actionBtn, background: '#eff6ff', color: '#1e40af' }}>Pagar QR</button>
                        )}
                        {session?.rol !== 'proveedor' && (o.estado_orden === 'pendiente' || o.estado_orden === 'aprobado') && (
                          <button disabled={procesando === o.id_orden}
                            onClick={() => cambiarEstado(o.id_orden, 'cancelado', o.estado_orden === 'aprobado' ? 'Factura anulada y stock devuelto.' : 'Stock revertido.')}
                            style={{ ...styles.actionBtn, background: '#fee2e2', color: '#991b1b' }}>Cancelar</button>
                        )}
                        {(o.estado_orden === 'cancelado' || o.estado_orden === 'rechazado') && <span style={styles.noActions}>Sin acciones</span>}
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
  newBtn: { background: '#1e293b', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: '#fff', fontWeight: '600' },
  refreshBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: '#475569' },
  toast: { border: '1px solid', borderRadius: '8px', padding: '12px 16px', marginBottom: '1rem', fontSize: '14px' },
  triggerInfo: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  triggerTitle: { margin: '0 0 8px', fontWeight: '600', fontSize: '13px', color: '#1e40af' },
  triggerGrid: { display: 'flex', flexDirection: 'column', gap: '4px' },
  triggerItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e3a8a' },
  triggerBadge: { background: '#1e40af', color: '#fff', borderRadius: '4px', padding: '1px 7px', fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  tableWrap: { overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thead: { background: '#f8fafc' },
  th: { padding: '11px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '10px 14px', color: '#334155', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  badge: { padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  noActions: { color: '#94a3b8', fontSize: '12px', fontWeight: '600' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' },
  modalSub: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
  closeBtn: { border: 'none', background: '#f1f5f9', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '20px', color: '#475569' },
  autoInfo: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '1rem', fontSize: '13px' },
  autoLabel: { display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '3px' },
  searchBox: { marginBottom: '1rem' },
  searchRow: { display: 'grid', gridTemplateColumns: '1fr 110px', gap: '8px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  searchBtn: { background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  productCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '1rem' },
  productTitle: { margin: '0 0 4px', fontWeight: '700', color: '#0f172a' },
  productDesc: { margin: '0 0 4px', fontSize: '13px', color: '#64748b' },
  productUnit: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  stockBox: { marginTop: '1rem' },
  sectionTitle: { margin: '0 0 0.75rem', fontWeight: '700', fontSize: '14px', color: '#0f172a' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  optionCard: { textAlign: 'left', border: '1.5px solid', borderRadius: '10px', padding: '10px', cursor: 'pointer', background: '#fff' },
  optionProvider: { display: 'block', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  optionWarehouse: { display: 'block', fontSize: '13px', color: '#475569', marginBottom: '3px' },
  optionStock: { display: 'block', fontSize: '12px', color: '#166534', fontWeight: '600' },
  quantityBox: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
  addRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  qtyInput: { width: '130px', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  addBtn: { padding: '10px 14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  quantityHint: { margin: '6px 0 0', color: '#64748b', fontSize: '12px' },
  precioBox: { marginTop: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' },
  precioLoading: { margin: 0, fontSize: '13px', color: '#64748b' },
  precioTitulo: { margin: '0 0 10px', fontWeight: '700', fontSize: '13px', color: '#0f172a' },
  precioGrid: { display: 'flex', flexDirection: 'column', gap: '6px' },
  precioFila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '13px' },
  precioDescuento: { background: '#f0fdf4', borderRadius: '6px', padding: '4px 8px' },
  precioLabel: { color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  precioValor: { fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' },
  tramoBadge: { background: '#1e40af', color: '#fff', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: '700' },
  orderList: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
  orderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '13px', color: '#334155' },
  removeBtn: { border: 'none', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  modalActions: { marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  cancelBtn: { padding: '10px 16px', background: '#fff', border: '1.5px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { padding: '10px 16px', background: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}
