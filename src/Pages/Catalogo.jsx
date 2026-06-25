import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/client'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const fmtMoney = (n) => n == null ? '—' : `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : null
const fmtNum   = (n) => n == null ? '∞' : Number(n).toLocaleString('es-BO')

const CAT_GRADIENTS = [
  ['var(--c-primary)','#1e40af'], ['#065f46','#047857'], ['#78350f','#b45309'],
  ['#4a1d96','#7c3aed'], ['#7f1d1d','#b91c1c'], ['#134e4a','#0f766e'],
  ['#1e3a5f','#1d4ed8'], ['#713f12','#a16207'], ['#14532d','#15803d'],
  ['#1e1b4b','#4338ca'],
]

export default function Catalogo() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const isEmpresa = session?.rol === 'empresa'

  const [productos,  setProductos]  = useState([])
  const [categorias, setCategorias] = useState([])
  const [contrMap,   setContrMap]   = useState({})
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [modal,      setModal]      = useState(null)

  // ── Carrito ──
  const [cart,        setCart]        = useState([])
  const [cartOpen,    setCartOpen]    = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [toast,       setToast]       = useState(null)

  const [currentPage, setCurrentPage] = useState(0)
  const ITEMS_PER_PAGE = 30

  // ── Filtros ──
  const [search,         setSearch]         = useState('')
  const [catFilters,     setCatFilters]     = useState(new Set())
  const [provFilters,    setProvFilters]    = useState(new Set())
  const [precioMin,      setPrecioMin]      = useState('')
  const [precioMax,      setPrecioMax]      = useState('')
  const [soloNegociados, setSoloNegociados] = useState(false)
  const [sortBy,         setSortBy]         = useState('nombre')

  useEffect(() => {
    if (location.state?.proveedorId) {
      setProvFilters(new Set([location.state.proveedorId]))
    }
  }, [location.state])

  useEffect(() => { cargar() }, [session])

  const cargar = async () => {
    setLoading(true); setError(null)
    try {
      const calls = [api.get('/api/v1/precios-base'), api.get('/api/v1/categorias')]
      if (isEmpresa) {
        calls.push(api.get('/api/v1/contratos-tarifa'))
        calls.push(api.get('/api/v1/contratos-detalle'))
        calls.push(api.get('/api/v1/tramos-tarifa'))
      }
      const [preciosRes, catRes, contratosRes, detallesRes, tramosRes] = await Promise.all(calls)
      const hoy = new Date()
      setCategorias(norm(catRes))

      let mapa = {}
      if (isEmpresa && contratosRes) {
        const contratos = norm(contratosRes).filter(c =>
          c.idEmpresa?.id === session?.id_empresa && c.activo &&
          new Date(c.vigenteDesde) <= hoy && (!c.vigenteHasta || new Date(c.vigenteHasta) >= hoy)
        )
        const detalles = norm(detallesRes)
        const tramos   = norm(tramosRes)
        contratos.forEach(c => {
          const provId = c.idProveedor?.id; if (!provId) return
          if (!mapa[provId] || new Date(c.vigenteDesde) > new Date(mapa[provId].contrato.vigenteDesde)) {
            mapa[provId] = {
              contrato: c,
              detalles: detalles.filter(d => d.idContrato?.id === c.id),
              tramos:   tramos.filter(t => t.idContrato === c.id).sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima)),
            }
          }
        })
      }
      setContrMap(mapa)

      const map = {}
      norm(preciosRes).forEach(p => {
        const prod = p.idProducto
        if (!prod?.activo || !p.idProveedor?.activo) return
        if (!map[prod.id]) {
          map[prod.id] = {
            id: prod.id, sku: prod.sku, nombre: prod.nombre,
            descripcion: prod.descripcion, unidad: prod.idUnidadMedida?.abreviatura ?? prod.idUnidadMedida?.nombre,
            categoria: prod.idCategoria?.nombre ?? 'Sin categoría',
            ofertas: [],
          }
        }
        map[prod.id].ofertas.push({
          id: p.id, precio: p.precioBase,
          vigenteDesde: p.vigenteDesde, vigenteHasta: p.vigenteHasta,
          proveedor: p.idProveedor,
        })
      })
      setProductos(Object.values(map))
    } catch (e) {
      setError(e.message || 'Error cargando el catálogo.')
    }
    setLoading(false)
  }

  const getPrecioEfectivo = (productId, proveedorId, precioBase) => {
    const cp = contrMap[proveedorId]; if (!cp) return null
    const detalle = cp.detalles.find(d => d.idProducto?.id === productId)
               ?? cp.detalles.find(d => !d.idProducto?.id && !d.idProducto)
    if (!detalle) return { precio: Number(precioBase), descuento: 0, tramos: cp.tramos, contrato: cp.contrato }
    const pct = Number(detalle.porcentajeDescuento)
    return { precio: Number(precioBase) * (1 - pct / 100), descuento: pct, tramos: cp.tramos, contrato: cp.contrato }
  }

  const getMejorPrecio = (p) => {
    let best = Infinity
    p.ofertas.forEach(o => {
      const ef = getPrecioEfectivo(p.id, o.proveedor?.id, o.precio)
      const pr = ef ? ef.precio : Number(o.precio)
      if (pr < best) best = pr
    })
    return best === Infinity ? 0 : best
  }

  const tieneNegociado = (p) =>
    p.ofertas.some(o => (getPrecioEfectivo(p.id, o.proveedor?.id, o.precio)?.descuento ?? 0) > 0)

  const catNames   = useMemo(() => [...new Set(productos.map(p => p.categoria))].sort(), [productos])
  const proveedores = useMemo(() => {
    const map = {}
    productos.forEach(p => p.ofertas.forEach(o => {
      if (o.proveedor?.id) map[o.proveedor.id] = o.proveedor?.idEmpresa?.nombre ?? `Prov #${o.proveedor.id}`
    }))
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]))
  }, [productos])

  const toggleSet = (set, setFn, val) => {
    setFn(prev => { const s = new Set(prev); s.has(val) ? s.delete(val) : s.add(val); return s })
  }

  const limpiarFiltros = () => {
    setCatFilters(new Set()); setProvFilters(new Set())
    setPrecioMin(''); setPrecioMax('')
    setSoloNegociados(false); setSearch('')
  }
  const hayFiltros = catFilters.size > 0 || provFilters.size > 0 || precioMin || precioMax || soloNegociados || search

  useEffect(() => setCurrentPage(0), [catFilters, provFilters, search, soloNegociados, precioMin, precioMax, sortBy])

  const filtrados = useMemo(() => productos
    .filter(p => catFilters.size === 0 || catFilters.has(p.categoria))
    .filter(p => provFilters.size === 0 || p.ofertas.some(o => provFilters.has(String(o.proveedor?.id))))
    .filter(p => { if (!search.trim()) return true; const q = search.toLowerCase(); return p.nombre.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) })
    .filter(p => { if (!soloNegociados) return true; return tieneNegociado(p) })
    .filter(p => {
      const pr = getMejorPrecio(p)
      if (precioMin !== '' && pr < Number(precioMin)) return false
      if (precioMax !== '' && pr > Number(precioMax)) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'precio-asc')  return getMejorPrecio(a) - getMejorPrecio(b)
      if (sortBy === 'precio-desc') return getMejorPrecio(b) - getMejorPrecio(a)
      return a.nombre.localeCompare(b.nombre)
    }),
    [productos, catFilters, provFilters, search, soloNegociados, precioMin, precioMax, sortBy]
  )

  // ── Cart helpers ──
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const addToCart = (item) => {
    setCart(prev => {
      const idx = prev.findIndex(x => x.key === item.key)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + item.cantidad }
        return next
      }
      return [...prev, item]
    })
    showToast(`"${item.productNombre}" agregado al carrito`)
  }

  const removeFromCart = (key) => setCart(prev => prev.filter(x => x.key !== key))

  const updateCantidad = (key, delta) => {
    setCart(prev => prev
      .map(x => x.key === key ? { ...x, cantidad: Math.max(1, x.cantidad + delta) } : x)
    )
  }

  const cartCount = cart.reduce((s, i) => s + i.cantidad, 0)
  const cartTotal = cart.reduce((s, i) => s + i.precioEfectivo * i.cantidad, 0)

  const confirmarPedido = async () => {
    if (!session?.id_empresa || !session?.id_sucursal) {
      showToast('Faltan datos de empresa o sucursal.', false); return
    }
    if (cart.length === 0) return
    setConfirmando(true)
    try {
      const byProvider = {}
      cart.forEach(item => {
        if (!byProvider[item.proveedorId]) byProvider[item.proveedorId] = []
        byProvider[item.proveedorId].push(item)
      })
      for (const [proveedorId, items] of Object.entries(byProvider)) {
        const total = Math.round(items.reduce((s, i) => s + i.precioEfectivo * i.cantidad, 0) * 100) / 100
        const orden = await api.post('/api/v1/ordenes-compra', {
          total,
          fecha: new Date().toISOString(),
          fechaOrden: new Date().toISOString().split('T')[0],
          idEstado: 'pendiente',
          idProveedor: proveedorId,
          idEmpresaCompradora: session.id_empresa,
          idSucursal: session.id_sucursal,
          idUsuario: session.id,
        })
        await Promise.all(items.map(item => api.post('/api/v1/detalle-orden', {
          cantidad: item.cantidad,
          precioUnitario: item.precioEfectivo,
          subtotal: Math.round(item.precioEfectivo * item.cantidad * 100) / 100,
          idOrden: orden.id,
          idProducto: item.productId,
          idAlmacen: null,
        })))
      }
      setCart([])
      setCartOpen(false)
      navigate('/mis-ordenes')
    } catch (e) {
      showToast(e.message || 'Error al crear el pedido.', false)
    }
    setConfirmando(false)
  }

  return (
    <div>
      {/* ── Hero search ── */}
      <div style={s.hero}>
        <div style={s.heroContent}>
          <p style={s.heroTitle}>Catálogo B2B</p>
          <p style={s.heroSub}>{productos.length} productos de proveedores verificados</p>
          <div style={s.heroSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9599AE" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              style={s.heroSearchInput}
              placeholder="¿Qué producto estás buscando?"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
          </div>
          {isEmpresa && Object.keys(contrMap).length > 0 && (
            <div style={s.heroBadge}>
              <span style={s.heroDot}/>
              Precios negociados activos con {Object.keys(contrMap).length} proveedor{Object.keys(contrMap).length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      {/* ── Toast (portal → fuera del árbol DOM del catálogo) ── */}
      {toast && createPortal(
        <div style={{ ...s.toast, background: toast.ok ? 'rgba(22,42,22,0.82)' : 'rgba(80,20,20,0.82)' }}>
          {toast.msg}
        </div>,
        document.body
      )}

      {/* ── Main layout ── */}
      <div style={s.layout}>
        {/* ── Sidebar filtros ── */}
        <aside style={s.sidebar}>
          <div style={s.sideHead}>
            <span style={s.sideTitle}>Filtros</span>
            {hayFiltros && <button style={s.clearFiltersBtn} onClick={limpiarFiltros}>Limpiar</button>}
          </div>

          <div style={s.filterSection}>
            <p style={s.filterLabel}>Categorías</p>
            {catNames.map(c => (
              <label key={c} style={s.checkRow}>
                <input type="checkbox" style={s.check}
                  checked={catFilters.has(c)}
                  onChange={() => toggleSet(catFilters, setCatFilters, c)} />
                <span style={s.checkText}>{c}</span>
                <span style={s.checkCount}>{productos.filter(p => p.categoria === c).length}</span>
              </label>
            ))}
          </div>

          <div style={s.filterSection}>
            <p style={s.filterLabel}>Precio (Bs.)</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input style={s.priceInput} type="number" min="0" placeholder="Mín"
                value={precioMin} onChange={e => setPrecioMin(e.target.value)} />
              <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>
              <input style={s.priceInput} type="number" min="0" placeholder="Máx"
                value={precioMax} onChange={e => setPrecioMax(e.target.value)} />
            </div>
          </div>

          {isEmpresa && (
            <div style={s.filterSection}>
              <label style={{ ...s.checkRow, paddingLeft: 0 }}>
                <input type="checkbox" style={s.check}
                  checked={soloNegociados}
                  onChange={e => setSoloNegociados(e.target.checked)} />
                <span style={{ ...s.checkText, color: '#15803d', fontWeight: 700 }}>Solo negociado</span>
              </label>
            </div>
          )}

          {proveedores.length > 0 && (
            <div style={s.filterSection}>
              <p style={s.filterLabel}>Proveedores</p>
              {proveedores.map(([id, nombre]) => (
                <label key={id} style={s.checkRow}>
                  <input type="checkbox" style={s.check}
                    checked={provFilters.has(id)}
                    onChange={() => toggleSet(provFilters, setProvFilters, id)} />
                  <span style={s.checkText}>{nombre}</span>
                </label>
              ))}
            </div>
          )}
        </aside>

        {/* ── Products area ── */}
        <div style={s.productsCol}>
          {/* controles fijos */}
          <div style={s.productsHeader}>
            <div style={s.resultsBar}>
              <p style={s.resultsCount}>
                {loading ? 'Cargando...' : `${filtrados.length} producto${filtrados.length !== 1 ? 's' : ''}`}
                {hayFiltros && !loading && <span style={s.filteredLabel}> · filtrado</span>}
              </p>
              <select style={s.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="nombre">Nombre A-Z</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
              </select>
            </div>
            <div style={s.pillRow}>
              <button style={{ ...s.pill, ...(catFilters.size === 0 ? s.pillActive : {}) }}
                onClick={() => setCatFilters(new Set())}>Todos</button>
              {catNames.map((c, i) => {
                const [c1] = CAT_GRADIENTS[i % CAT_GRADIENTS.length]
                const active = catFilters.has(c)
                return (
                  <button key={c}
                    style={{ ...s.pill, ...(active ? { background: c1, color: '#fff', borderColor: c1 } : {}) }}
                    onClick={() => setCatFilters(new Set(active ? [] : [c]))}>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* grid scrolleable */}
          <div style={s.productsScroll}>
            {loading ? (
              <div style={s.loadWrap}>
                {[...Array(8)].map((_, i) => <div key={i} style={s.skeleton} />)}
              </div>
            ) : filtrados.length === 0 ? (
              <div style={s.emptyWrap}>
                <div style={s.emptyIcon}>🔍</div>
                <p style={s.emptyTitle}>Sin resultados</p>
                <p style={s.emptySub}>Prueba con otros términos o ajusta los filtros.</p>
                {hayFiltros && <button style={s.emptyBtn} onClick={limpiarFiltros}>Limpiar filtros</button>}
              </div>
            ) : (
              <>
                <div style={s.grid}>
                  {filtrados.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map(p => {
                    const catIdx    = catNames.indexOf(p.categoria)
                    const [g1, g2]  = CAT_GRADIENTS[catIdx % CAT_GRADIENTS.length]
                    const negociado = isEmpresa && tieneNegociado(p)
                    const precioEf  = getMejorPrecio(p)
                    const precioLista = Math.min(...p.ofertas.map(o => Number(o.precio)))
                    const bestOferta  = [...p.ofertas].sort((a, b) => {
                      const ea = getPrecioEfectivo(p.id, a.proveedor?.id, a.precio)
                      const eb = getPrecioEfectivo(p.id, b.proveedor?.id, b.precio)
                      return (ea?.precio ?? Number(a.precio)) - (eb?.precio ?? Number(b.precio))
                    })[0]
                    const bestEf   = bestOferta ? getPrecioEfectivo(p.id, bestOferta.proveedor?.id, bestOferta.precio) : null
                    const cartItem = cart.find(i => i.key === `${p.id}-${bestOferta?.proveedor?.id}`)
                    const cartQty  = cartItem?.cantidad ?? 0

                    return (
                      <div key={p.id} style={{ ...s.card, ...(negociado ? s.cardNeg : {}) }}>
                        <div style={{ ...s.imgArea, background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                          onClick={() => setModal(p)}>
                          <span style={s.imgLetter}>{p.nombre.charAt(0).toUpperCase()}</span>
                          {negociado && <span style={s.negBadge}>✓ Neg.</span>}
                        </div>

                        <div style={s.cardBody} onClick={() => setModal(p)}>
                          <span style={{ ...s.catPill, background: g1 + '18', color: g1 }}>{p.categoria}</span>
                          <p style={s.cardNombre}>{p.nombre}</p>

                          <div style={s.priceRow}>
                            <div>
                              {negociado && precioEf < precioLista && (
                                <p style={s.strikePrice}>{fmtMoney(precioLista)}</p>
                              )}
                              <p style={{ ...s.mainPrice, ...(negociado ? s.mainPriceNeg : {}) }}>
                                {fmtMoney(precioEf)}
                              </p>
                              <p style={s.perUnit}>/ {p.unidad || 'unidad'}</p>
                            </div>

                            {isEmpresa && bestOferta && (
                              <button
                                style={{ ...s.ctaBtn, ...(negociado ? s.ctaBtnNeg : {}), ...(cartQty > 0 ? s.ctaBtnActive : {}) }}
                                onClick={e => {
                                  e.stopPropagation()
                                  addToCart({
                                    key: `${p.id}-${bestOferta.proveedor?.id}`,
                                    productId: p.id, productNombre: p.nombre,
                                    productSku: p.sku, productUnidad: p.unidad,
                                    proveedorId: bestOferta.proveedor?.id,
                                    proveedorNombre: bestOferta.proveedor?.idEmpresa?.nombre ?? 'Proveedor',
                                    precioBase: Number(bestOferta.precio),
                                    precioEfectivo: bestEf?.precio ?? Number(bestOferta.precio),
                                    descuento: bestEf?.descuento ?? 0,
                                    cantidad: 1,
                                  })
                                }}>
                                {cartQty > 0 ? cartQty : '+'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Paginación ── */}
                {filtrados.length > ITEMS_PER_PAGE && (
                  <div style={s.pagination}>
                    <button style={s.pageBtn} disabled={currentPage === 0}
                      onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                    {Array.from({ length: Math.ceil(filtrados.length / ITEMS_PER_PAGE) }, (_, i) => (
                      <button key={i}
                        style={{ ...s.pageBtn, ...(i === currentPage ? s.pageBtnActive : {}) }}
                        onClick={() => setCurrentPage(i)}>
                        {i + 1}
                      </button>
                    ))}
                    <button style={s.pageBtn}
                      disabled={currentPage >= Math.ceil(filtrados.length / ITEMS_PER_PAGE) - 1}
                      onClick={() => setCurrentPage(p => p + 1)}>›</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Modal ── */}
      {modal && (
        <ProductModal
          product={modal} onClose={() => setModal(null)}
          catNames={catNames} getPrecioEfectivo={getPrecioEfectivo}
          isEmpresa={isEmpresa} cart={cart} addToCart={addToCart}
        />
      )}

      {/* ── Floating cart button ── */}
      {isEmpresa && (
        <button style={s.cartFab} onClick={() => setCartOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span style={s.cartFabBadge}>{cartCount}</span>}
        </button>
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart} removeFromCart={removeFromCart} updateCantidad={updateCantidad}
          cartTotal={cartTotal} onClose={() => setCartOpen(false)}
          confirmarPedido={confirmarPedido} confirmando={confirmando}
        />
      )}
    </div>
  )
}

/* ─── Cart Popup ─────────────────────────────────────────────────────────── */
function CartDrawer({ cart, removeFromCart, updateCantidad, cartTotal, onClose, confirmarPedido, confirmando }) {
  return (
    <div style={s.cartPopup}>
      <div style={s.cartDHead}>
        <span style={s.cartDTitle}>Carrito</span>
        <button style={s.cartDClose} onClick={onClose}>✕</button>
      </div>

      {cart.length === 0 ? (
        <p style={{ margin: '16px 0', fontSize: 13, color: 'var(--c-muted)', textAlign: 'center' }}>Vacío</p>
      ) : (
        <>
          <div style={s.cartDItems}>
            {cart.map(item => (
              <div key={item.key} style={s.cartDItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.cartDItemNombre}>{item.productNombre}</p>
                  <p style={s.cartDItemProv}>{item.proveedorNombre}</p>
                </div>
                <div style={s.cartDStepper}>
                  <button style={s.cartDStep} onClick={() => updateCantidad(item.key, -1)}>−</button>
                  <span style={s.cartDQty}>{item.cantidad}</span>
                  <button style={s.cartDStep} onClick={() => updateCantidad(item.key, +1)}>+</button>
                </div>
                <button style={s.cartDRemove} onClick={() => removeFromCart(item.key)}>✕</button>
              </div>
            ))}
          </div>
          <div style={s.cartDFooter}>
            <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>Total</span>
            <span style={s.cartDTotalAmt}>{fmtMoney(cartTotal)}</span>
          </div>
          <button style={s.cartDConfirm} onClick={confirmarPedido} disabled={confirmando}>
            {confirmando ? 'Creando...' : 'Confirmar pedido →'}
          </button>
        </>
      )}
    </div>
  )
}

/* ─── Product Modal ────────────────────────────────────────────────────────── */
function ProductModal({ product, onClose, catNames, getPrecioEfectivo, isEmpresa, cart, addToCart }) {
  const catIdx       = catNames.indexOf(product.categoria)
  const [g1, g2]     = CAT_GRADIENTS[catIdx % CAT_GRADIENTS.length]
  const ofertasOrd   = [...product.ofertas].sort((a, b) => Number(a.precio) - Number(b.precio))
  const ofertasEnrich = ofertasOrd
    .map(o => ({ ...o, ef: getPrecioEfectivo(product.id, o.proveedor?.id, o.precio) }))
    .sort((a, b) => (a.ef?.precio ?? Number(a.precio)) - (b.ef?.precio ?? Number(b.precio)))

  const [qtys, setQtys] = useState(() => {
    const init = {}
    ofertasEnrich.forEach(o => { init[o.id] = 1 })
    return init
  })

  const inCartKeys = new Set(cart.map(i => i.key))

  const handleAdd = (o) => {
    const ef  = o.ef
    const key = `${product.id}-${o.proveedor?.id}`
    addToCart({
      key,
      productId:      product.id,
      productNombre:  product.nombre,
      productSku:     product.sku,
      productUnidad:  product.unidad,
      proveedorId:    o.proveedor?.id,
      proveedorNombre: o.proveedor?.idEmpresa?.nombre ?? 'Proveedor',
      precioBase:      Number(o.precio),
      precioEfectivo:  ef?.precio ?? Number(o.precio),
      descuento:       ef?.descuento ?? 0,
      cantidad:        qtys[o.id] ?? 1,
    })
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ ...s.modalHero, background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
          <div style={{ flex: 1 }}>
            <span style={s.modalCatTag}>{product.categoria}</span>
            <h2 style={s.modalNombre}>{product.nombre}</h2>
            {product.descripcion && <p style={s.modalDescHero}>{product.descripcion}</p>}
            <p style={s.modalMeta}>{product.sku ? `SKU: ${product.sku}` : ''}{product.sku && product.unidad ? ' · ' : ''}{product.unidad ? product.unidad : ''}</p>
          </div>
          <button style={s.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.modalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ofertasEnrich.map((o, i) => {
              const nombre      = o.proveedor?.idEmpresa?.nombre ?? 'Proveedor'
              const ef          = o.ef
              const hasContract = ef && ef.descuento > 0
              const isFirst     = i === 0
              const itemKey     = `${product.id}-${o.proveedor?.id}`
              const inCart      = inCartKeys.has(itemKey)

              return (
                <div key={o.id} style={{ ...s.ofertaRow, ...(isFirst && !hasContract ? s.ofertaRowBest : {}), ...(hasContract ? s.ofertaRowContract : {}) }}>
                  {isFirst && !hasContract && <span style={s.bestBadge}>Mejor precio</span>}
                  {hasContract && <span style={s.contractBadge}>Tu precio negociado</span>}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ ...s.provAvatar, background: g1 }}>{nombre.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={s.provNombre}>{nombre}</p>
                      {(fmtDate(o.vigenteDesde) || fmtDate(o.vigenteHasta)) && (
                        <p style={s.provVigencia}>
                          Vigente: {fmtDate(o.vigenteDesde) ?? '—'}
                          {fmtDate(o.vigenteHasta) ? ` → ${fmtDate(o.vigenteHasta)}` : ' → sin vencimiento'}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {hasContract ? (
                        <>
                          <p style={s.precioTachado}>{fmtMoney(o.precio)}</p>
                          <p style={s.precioContract}>{fmtMoney(ef.precio)}</p>
                          <p style={s.descuentoBadge}>−{ef.descuento}% contrato</p>
                        </>
                      ) : (
                        <>
                          <p style={s.ofertaPrecio}>{fmtMoney(o.precio)}</p>
                          <p style={{ fontSize: 10, color: 'var(--c-muted)', margin: 0 }}>/ {product.unidad || 'unidad'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {hasContract && (
                    <div style={s.desglose}>
                      <p style={s.desgloseTitle}>Desglose:</p>
                      <div style={s.desgloseRow}><span>Precio lista</span><span>{fmtMoney(o.precio)}</span></div>
                      <div style={s.desgloseRow}>
                        <span>Descuento contractual (−{ef.descuento}%)</span>
                        <span style={{ color: '#16a34a' }}>−{fmtMoney(Number(o.precio) * ef.descuento / 100)}</span>
                      </div>
                      <div style={{ ...s.desgloseRow, fontWeight: 700, borderTop: '1px solid #D1FAE5', paddingTop: 6, marginTop: 2 }}>
                        <span>Tu precio / {product.unidad || 'unidad'}</span>
                        <span style={{ color: '#065f46', fontSize: 15 }}>{fmtMoney(ef.precio)}</span>
                      </div>
                    </div>
                  )}

                  {ef && ef.tramos.length > 0 && (
                    <div style={s.tramosSection}>
                      <p style={s.tramosSectionTitle}>Descuentos por volumen/costo del pedido:</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {ef.tramos.map((t, ti) => (
                          <div key={ti} style={s.tramoMiniChip}>
                            <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>
                              {t.tipo === 'volumen' ? '📦' : '💰'} {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima)}{t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>−{t.porcentajeDesc}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Cantidad + Agregar al carrito ── */}
                  {isEmpresa ? (
                    <div style={s.addCartRow}>
                      <div style={s.modalStepper}>
                        <button style={s.modalStepBtn}
                          onClick={() => setQtys(q => ({ ...q, [o.id]: Math.max(1, (q[o.id] ?? 1) - 1) }))}>−</button>
                        <input
                          type="number" min="1"
                          style={s.modalQtyInput}
                          value={qtys[o.id] ?? 1}
                          onChange={e => setQtys(q => ({ ...q, [o.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        />
                        <button style={s.modalStepBtn}
                          onClick={() => setQtys(q => ({ ...q, [o.id]: (q[o.id] ?? 1) + 1 }))}>+</button>
                        <span style={s.modalStepUnit}>{product.unidad || 'und'}</span>
                      </div>
                      <button
                        style={{ ...s.addCartBtn, background: inCart ? '#15803d' : g1 }}
                        onClick={() => handleAdd(o)}
                      >
                        {inCart ? '✓ Agregar más' : '+ Agregar al carrito'}
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--c-muted)', textAlign: 'center' }}>
                      Inicia sesión como empresa para hacer pedidos
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  hero:          { background: 'linear-gradient(135deg, var(--c-primary) 0%, #1e3a8a 60%, #1d4ed8 100%)', borderRadius: 16, padding: '2rem', marginBottom: '1.25rem' },
  heroContent:   { maxWidth: 640 },
  heroTitle:     { margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#fff' },
  heroSub:       { margin: '0 0 1rem', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  heroSearch:    { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-bg)', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  heroSearchInput:{ border: 'none', outline: 'none', fontSize: 14, color: 'var(--c-text)', flex: 1, background: 'transparent' },
  clearBtn:      { border: 'none', background: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 14, padding: 0 },
  heroBadge:     { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: '0.75rem', fontSize: 12, color: '#86efac', fontWeight: 600 },
  heroDot:       { width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 },

  errorBanner:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 },

  toast:         { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '7px 18px', borderRadius: 20, fontSize: 12, fontWeight: 500, zIndex: 2000, color: '#fff', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', pointerEvents: 'none' },

  layout:        { display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', alignItems: 'start' },

  sidebar:       { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '1rem', position: 'sticky', top: 16, maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', boxShadow: '0 1px 4px rgba(6,23,93,0.06)' },
  productsCol:   { display: 'flex', flexDirection: 'column', minWidth: 0 },
  productsHeader:{ position: 'sticky', top: 0, background: 'var(--c-bg-page)', zIndex: 10, paddingBottom: 8 },
  productsScroll:{ flex: 1 },
  sideHead:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sideTitle:     { fontSize: 14, fontWeight: 800, color: 'var(--c-text)' },
  clearFiltersBtn:{ background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 },
  filterSection: { borderTop: '1px solid var(--c-border-light)', paddingTop: '0.75rem', marginBottom: '0.75rem' },
  filterLabel:   { margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 },
  checkRow:      { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12, color: 'var(--c-text)' },
  check:         { accentColor: 'var(--c-primary)', width: 14, height: 14, flexShrink: 0 },
  checkText:     { flex: 1 },
  checkCount:    { fontSize: 10, color: 'var(--c-muted)', background: 'var(--c-bg-page)', borderRadius: 10, padding: '1px 6px' },
  priceInput:    { flex: 1, padding: '6px 8px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 12, color: 'var(--c-text)', outline: 'none', minWidth: 0 },

  resultsBar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  resultsCount:  { fontSize: 13, fontWeight: 600, color: 'var(--c-text)' },
  filteredLabel: { color: 'var(--c-muted)', fontWeight: 400 },
  sortSelect:    { border: '1.5px solid var(--c-border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--c-text)', outline: 'none', cursor: 'pointer', background: 'var(--c-bg)' },

  pillRow:       { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' },
  pill:          { padding: '5px 12px', border: '1.5px solid var(--c-border)', borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', background: 'var(--c-bg)', cursor: 'pointer', whiteSpace: 'nowrap' },
  pillActive:    { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },

  loadWrap:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' },
  skeleton:      { height: 180, background: 'linear-gradient(90deg, var(--c-bg-page) 25%, var(--c-border) 50%, var(--c-bg-page) 75%)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' },

  emptyWrap:     { textAlign: 'center', padding: '4rem 2rem', background: 'var(--c-bg)', borderRadius: 14, border: '1px solid var(--c-border)' },
  emptyIcon:     { fontSize: 40, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 },
  emptySub:      { fontSize: 13, color: 'var(--c-muted)', marginBottom: 16 },
  emptyBtn:      { padding: '8px 20px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },

  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' },
  card:          { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow .15s', boxShadow: '0 1px 4px rgba(6,23,93,0.06)' },
  cardNeg:       { border: '1px solid #86efac' },
  imgArea:       { height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  imgLetter:     { fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.3)', userSelect: 'none' },
  negBadge:      { position: 'absolute', top: 6, left: 6, background: '#16a34a', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 20 },
  cardBody:      { padding: '0.65rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  catPill:       { fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 20, display: 'inline-block', textTransform: 'uppercase', letterSpacing: .3, alignSelf: 'flex-start' },
  cardNombre:    { margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--c-text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  priceRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 4 },
  strikePrice:   { margin: 0, fontSize: 9, color: 'var(--c-muted)', textDecoration: 'line-through', lineHeight: 1 },
  mainPrice:     { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--c-primary)', lineHeight: 1 },
  mainPriceNeg:  { color: '#15803d' },
  perUnit:       { margin: 0, fontSize: 9, color: 'var(--c-muted)' },
  ctaBtn:        { minWidth: 24, height: 24, borderRadius: 12, background: 'var(--c-primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: '0 6px' },
  ctaBtnNeg:     { background: '#15803d' },
  ctaBtnActive:  { background: '#1e40af', minWidth: 28 },

  pagination:    { display: 'flex', justifyContent: 'center', gap: 4, marginTop: '1.25rem', paddingBottom: '0.5rem' },
  pageBtn:       { minWidth: 30, height: 30, borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pageBtnActive: { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },

  // ── Cart FAB ──
  cartFab:       { position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(6,23,93,0.3)', zIndex: 900 },
  cartFabBadge:  { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--c-bg)' },

  // ── Cart Popup ──
  cartPopup:     { position: 'fixed', bottom: 90, right: 28, width: 290, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, boxShadow: '0 8px 32px rgba(6,23,93,0.18)', zIndex: 960, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh' },
  cartDHead:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cartDTitle:    { margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--c-text)' },
  cartDClose:    { background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1 },
  cartDItems:    { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  cartDItem:     { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--c-border-light)' },
  cartDItemNombre:{ margin: 0, fontWeight: 600, fontSize: 12, color: 'var(--c-text)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cartDItemProv: { margin: 0, fontSize: 10, color: 'var(--c-muted)' },
  cartDRemove:   { background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1, flexShrink: 0 },
  cartDStepper:  { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
  cartDStep:     { width: 22, height: 22, borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-bg-page)', color: 'var(--c-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 },
  cartDQty:      { minWidth: 22, textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'var(--c-text)' },
  cartDFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--c-border)' },
  cartDTotalAmt: { fontWeight: 800, fontSize: 15, color: 'var(--c-primary)' },
  cartDConfirm:  { width: '100%', padding: '10px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  // ── Modal ──
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(6,23,93,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modalBox:      { background: 'var(--c-bg)', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(6,23,93,0.3)' },
  modalHero:     { padding: '1.5rem', display: 'flex', gap: 12, flexShrink: 0 },
  modalCatTag:   { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: .5 },
  modalNombre:   { margin: '4px 0 6px', fontSize: 20, fontWeight: 800, color: '#fff' },
  modalDescHero: { margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 },
  modalMeta:     { margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  modalCloseBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' },
  modalBody:     { flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' },
  modalSection:  { margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .5 },
  ofertaRow:     { border: '1px solid var(--c-border)', borderRadius: 12, padding: '1rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 },
  ofertaRowBest: { border: '1.5px solid var(--c-primary)', background: '#F8F9FF' },
  ofertaRowContract: { border: '1.5px solid #86efac', background: '#f0fdf4' },
  bestBadge:     { position: 'absolute', top: -10, left: 14, background: 'var(--c-primary)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  contractBadge: { position: 'absolute', top: -10, left: 14, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  provAvatar:    { width: 38, height: 38, borderRadius: 10, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 },
  provNombre:    { margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--c-text)' },
  provVigencia:  { margin: '2px 0 0', fontSize: 11, color: 'var(--c-muted)' },
  ofertaPrecio:  { margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--c-primary)', lineHeight: 1 },
  precioTachado: { margin: 0, fontSize: 12, color: 'var(--c-muted)', textDecoration: 'line-through', lineHeight: 1 },
  precioContract:{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: '#15803d', lineHeight: 1 },
  descuentoBadge:{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: '#15803d' },
  desglose:      { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 12px' },
  desgloseTitle: { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: .4 },
  desgloseRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-text)', padding: '3px 0' },
  tramosSection:     { paddingTop: 8, borderTop: '1px dashed #D1FAE5' },
  tramosSectionTitle:{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#065f46' },
  tramoMiniChip:     { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '5px 10px', minWidth: 80 },

  // ── Add to cart row (inside modal) ──
  addCartRow:    { display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 },
  modalStepper:  { display: 'flex', alignItems: 'center', gap: 4, background: 'var(--c-bg-page)', border: '1.5px solid var(--c-border)', borderRadius: 8, padding: '3px 6px' },
  modalStepBtn:  { background: 'none', border: 'none', color: 'var(--c-text)', fontWeight: 700, fontSize: 18, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  modalQtyInput: { width: 40, textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 14, color: 'var(--c-text)', outline: 'none' },
  modalStepUnit: { fontSize: 11, color: 'var(--c-muted)', paddingLeft: 2 },
  addCartBtn:    { flex: 1, padding: '9px 12px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}
