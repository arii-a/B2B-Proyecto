import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])

const PALETTE = ['#06175D','#065f46','#78350f','#4a1d96','#7f1d1d','#134e4a','#1e3a5f','#713f12']
const colorFallback = (s) => PALETTE[s?.charCodeAt(0) % PALETTE.length] ?? PALETTE[0]

async function extraerColor(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = c.height = 80
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, 80, 80)
        const d = ctx.getImageData(0, 0, 80, 80).data
        const buckets = {}
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b, a] = [d[i], d[i+1], d[i+2], d[i+3]]
          if (a < 128) continue
          const lum = (r*299 + g*587 + b*114) / 1000
          if (lum > 230 || lum < 20) continue
          const k = `${Math.round(r/40)*40},${Math.round(g/40)*40},${Math.round(b/40)*40}`
          buckets[k] = (buckets[k] || 0) + 1
        }
        const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1])
        let best = null, bestScore = -1
        for (const [k, cnt] of sorted.slice(0, 8)) {
          const [r, g, b] = k.split(',').map(Number)
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          const sat = max > 0 ? (max - min) / max : 0
          const score = cnt * sat
          if (score > bestScore) { bestScore = score; best = [r, g, b] }
        }
        if (best && bestScore > 0) {
          const f = 0.72
          resolve(`rgb(${~~(best[0]*f)},${~~(best[1]*f)},${~~(best[2]*f)})`)
        } else resolve(null)
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export default function Proveedores() {
  const navigate = useNavigate()

  const [proveedores,  setProveedores]  = useState([])
  const [productos,    setProductos]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [msg,          setMsg]          = useState('')
  const [busqueda,     setBusqueda]     = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [brandColors,  setBrandColors]  = useState({})
  const [logoErrors,   setLogoErrors]   = useState(new Set())

  const cargar = async () => {
    setLoading(true); setMsg('')
    try {
      const [provRes, empRes, prodRes, catRes] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/empresas?size=1000'),
        api.get('/api/v1/products'),
        api.get('/api/v1/categorias'),
      ])
      const empresasMap   = Object.fromEntries(norm(empRes).map(e => [e.id, e]))
      const categoriasMap = Object.fromEntries(norm(catRes).map(c => [c.id, c.nombre]))
      const prodList      = norm(prodRes)

      const lista = norm(provRes).filter(p => p.activo).map(p => {
        const emp = p.idEmpresa ?? empresasMap[p.id_empresa] ?? {}
        return {
          id:          p.id,
          nombre:      emp.nombre        ?? '—',
          nit:         emp.nit ?? emp.ruc ?? '—',
          razonSocial: emp.razon_social  ?? emp.razonSocial ?? emp.nombre ?? '—',
          logoUrl:     emp.logo_url      ?? emp.logoUrl     ?? null,
          colorFb:     colorFallback(emp.nombre),
        }
      })

      const byProv = {}
      prodList.forEach(pr => {
        const pid = pr.idProveedor?.id ?? pr.id_proveedor
        if (!pid) return
        if (!byProv[pid]) byProv[pid] = []
        byProv[pid].push(pr)
      })

      const enriched = lista.map(p => {
        const prods  = byProv[p.id] ?? []
        const catIds = [...new Set(prods.map(pr => pr.idCategoria?.id).filter(Boolean))]
        return { ...p, numProductos: prods.length, categorias: catIds.map(id => categoriasMap[id]).filter(Boolean) }
      })

      setProveedores(enriched)
      setProductos(prodList)
    } catch (e) { setMsg(`Error: ${e.message}`) }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  // Extract brand colors from logos
  useEffect(() => {
    proveedores.forEach(p => {
      if (!p.logoUrl || brandColors[p.id] || logoErrors.has(p.id)) return
      extraerColor(p.logoUrl).then(color => {
        if (color) setBrandColors(prev => ({ ...prev, [p.id]: color }))
      })
    })
  }, [proveedores])

  const getColor = (p) => brandColors[p.id] ?? p.colorFb

  const filtrados = useMemo(() =>
    proveedores.filter(p =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categorias.some(c => c.toLowerCase().includes(busqueda.toLowerCase()))
    )
  , [proveedores, busqueda])

  const provSel  = seleccionado ? proveedores.find(p => p.id === seleccionado) : null
  const hasLogo  = (p) => p.logoUrl && !logoErrors.has(p.id)
  const onImgErr = (id) => setLogoErrors(prev => new Set([...prev, id]))

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Grid principal ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <PageHeader
          title="Proveedores"
          subtitle={`${proveedores.length} proveedores activos`}
          action={
            <button onClick={cargar} style={s.iconBtn} title="Actualizar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          }
        />

        {msg && <div style={s.msgErr}>{msg}</div>}

        {/* Buscador */}
        <div style={s.searchBar}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9599AE" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={s.searchInput}
            placeholder="Buscar proveedor o categoría..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button style={s.clearBtn} onClick={() => setBusqueda('')}>✕</button>
          )}
        </div>

        {loading ? (
          <div style={s.grid}>{[1,2,3,4,5,6,7,8].map(i => <div key={i} style={s.skeleton}/>)}</div>
        ) : filtrados.length === 0 ? (
          <div style={s.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DDE0EE" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <p style={{ margin: '8px 0 0', color: '#9599AE', fontSize: 13 }}>Sin resultados para "{busqueda}"</p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtrados.map(p => {
              const color  = getColor(p)
              const activo = seleccionado === p.id
              return (
                <div
                  key={p.id}
                  style={{ ...s.card, ...(activo ? { outline: `2.5px solid ${color}`, outlineOffset: 1 } : {}) }}
                  onClick={() => setSeleccionado(activo ? null : p.id)}
                >
                  {/* Franja de color / logo */}
                  <div style={{ ...s.strip, background: color }}>
                    {hasLogo(p) ? (
                      <img
                        src={p.logoUrl}
                        alt={p.nombre}
                        style={s.stripLogo}
                        onError={() => onImgErr(p.id)}
                      />
                    ) : (
                      <span style={s.stripInitial}>{p.nombre.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Cuerpo */}
                  <div style={s.cardBody}>
                    <p style={s.cardNombre}>{p.nombre}</p>
                    <div style={s.pillRow}>
                      {p.categorias.slice(0, 2).map(c => (
                        <span key={c} style={s.catBadge}>{c}</span>
                      ))}
                      {p.categorias.length > 2 && (
                        <span style={s.moreBadge}>+{p.categorias.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Panel de detalle ── */}
      {provSel && (() => {
        const color     = getColor(provSel)
        const prodsProv = productos.filter(pr => (pr.idProveedor?.id ?? pr.id_proveedor) === provSel.id)
        return (
          <div style={s.panel}>
            {/* Header */}
            <div style={{ ...s.panelHdr, background: color }}>
              {/* Blurred logo background */}
              {hasLogo(provSel) && (
                <img src={provSel.logoUrl} alt="" style={s.panelBg} />
              )}
              <button style={s.closeBtn} onClick={() => setSeleccionado(null)}>✕</button>
              <div style={s.panelHdrContent}>
                {hasLogo(provSel) ? (
                  <div style={s.panelLogoBox}>
                    <img
                      src={provSel.logoUrl}
                      alt={provSel.nombre}
                      style={s.panelLogo}
                      onError={() => onImgErr(provSel.id)}
                    />
                  </div>
                ) : (
                  <div style={s.panelInitial}>{provSel.nombre.charAt(0).toUpperCase()}</div>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={s.panelNombre}>{provSel.nombre}</p>
                  {provSel.nit !== '—' && (
                    <p style={s.panelNit}>NIT {provSel.nit}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
              <div style={s.statBox}>
                <span style={{ ...s.statNum, color }}>{provSel.numProductos}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ margin: '3px auto 2px', display: 'block' }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span style={s.statLabel}>productos</span>
              </div>
              <div style={s.statBox}>
                <span style={{ ...s.statNum, color }}>{provSel.categorias.length}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ margin: '3px auto 2px', display: 'block' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span style={s.statLabel}>categorías</span>
              </div>
            </div>

            <div style={s.panelBody}>
              {/* Categorías como tags de color */}
              {provSel.categorias.length > 0 && (
                <div style={s.tagCloud}>
                  {provSel.categorias.map(c => (
                    <span key={c} style={{ ...s.tag, background: color + '15', color, borderColor: color + '30' }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Productos preview */}
              {prodsProv.length > 0 && (
                <div style={s.prodList}>
                  {prodsProv.slice(0, 5).map((pr, i) => (
                    <div key={pr.id} style={{ ...s.prodRow, opacity: 1 - i * 0.12 }}>
                      <span style={{ ...s.dot, background: color }} />
                      <span style={s.prodNombre}>{pr.nombre}</span>
                    </div>
                  ))}
                  {provSel.numProductos > 5 && (
                    <p style={s.masMsg}>+{provSel.numProductos - 5} más en catálogo</p>
                  )}
                </div>
              )}

              <button
                style={{ ...s.ctaBtn, background: color }}
                onClick={() => navigate('/catalogo', { state: { proveedorId: provSel.id } })}
              >
                Ver catálogo completo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 6 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const s = {
  iconBtn:      { background: '#fff', border: '1px solid #DDE0EE', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', color: '#9599AE', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  msgErr:       { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', color: '#dc2626', fontSize: 13 },

  searchBar:    { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #DDE0EE', borderRadius: 10, padding: '0 12px', marginBottom: '1.25rem', maxWidth: 340, height: 40 },
  searchInput:  { flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#1A1D3B', background: 'transparent' },
  clearBtn:     { background: 'none', border: 'none', color: '#9599AE', cursor: 'pointer', fontSize: 12, padding: '0 2px' },

  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem' },

  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 },
  skeleton:     { height: 158, borderRadius: 14, background: 'linear-gradient(90deg, #F0F2FA 25%, #E8EBF5 50%, #F0F2FA 75%)', backgroundSize: '200%' },

  card:         { background: '#fff', border: '1.5px solid #E8EBF5', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s', boxShadow: '0 1px 4px rgba(6,23,93,0.05)', userSelect: 'none' },

  strip:        { height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stripLogo:    { maxHeight: 44, maxWidth: '75%', objectFit: 'contain' },
  stripInitial: { fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: -1 },

  cardBody:     { padding: '10px 12px 13px' },
  cardNombre:   { margin: '0 0 7px', fontWeight: 700, fontSize: 13, color: '#1A1D3B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pillRow:      { display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' },
  prodBadge:    { display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 },
  catBadge:     { fontSize: 10, background: '#F0FDF4', color: '#15803d', padding: '2px 7px', borderRadius: 20, fontWeight: 600 },
  moreBadge:    { fontSize: 10, color: '#9599AE', padding: '2px 3px' },

  panel:        { width: 296, flexShrink: 0, background: '#fff', border: '1px solid #E8EBF5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(6,23,93,0.12)', position: 'sticky', top: 20 },

  panelHdr:     { position: 'relative', padding: '1.25rem 1rem 1rem', minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  panelBg:      { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'blur(12px)', transform: 'scale(1.1)' },
  closeBtn:     { position: 'absolute', top: 10, right: 10, zIndex: 2, background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  panelHdrContent: { position: 'relative', zIndex: 1, display: 'flex', gap: 12, alignItems: 'center' },
  panelLogoBox: { width: 54, height: 54, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 4, boxSizing: 'border-box' },
  panelLogo:    { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  panelInitial: { width: 54, height: 54, borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0 },
  panelNombre:  { margin: 0, fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.2 },
  panelNit:     { margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)' },

  statsRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #F0F2FA' },
  statBox:      { padding: '14px 10px', textAlign: 'center', borderRight: '1px solid #F0F2FA' },
  statNum:      { display: 'block', fontSize: 26, fontWeight: 900, lineHeight: 1 },
  statLabel:    { fontSize: 10, color: '#9599AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 },

  panelBody:    { padding: '1rem' },
  tagCloud:     { display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: '0.875rem' },
  tag:          { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, border: '1px solid' },

  prodList:     { borderTop: '1px solid #F0F2FA', paddingTop: 10, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 7 },
  prodRow:      { display: 'flex', gap: 8, alignItems: 'center' },
  dot:          { width: 5, height: 5, borderRadius: '50%', flexShrink: 0 },
  prodNombre:   { fontSize: 12, color: '#1A1D3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  masMsg:       { fontSize: 11, color: '#9599AE', margin: '2px 0 0', fontStyle: 'italic' },

  ctaBtn:       { width: '100%', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
