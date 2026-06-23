import { useEffect, useState, useMemo } from 'react'
import { api } from '../api/client'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const fmtMoney = (n) => n == null ? '—' : `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : null
const fmtNum   = (n) => n == null ? '∞' : Number(n).toLocaleString('es-BO')

const CAT_GRADIENTS = [
  ['#06175D','#1e40af'], ['#065f46','#047857'], ['#78350f','#b45309'],
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

  // ── Filtros ──
  const [search,         setSearch]         = useState('')
  const [catFilters,     setCatFilters]     = useState(new Set())
  const [provFilters,    setProvFilters]    = useState(new Set())
  const [precioMin,      setPrecioMin]      = useState('')
  const [precioMax,      setPrecioMax]      = useState('')
  const [soloNegociados, setSoloNegociados] = useState(false)
  const [sortBy,         setSortBy]         = useState('nombre')

  // Pre-seleccionar proveedor si viene desde la página de Proveedores
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

  // ── Listas únicas para filtros ──
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

      {/* ── Main layout ── */}
      <div style={s.layout}>
        {/* ── Sidebar filtros ── */}
        <aside style={s.sidebar}>
          <div style={s.sideHead}>
            <span style={s.sideTitle}>Filtros</span>
            {hayFiltros && <button style={s.clearFiltersBtn} onClick={limpiarFiltros}>Limpiar</button>}
          </div>

          {/* Categorías */}
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

          {/* Precio */}
          <div style={s.filterSection}>
            <p style={s.filterLabel}>Precio (Bs.)</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input style={s.priceInput} type="number" min="0" placeholder="Mín"
                value={precioMin} onChange={e => setPrecioMin(e.target.value)} />
              <span style={{ color: '#9599AE', fontSize: 12 }}>—</span>
              <input style={s.priceInput} type="number" min="0" placeholder="Máx"
                value={precioMax} onChange={e => setPrecioMax(e.target.value)} />
            </div>
          </div>

          {/* Precio negociado */}
          {isEmpresa && (
            <div style={s.filterSection}>
              <label style={{ ...s.checkRow, paddingLeft: 0 }}>
                <input type="checkbox" style={s.check}
                  checked={soloNegociados}
                  onChange={e => setSoloNegociados(e.target.checked)} />
                <span style={{ ...s.checkText, color: '#15803d', fontWeight: 700 }}>Solo precio negociado</span>
              </label>
            </div>
          )}

          {/* Proveedores */}
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
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
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

          {/* Category pills (quick filter) */}
          <div style={s.pillRow}>
            <button style={{ ...s.pill, ...(catFilters.size === 0 ? s.pillActive : {}) }}
              onClick={() => setCatFilters(new Set())}>Todos</button>
            {catNames.map((c, i) => {
              const [c1] = CAT_GRADIENTS[i % CAT_GRADIENTS.length]
              const active = catFilters.has(c)
              return (
                <button key={c}
                  style={{ ...s.pill, ...(active ? { background: c1, color: '#fff', borderColor: c1 } : {}) }}
                  onClick={() => { setCatFilters(new Set(active ? [] : [c])) }}>
                  {c}
                </button>
              )
            })}
          </div>

          {/* Grid */}
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
            <div style={s.grid}>
              {filtrados.map(p => {
                const catIdx  = catNames.indexOf(p.categoria)
                const [g1, g2] = CAT_GRADIENTS[catIdx % CAT_GRADIENTS.length]
                const negociado = isEmpresa && tieneNegociado(p)
                const precioEf  = getMejorPrecio(p)
                const precioLista = Math.min(...p.ofertas.map(o => Number(o.precio)))

                return (
                  <div key={p.id} style={{ ...s.card, ...(negociado ? s.cardNeg : {}) }}
                    onClick={() => setModal(p)}>
                    {/* Image area */}
                    <div style={{ ...s.imgArea, background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                      <span style={s.imgLetter}>{p.nombre.charAt(0).toUpperCase()}</span>
                      {negociado && <span style={s.negBadge}>✓ Negociado</span>}
                      {p.sku && <span style={s.skuFloat}>{p.sku}</span>}
                    </div>

                    {/* Card body */}
                    <div style={s.cardBody}>
                      <span style={{ ...s.catPill, background: g1 + '18', color: g1 }}>{p.categoria}</span>
                      <p style={s.cardNombre}>{p.nombre}</p>
                      {p.descripcion && <p style={s.cardDesc}>{p.descripcion}</p>}

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
                        <div style={s.provBadge}>
                          <span style={s.provCount}>{p.ofertas.length}</span>
                          <span style={s.provLabel}>prov.</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <button style={{ ...s.ctaBtn, ...(negociado ? s.ctaBtnNeg : {}) }}
                      onClick={e => { e.stopPropagation(); setModal(p) }}>
                      {negociado ? 'Ver precio negociado' : 'Ver proveedores'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ProductModal
          product={modal} onClose={() => setModal(null)}
          navigate={navigate} catNames={catNames}
          getPrecioEfectivo={getPrecioEfectivo} isEmpresa={isEmpresa}
        />
      )}
    </div>
  )
}

/* ─── Modal (unchanged logic, same visual) ──────────────────────────────────── */
function ProductModal({ product, onClose, navigate, catNames, getPrecioEfectivo, isEmpresa }) {
  const catIdx       = catNames.indexOf(product.categoria)
  const [g1, g2]     = CAT_GRADIENTS[catIdx % CAT_GRADIENTS.length]
  const ofertasOrd   = [...product.ofertas].sort((a, b) => Number(a.precio) - Number(b.precio))
  const ofertasEnrich = ofertasOrd
    .map(o => ({ ...o, ef: getPrecioEfectivo(product.id, o.proveedor?.id, o.precio) }))
    .sort((a, b) => (a.ef?.precio ?? Number(a.precio)) - (b.ef?.precio ?? Number(b.precio)))

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modalBox} onClick={e => e.stopPropagation()}>
        {/* Modal header con gradiente */}
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
          <p style={s.modalSection}>{ofertasEnrich.length} opción{ofertasEnrich.length !== 1 ? 'es' : ''} disponibles</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ofertasEnrich.map((o, i) => {
              const nombre      = o.proveedor?.idEmpresa?.nombre ?? 'Proveedor'
              const ef          = o.ef
              const hasContract = ef && ef.descuento > 0
              const isFirst     = i === 0
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
                          <p style={{ fontSize: 10, color: '#9599AE', margin: 0 }}>/ {product.unidad || 'unidad'}</p>
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
                            <span style={{ fontSize: 10, color: '#9599AE' }}>
                              {t.tipo === 'volumen' ? '📦' : '💰'} {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima)}{t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>−{t.porcentajeDesc}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button style={{ ...s.ordenBtn, background: g1 }} onClick={() => { onClose(); navigate('/mis-ordenes', { state: { preselect: { sku: product.sku, proveedorId: o.proveedor?.id } } }) }}>
                    Crear orden con este proveedor
                  </button>
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
  hero:          { background: 'linear-gradient(135deg, #06175D 0%, #1e3a8a 60%, #1d4ed8 100%)', borderRadius: 16, padding: '2rem', marginBottom: '1.25rem' },
  heroContent:   { maxWidth: 640 },
  heroTitle:     { margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#fff' },
  heroSub:       { margin: '0 0 1rem', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  heroSearch:    { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  heroSearchInput:{ border: 'none', outline: 'none', fontSize: 14, color: '#1A1D3B', flex: 1, background: 'transparent' },
  clearBtn:      { border: 'none', background: 'none', color: '#9599AE', cursor: 'pointer', fontSize: 14, padding: 0 },
  heroBadge:     { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: '0.75rem', fontSize: 12, color: '#86efac', fontWeight: 600 },
  heroDot:       { width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 },

  errorBanner:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 },

  layout:        { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' },

  sidebar:       { background: '#fff', border: '1px solid #E8EBF5', borderRadius: 14, padding: '1.1rem', height: 'fit-content', position: 'sticky', top: 24, boxShadow: '0 2px 8px rgba(6,23,93,0.04)' },
  sideHead:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sideTitle:     { fontSize: 14, fontWeight: 800, color: '#1A1D3B' },
  clearFiltersBtn:{ background: 'none', border: 'none', color: '#06175D', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 },
  filterSection: { borderTop: '1px solid #F0F2FA', paddingTop: '0.75rem', marginBottom: '0.75rem' },
  filterLabel:   { margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .4 },
  checkRow:      { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12, color: '#1A1D3B' },
  check:         { accentColor: '#06175D', width: 14, height: 14, flexShrink: 0 },
  checkText:     { flex: 1 },
  checkCount:    { fontSize: 10, color: '#9599AE', background: '#F0F2FA', borderRadius: 10, padding: '1px 6px' },
  priceInput:    { flex: 1, padding: '6px 8px', border: '1.5px solid #DDE0EE', borderRadius: 7, fontSize: 12, color: '#1A1D3B', outline: 'none', minWidth: 0 },

  resultsBar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  resultsCount:  { fontSize: 13, fontWeight: 600, color: '#1A1D3B' },
  filteredLabel: { color: '#9599AE', fontWeight: 400 },
  sortSelect:    { border: '1.5px solid #DDE0EE', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#1A1D3B', outline: 'none', cursor: 'pointer', background: '#fff' },

  pillRow:       { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' },
  pill:          { padding: '5px 12px', border: '1.5px solid #DDE0EE', borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#9599AE', background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' },
  pillActive:    { background: '#06175D', color: '#fff', borderColor: '#06175D' },

  loadWrap:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  skeleton:      { height: 280, background: 'linear-gradient(90deg, #F0F2FA 25%, #E8EBF5 50%, #F0F2FA 75%)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' },

  emptyWrap:     { textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 14, border: '1px solid #E8EBF5' },
  emptyIcon:     { fontSize: 40, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: 700, color: '#1A1D3B', marginBottom: 6 },
  emptySub:      { fontSize: 13, color: '#9599AE', marginBottom: 16 },
  emptyBtn:      { padding: '8px 20px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },

  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  card:          { background: '#fff', border: '1px solid #E8EBF5', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s', boxShadow: '0 2px 8px rgba(6,23,93,0.05)' },
  cardNeg:       { border: '1.5px solid #86efac', boxShadow: '0 4px 16px rgba(22,163,74,0.12)' },

  imgArea:       { height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  imgLetter:     { fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.35)', userSelect: 'none' },
  negBadge:      { position: 'absolute', top: 8, left: 8, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  skuFloat:      { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, fontFamily: 'monospace' },

  cardBody:      { padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  catPill:       { fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'inline-block', textTransform: 'uppercase', letterSpacing: .4, alignSelf: 'flex-start' },
  cardNombre:    { margin: 0, fontSize: 13, fontWeight: 700, color: '#1A1D3B', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardDesc:      { margin: 0, fontSize: 11, color: '#9599AE', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  priceRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
  strikePrice:   { margin: 0, fontSize: 10, color: '#9599AE', textDecoration: 'line-through', lineHeight: 1 },
  mainPrice:     { margin: 0, fontSize: 18, fontWeight: 800, color: '#06175D', lineHeight: 1 },
  mainPriceNeg:  { color: '#15803d' },
  perUnit:       { margin: 0, fontSize: 10, color: '#9599AE' },
  provBadge:     { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#EEF1FB', borderRadius: 8, padding: '4px 8px', flexShrink: 0 },
  provCount:     { fontSize: 14, fontWeight: 800, color: '#06175D', lineHeight: 1 },
  provLabel:     { fontSize: 9, color: '#9599AE', fontWeight: 600 },

  ctaBtn:        { margin: '0 0.85rem 0.85rem', padding: '8px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' },
  ctaBtnNeg:     { background: '#15803d' },

  overlay:       { position: 'fixed', inset: 0, background: 'rgba(6,23,93,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modalBox:      { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(6,23,93,0.3)' },
  modalHero:     { padding: '1.5rem', display: 'flex', gap: 12, flexShrink: 0 },
  modalCatTag:   { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: .5 },
  modalNombre:   { margin: '4px 0 6px', fontSize: 20, fontWeight: 800, color: '#fff' },
  modalDescHero: { margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 },
  modalMeta:     { margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  modalCloseBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' },
  modalBody:     { flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' },
  modalSection:  { margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .5 },

  ofertaRow:     { border: '1px solid #E8EBF5', borderRadius: 12, padding: '1rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 },
  ofertaRowBest: { border: '1.5px solid #06175D', background: '#F8F9FF' },
  ofertaRowContract: { border: '1.5px solid #86efac', background: '#f0fdf4' },
  bestBadge:     { position: 'absolute', top: -10, left: 14, background: '#06175D', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  contractBadge: { position: 'absolute', top: -10, left: 14, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  provAvatar:    { width: 38, height: 38, borderRadius: 10, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 },
  provNombre:    { margin: 0, fontWeight: 700, fontSize: 14, color: '#1A1D3B' },
  provVigencia:  { margin: '2px 0 0', fontSize: 11, color: '#9599AE' },
  ofertaPrecio:  { margin: 0, fontSize: 18, fontWeight: 800, color: '#06175D', lineHeight: 1 },
  precioTachado: { margin: 0, fontSize: 12, color: '#9599AE', textDecoration: 'line-through', lineHeight: 1 },
  precioContract:{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: '#15803d', lineHeight: 1 },
  descuentoBadge:{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: '#15803d' },

  desglose:      { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 12px' },
  desgloseTitle: { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: .4 },
  desgloseRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#1A1D3B', padding: '3px 0' },

  tramosSection:     { paddingTop: 8, borderTop: '1px dashed #D1FAE5' },
  tramosSectionTitle:{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#065f46' },
  tramoMiniChip:     { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '5px 10px', minWidth: 80 },

  ordenBtn:      { width: '100%', padding: '9px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  skuHint:       { margin: '6px 0 0', fontSize: 11, color: '#9599AE', textAlign: 'center' },
}
