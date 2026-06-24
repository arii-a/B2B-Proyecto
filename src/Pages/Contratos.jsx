import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : null
const fmtMoney = (n) => `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
const fmtNum = (n) => n == null ? '∞' : Number(n).toLocaleString('es-BO')

const hoyLocal = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function Contratos() {
  const { session } = useAuth()

  const [contratos,   setContratos]   = useState([])
  const [empresas,    setEmpresas]    = useState([])
  const [productos,   setProductos]   = useState([])
  const [preciosBase, setPreciosBase] = useState([])
  const [proveedorActual, setProveedorActual] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg, setMsg]         = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [vigenteDesdeManual, setVigenteDesdeManual] = useState(false)
  const vigenteDesdeRef = useRef(null)

  const [form, setForm] = useState({
    idEmpresaCompradora: '',
    vigenteDesde: hoyLocal(),
    vigenteHasta: '',
  })

  // Líneas de descuento por producto — con buscador multi-select
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [seleccionados,    setSeleccionados]    = useState(new Set())
  const [tipoDescLinea,    setTipoDescLinea]    = useState('porcentaje') // para todas las líneas seleccionadas
  const [valorDescLinea,   setValorDescLinea]   = useState('')
  const [lineas,           setLineas]           = useState([])           // [{idProducto, nombre, sku, tipoDescuento, valor}]

  const toggleSeleccion = (id) => setSeleccionados(s => {
    const ns = new Set(s)
    ns.has(id) ? ns.delete(id) : ns.add(id)
    return ns
  })

  const agregarSeleccionados = () => {
    if (!valorDescLinea) return
    const val = Number(valorDescLinea)
    const nuevas = [...seleccionados].map(id => {
      const prod = productos.find(p => p.id === id)
      return { idProducto: id, nombre: prod?.nombre ?? '—', sku: prod?.sku ?? '', tipoDescuento: tipoDescLinea, valor: val }
    })
    setLineas(prev => {
      const existingIds = new Set(prev.map(l => l.idProducto))
      return [...prev, ...nuevas.filter(n => !existingIds.has(n.idProducto))]
    })
    setSeleccionados(new Set())
    setValorDescLinea('')
  }

  const removeLinea = (idProducto) => setLineas(prev => prev.filter(l => l.idProducto !== idProducto))

  // Tramos de descuento por volumen/costo
  const [tramos, setTramos] = useState([
    { tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', tipoDescuento: 'porcentaje', valor: '' }
  ])
  const setTramo    = (i, c, v) => setTramos(p => p.map((t, idx) => idx === i ? { ...t, [c]: v } : t))
  const addTramo    = () => setTramos(p => [...p, { tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', tipoDescuento: 'porcentaje', valor: '' }])
  const removeTramo = (i) => { if (tramos.length > 1) setTramos(p => p.filter((_, idx) => idx !== i)) }

  const cargar = async () => {
    setLoading(true); setMsg(null)
    try {
      const [empRes, prodRes, provRes, contRes, detRes, tramosRes, preciosRes] = await Promise.all([
        api.get('/api/v1/empresas'),
        api.get('/api/v1/products'),
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/contratos-tarifa'),
        api.get('/api/v1/contratos-detalle'),
        api.get('/api/v1/tramos-tarifa'),
        api.get('/api/v1/precios-base'),
      ])

      const proveedoresList = norm(provRes)
      const contratosList   = norm(contRes)
      const detallesList    = norm(detRes)
      const tramosList      = norm(tramosRes)

      const proveedor = proveedoresList.find(p => p.idEmpresa?.id === session?.id_empresa && p.activo)
      setProveedorActual(proveedor ?? null)
      setEmpresas(norm(empRes).filter(e => e.id !== session?.id_empresa && e.activo))
      setProductos(norm(prodRes))
      setPreciosBase(norm(preciosRes))

      const misContratos = contratosList.filter(c =>
        session?.rol === 'proveedor'
          ? c.idProveedor?.id === proveedor?.id
          : c.idEmpresa?.id === session?.id_empresa
      )

      const enriched = misContratos.map(c => ({
        ...c,
        detalles: detallesList.filter(d => d.idContrato?.id === c.id),
        tramos: tramosList
          .filter(t => t.idContrato === c.id)
          .sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima)),
      }))
      setContratos(enriched)
    } catch (e) {
      setMsg({ ok: false, text: `Error cargando datos: ${e.message}` })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [session])

  /* ── Validar tramos — sin solapamiento dentro del mismo tipo ── */
  const validarTramos = () => {
    for (const t of tramos) {
      if (!t.tipo || t.cantidadMinima === '' || t.valor === '')
        return 'Completa tipo, cantidad mínima y descuento en todos los tramos.'
      if (Number(t.cantidadMinima) < 0) return 'La cantidad mínima no puede ser negativa.'
      if (t.cantidadMaxima !== '' && Number(t.cantidadMaxima) <= Number(t.cantidadMinima))
        return 'La cantidad máxima debe ser mayor a la mínima.'
      if (t.tipoDescuento === 'porcentaje') {
        const pct = Number(t.valor)
        if (pct < 0 || pct > 100) return 'El descuento por porcentaje debe estar entre 0 y 100.'
      } else {
        if (Number(t.valor) < 0) return 'El monto fijo no puede ser negativo.'
      }
    }

    // Chequeo de solapamiento por tipo de rango (volumen / costo)
    for (const tipo of ['volumen', 'costo']) {
      const delTipo = tramos
        .filter(t => t.tipo === tipo && t.cantidadMinima !== '')
        .map(t => ({ min: Number(t.cantidadMinima), max: t.cantidadMaxima !== '' ? Number(t.cantidadMaxima) : Infinity }))
        .sort((a, b) => a.min - b.min)

      for (let i = 0; i < delTipo.length - 1; i++) {
        if (delTipo[i].max >= delTipo[i + 1].min) {
          return `Hay tramos de tipo "${tipo}" que se solapan. Revisa los rangos.`
        }
      }

      const ilimitados = delTipo.filter(t => t.max === Infinity)
      if (ilimitados.length > 1) {
        return `Solo puede haber un tramo "${tipo}" sin límite superior.`
      }
      if (ilimitados.length === 1 && delTipo.indexOf(ilimitados[0]) < delTipo.length - 1) {
        return `El tramo "${tipo}" sin límite debe ser el último del rango.`
      }
    }

    return null
  }

  /* ── Crear contrato ── */
  const crearContrato = async () => {
    setMsg(null)
    if (!form.idEmpresaCompradora) { setMsg({ ok: false, text: 'Selecciona la empresa compradora.' }); return }
    if (!form.vigenteDesde)        { setMsg({ ok: false, text: 'Define la fecha de inicio.' }); return }
    if (!proveedorActual)          { setMsg({ ok: false, text: 'Tu empresa no tiene perfil de proveedor activo.' }); return }
    const tramosErr = validarTramos()
    if (tramosErr) { setMsg({ ok: false, text: tramosErr }); return }

    setSaving(true)
    try {
      const contrato = await api.post('/api/v1/contratos-tarifa', {
        vigenteDesde: new Date(form.vigenteDesde).toISOString(),
        vigenteHasta: form.vigenteHasta ? new Date(form.vigenteHasta).toISOString() : null,
        activo: true,
        idEmpresa:   form.idEmpresaCompradora,
        idProveedor: proveedorActual.id,
      })

      await Promise.all([
        ...lineas.map(l => api.post('/api/v1/contratos-detalle', {
          porcentajeDescuento: l.tipoDescuento === 'porcentaje' ? Number(l.valor) : 0,
          montoFijo:           l.tipoDescuento === 'fijo'       ? Number(l.valor) : null,
          idProducto: l.idProducto || null,
          idContrato: contrato.id,
        })),
        ...tramos.map(t => api.post('/api/v1/tramos-tarifa', {
          tipo: t.tipo,
          cantidadMinima: Number(t.cantidadMinima),
          cantidadMaxima: t.cantidadMaxima !== '' ? Number(t.cantidadMaxima) : null,
          tipoDescuento:  t.tipoDescuento,
          porcentajeDesc: t.tipoDescuento === 'porcentaje' ? Number(t.valor) : 0,
          montoFijo:      t.tipoDescuento === 'fijo'       ? Number(t.valor) : null,
          idContrato: contrato.id,
        })),
      ])

      setMsg({ ok: true, text: 'Contrato creado correctamente.' })
      setMostrarForm(false); setVigenteDesdeManual(false)
      setForm({ idEmpresaCompradora: '', vigenteDesde: hoyLocal(), vigenteHasta: '' })
      setLineas([])
      setTramos([{ tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', tipoDescuento: 'porcentaje', valor: '' }])
      setBusquedaProducto('')
      setSeleccionados(new Set())
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error creando contrato: ${e.message}` })
    }
    setSaving(false)
  }

  /* ── Toggle / eliminar ── */
  const toggleContrato = async (c) => {
    try {
      await api.put(`/api/v1/contratos-tarifa/${c.id}`, {
        vigenteDesde: c.vigenteDesde,
        vigenteHasta: c.vigenteHasta,
        activo: !c.activo,
        idEmpresa:   c.idEmpresa?.id ?? c.idEmpresa,
        idProveedor: c.idProveedor?.id ?? c.idProveedor,
      })
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error actualizando contrato: ${e.message}` })
    }
  }

  const eliminarContrato = async (id) => {
    if (!window.confirm('¿Eliminar este contrato? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/v1/contratos-tarifa/${id}`)
      setMsg({ ok: true, text: 'Contrato eliminado.' })
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error eliminando contrato: ${e.message}` })
    }
  }

  /* ── Productos del proveedor para el picker ── */
  const productosProveedor = productos.filter(p => p.idProveedor?.id === proveedorActual?.id)
  const productosFiltrados = productosProveedor.filter(p =>
    !busquedaProducto || p.nombre?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    p.sku?.toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  /* ── Preview live de tramos al crear ── */
  const tramosValidos = tramos.filter(t => t.cantidadMinima !== '' && t.valor !== '')

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle="Acuerdos de precios entre proveedor y empresa compradora"
        action={
          session?.rol === 'proveedor' && !mostrarForm && (
            <button style={s.newBtn} onClick={() => setMostrarForm(true)}>+ Nuevo contrato</button>
          )
        }
      />

      {msg && <div style={{ ...s.alert, ...(msg.ok ? s.alertOk : s.alertErr) }}>{msg.text}</div>}

      {/* ── Formulario ── */}
      {mostrarForm && session?.rol === 'proveedor' && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Nuevo contrato</h3>
          <p style={s.formSub}>
            Define descuentos escalonados por volumen o costo, más descuentos específicos por producto.
          </p>

          {/* Empresa + Vigencia */}
          <div style={s.twoColForm}>
            <div>
              <label style={s.label}>Empresa compradora *</label>
              <select style={s.input} value={form.idEmpresaCompradora}
                onChange={e => setForm(f => ({ ...f, idEmpresaCompradora: e.target.value }))}>
                <option value="">Selecciona empresa</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div style={s.twoCol}>
              <div>
                <label style={s.label}>Vigente desde *</label>
                {vigenteDesdeManual ? (
                  <input ref={vigenteDesdeRef} style={s.input} type="datetime-local"
                    value={form.vigenteDesde}
                    onChange={e => setForm(f => ({ ...f, vigenteDesde: e.target.value }))} />
                ) : (
                  <button type="button" style={s.dateChip}
                    onClick={() => { setVigenteDesdeManual(true); setTimeout(() => vigenteDesdeRef.current?.showPicker?.(), 50) }}>
                    <span style={s.dateChipLabel}>Hoy</span>
                    <span style={s.dateChipDate}>{fmtDate(new Date())}</span>
                    <span style={s.dateChipEdit}>cambiar</span>
                  </button>
                )}
              </div>
              <div>
                <label style={s.label}>Vigente hasta</label>
                <input style={s.input} type="datetime-local" value={form.vigenteHasta}
                  onChange={e => setForm(f => ({ ...f, vigenteHasta: e.target.value }))} />
                <p style={s.hint}>Vacío = sin fecha de fin</p>
              </div>
            </div>
          </div>

          {/* Tramos de descuento */}
          <div style={s.seccionWrap}>
            <div style={s.seccionHead}>
              <div>
                <p style={s.sectionLabel}>Tramos de descuento general</p>
                <p style={s.sectionHint}>
                  Aplican al total del pedido por volumen (uds.) o costo (Bs.). Cada tramo puede ser porcentaje o monto fijo.
                  Los rangos del mismo tipo no pueden solaparse.
                </p>
              </div>
              <button style={s.addBtn} onClick={addTramo}>+ Tramo</button>
            </div>

            <div style={s.tramoHeaderNew}>
              <span>Tipo rango</span><span>Desde</span><span>Hasta</span><span>Descuento</span><span />
            </div>
            {tramos.map((t, i) => (
              <div key={i} style={s.tramoRowNew}>
                <select style={s.inputSm} value={t.tipo} onChange={e => setTramo(i, 'tipo', e.target.value)}>
                  <option value="volumen">📦 Volumen (uds.)</option>
                  <option value="costo">💰 Costo (Bs.)</option>
                </select>
                <input style={s.inputSm} type="number" min="0" value={t.cantidadMinima}
                  onChange={e => setTramo(i, 'cantidadMinima', e.target.value)} placeholder="Ej: 1" />
                <input style={s.inputSm} type="number" min="0" value={t.cantidadMaxima}
                  onChange={e => setTramo(i, 'cantidadMaxima', e.target.value)} placeholder="Sin límite" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <select style={{ ...s.inputSm, width: 80, padding: '8px 6px' }} value={t.tipoDescuento}
                    onChange={e => setTramo(i, 'tipoDescuento', e.target.value)}>
                    <option value="porcentaje">%</option>
                    <option value="fijo">Bs.</option>
                  </select>
                  <input style={{ ...s.inputSm, flex: 1 }} type="number" min="0"
                    max={t.tipoDescuento === 'porcentaje' ? 100 : undefined}
                    value={t.valor} onChange={e => setTramo(i, 'valor', e.target.value)}
                    placeholder={t.tipoDescuento === 'porcentaje' ? '0–100' : 'Ej: 20'} />
                </div>
                {tramos.length > 1 && (
                  <button style={s.removeBtn} onClick={() => removeTramo(i)}>✕</button>
                )}
              </div>
            ))}

            {tramosValidos.length > 0 && (
              <div style={s.previewBox}>
                <p style={s.previewTitle}>Vista previa</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[...tramosValidos]
                    .sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima))
                    .map((t, i) => (
                      <div key={i} style={s.previewChip}>
                        <span style={s.previewRange}>
                          {t.tipo === 'volumen' ? '📦' : '💰'} {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima || null)}
                          {t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                        </span>
                        <span style={s.previewPct}>
                          {t.tipoDescuento === 'fijo' ? `−Bs. ${t.valor}` : `−${t.valor}%`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Descuentos por producto — buscador multi-select */}
          <div style={s.seccionWrap}>
            <div style={s.seccionHead}>
              <div>
                <p style={s.sectionLabel}>Descuentos por producto</p>
                <p style={s.sectionHint}>
                  Busca y selecciona productos. Elige tipo (% o Bs. fijo) y valor, luego agrega.
                </p>
              </div>
            </div>

            {/* Buscador */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...s.inputSm, flex: 1 }}
                placeholder="Buscar por nombre o SKU..."
                value={busquedaProducto}
                onChange={e => setBusquedaProducto(e.target.value)}
              />
              <select style={{ ...s.inputSm, width: 90 }} value={tipoDescLinea}
                onChange={e => setTipoDescLinea(e.target.value)}>
                <option value="porcentaje">%</option>
                <option value="fijo">Bs.</option>
              </select>
              <input
                style={{ ...s.inputSm, width: 100 }}
                type="number" min="0"
                max={tipoDescLinea === 'porcentaje' ? 100 : undefined}
                placeholder={tipoDescLinea === 'porcentaje' ? '0–100' : 'Ej: 20'}
                value={valorDescLinea}
                onChange={e => setValorDescLinea(e.target.value)}
              />
              <button
                style={{ ...s.addBtn, opacity: seleccionados.size === 0 || !valorDescLinea ? 0.5 : 1 }}
                onClick={agregarSeleccionados}
                disabled={seleccionados.size === 0 || !valorDescLinea}
              >
                + Agregar {seleccionados.size > 0 ? `(${seleccionados.size})` : ''}
              </button>
            </div>

            {/* Lista de productos para seleccionar */}
            {productosProveedor.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--c-muted)', margin: '6px 0' }}>
                Tu empresa no tiene productos registrados.
              </p>
            ) : (
              <div style={s.productPickerList}>
                {productosFiltrados.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--c-muted)', padding: 8 }}>Sin resultados.</p>
                ) : productosFiltrados.slice(0, 20).map(p => {
                  const yaAgregado = lineas.some(l => l.idProducto === p.id)
                  const checked    = seleccionados.has(p.id)
                  return (
                    <label key={p.id} style={{ ...s.productPickerItem, opacity: yaAgregado ? 0.45 : 1, cursor: yaAgregado ? 'not-allowed' : 'pointer' }}>
                      <input type="checkbox" checked={checked} disabled={yaAgregado}
                        onChange={() => !yaAgregado && toggleSeleccion(p.id)}
                        style={{ accentColor: 'var(--c-primary)', flexShrink: 0 }} />
                      <span style={s.skuBadge}>{p.sku}</span>
                      <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{p.nombre}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Líneas ya agregadas */}
            {lineas.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ ...s.sectionHint, marginBottom: 6 }}>Productos con descuento en este contrato:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {lineas.map((l, i) => (
                    <div key={i} style={s.lineaAgregada}>
                      <span style={s.skuBadge}>{l.sku}</span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--c-text)' }}>{l.nombre}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                        {l.tipoDescuento === 'fijo' ? `−Bs. ${l.valor}` : `−${l.valor}%`}
                      </span>
                      <button style={s.removeBtnSm} onClick={() => removeLinea(l.idProducto)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => { setMostrarForm(false); setVigenteDesdeManual(false); setMsg(null) }}>Cancelar</button>
            <button style={s.saveBtn} onClick={crearContrato} disabled={saving}>
              {saving ? 'Creando...' : 'Crear contrato'}
            </button>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>Cargando contratos...</p>
      ) : contratos.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={s.emptyTitle}>Sin contratos</p>
          <p style={s.emptySub}>
            {session?.rol === 'proveedor'
              ? 'Crea un contrato para ofrecer precios negociados a tus clientes.'
              : 'Aún no tienes contratos activos con ningún proveedor.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contratos.map(c => (
            <ContratoCard
              key={c.id} contrato={c} rol={session?.rol}
              productos={productos} preciosBase={preciosBase}
              onToggle={() => toggleContrato(c)}
              onDelete={() => eliminarContrato(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── ContratoCard ───────────────────────────────────────────────────────────── */
function ContratoCard({ contrato: c, rol, productos, preciosBase, onToggle, onDelete }) {
  const [open,    setOpen]    = useState(true)
  const [simOpen, setSimOpen] = useState(false)
  const [simProd, setSimProd] = useState('')
  const [simCant, setSimCant] = useState('')

  const empresaNombre   = c.idEmpresa?.nombre            ?? '—'
  const proveedorNombre = c.idProveedor?.idEmpresa?.nombre ?? '—'
  const desde           = fmtDate(c.vigenteDesde)
  const hasta           = fmtDate(c.vigenteHasta)

  const diasRestantes = c.vigenteHasta
    ? Math.ceil((new Date(c.vigenteHasta) - new Date()) / (1000 * 60 * 60 * 24))
    : null
  const vencido     = diasRestantes !== null && diasRestantes < 0
  const vencePronto = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30

  const ahora = new Date()

  const prodsConPrecio = useMemo(() => {
    const provId = c.idProveedor?.id
    const ids = new Set(
      preciosBase
        .filter(p => p.idProveedor?.id === provId &&
          new Date(p.vigenteDesde) <= ahora &&
          (!p.vigenteHasta || new Date(p.vigenteHasta) >= ahora))
        .map(p => p.idProducto?.id).filter(Boolean)
    )
    return productos.filter(p => ids.has(p.id))
  }, [preciosBase, productos, c.idProveedor?.id])

  const simResult = useMemo(() => {
    if (!simProd || !simCant || Number(simCant) <= 0) return null
    const cantidad = Number(simCant)
    const provId   = c.idProveedor?.id

    const precioVig = preciosBase.find(p =>
      p.idProducto?.id === simProd && p.idProveedor?.id === provId &&
      new Date(p.vigenteDesde) <= ahora && (!p.vigenteHasta || new Date(p.vigenteHasta) >= ahora)
    )
    if (!precioVig) return { error: 'Sin precio base vigente para este producto.' }

    const base    = Number(precioVig.precioBase)
    const detalle = c.detalles.find(d => d.idProducto?.id === simProd)
    const pctDet  = detalle ? Number(detalle.porcentajeDescuento) : 0
    const montoFijoDet = detalle?.montoFijo ? Number(detalle.montoFijo) : 0
    const precioUnit = montoFijoDet > 0
      ? Math.max(0, base - montoFijoDet)
      : base * (1 - pctDet / 100)
    const subtotal   = precioUnit * cantidad

    const tramo = c.tramos.find(t => {
      const min = Number(t.cantidadMinima)
      const max = t.cantidadMaxima != null ? Number(t.cantidadMaxima) : Infinity
      return t.tipo === 'volumen' ? cantidad >= min && cantidad <= max : subtotal >= min && subtotal <= max
    })

    let descuentoTramo = 0
    if (tramo) {
      const td = tramo.tipoDescuento ?? 'porcentaje'
      if (td === 'fijo') {
        descuentoTramo = Number(tramo.montoFijo ?? 0) * cantidad
      } else {
        descuentoTramo = subtotal * Number(tramo.porcentajeDesc) / 100
      }
    }
    const total = subtotal - descuentoTramo
    const prod  = productos.find(p => p.id === simProd)

    return { base, pctDet, montoFijoDet, precioUnit, cantidad, subtotal, tramo, descuentoTramo, total, prod, detalle }
  }, [simProd, simCant, c, preciosBase, productos])

  return (
    <div style={{ ...s.card, ...(c.activo ? {} : s.cardInactive) }}>
      <div style={s.cardHead}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={s.partes}>
              <span style={s.empresa}>{rol === 'proveedor' ? empresaNombre : proveedorNombre}</span>
              <span style={s.partesArrow}>←→</span>
              <span style={s.empresa}>{rol === 'proveedor' ? proveedorNombre : empresaNombre}</span>
            </div>
            <span style={{ ...s.badge, ...(c.activo ? s.badgeOk : s.badgeOff) }}>
              {c.activo ? 'Activo' : 'Inactivo'}
            </span>
            {vencido && <span style={{ ...s.badge, background: '#fee2e2', color: '#991b1b' }}>Vencido</span>}
            {vencePronto && !vencido && (
              <span style={{ ...s.badge, background: '#fef3c7', color: '#92400e' }}>Vence en {diasRestantes}d</span>
            )}
            <span style={s.vigencia}>{desde} → {hasta ?? 'sin vencimiento'}</span>
          </div>
        </div>

        {rol === 'proveedor' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.toggleBtn} onClick={onToggle}>{c.activo ? 'Desactivar' : 'Activar'}</button>
            <button style={s.deleteBtn} onClick={onDelete}>Eliminar</button>
          </div>
        )}
        <span style={{ color: 'var(--c-muted)', fontSize: 16, cursor: 'pointer', marginLeft: 8 }}
          onClick={() => setOpen(o => !o)}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={s.cardBody}>
          {/* Tramos */}
          <div style={s.section}>
            <p style={s.sectionTitle}>
              Descuentos por volumen / costo
              <span style={s.sectionNote}> (aplican al total del pedido)</span>
            </p>
            {c.tramos.length === 0 ? (
              <p style={s.noData}>Sin tramos de descuento definidos.</p>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {c.tramos.map((t, i) => {
                  const td = t.tipoDescuento ?? 'porcentaje'
                  const label = td === 'fijo'
                    ? `−Bs. ${Number(t.montoFijo ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                    : `−${t.porcentajeDesc}%`
                  return (
                    <div key={i} style={s.tramoChip}>
                      <span style={s.tramoChipLabel}>
                        {t.tipo === 'volumen' ? '📦' : '💰'}{' '}
                        {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima)}
                        {t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                      </span>
                      <span style={s.tramoChipPct}>{label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Descuentos por producto */}
          <div style={s.section}>
            <p style={s.sectionTitle}>
              Descuentos por producto
              <span style={s.sectionNote}> (fijos sobre el precio base)</span>
            </p>
            {c.detalles.length === 0 ? (
              <p style={s.noData}>Sin descuentos por producto configurados.</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Producto</th>
                    <th style={s.th}>Descuento</th>
                    <th style={s.th}>Precio lista → tu precio</th>
                  </tr>
                </thead>
                <tbody>
                  {c.detalles.map((d, i) => {
                    const pct  = Number(d.porcentajeDescuento)
                    const mf   = d.montoFijo ? Number(d.montoFijo) : 0
                    const prod = d.idProducto?.nombre ?? d.nombreProducto
                    const precioVig = preciosBase.find(p =>
                      p.idProducto?.id === d.idProducto?.id &&
                      p.idProveedor?.id === c.idProveedor?.id &&
                      new Date(p.vigenteDesde) <= ahora &&
                      (!p.vigenteHasta || new Date(p.vigenteHasta) >= ahora)
                    )
                    const base = precioVig ? Number(precioVig.precioBase) : null
                    const precioFinal = base != null
                      ? (mf > 0 ? Math.max(0, base - mf) : base * (1 - pct / 100))
                      : null
                    const descLabel = mf > 0 ? `−Bs. ${mf.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : `−${pct}%`
                    return (
                      <tr key={d.id ?? i} style={i % 2 === 1 ? { background: '#F8F9FF' } : {}}>
                        <td style={s.td}>
                          {prod
                            ? <><span style={s.skuBadge}>{d.idProducto?.sku ?? ''}</span>{prod}</>
                            : <span style={s.allProd}>Todos los productos</span>}
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: '#16a34a' }}>{descLabel}</td>
                        <td style={s.td}>
                          {base != null
                            ? <span style={s.precioRow}>
                                <span style={s.baseStrike}>{fmtMoney(base)}</span>
                                <span style={s.arrow}>→</span>
                                <span style={s.precioFinal}>{fmtMoney(precioFinal)}</span>
                              </span>
                            : <span style={{ fontSize: 12, color: 'var(--c-muted)', fontStyle: 'italic' }}>Sin precio base</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Simulador */}
          <div style={s.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={s.sectionTitle}>
                Simulador de precio
                <span style={s.sectionNote}> (¿cuánto pagaría la empresa por X unidades?)</span>
              </p>
              <button style={s.simToggleBtn} onClick={() => setSimOpen(o => !o)}>
                {simOpen ? 'Ocultar' : 'Simular'}
              </button>
            </div>

            {simOpen && (
              <div style={s.simBox}>
                {prodsConPrecio.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', margin: 0 }}>
                    No hay productos con precio base vigente para simular.
                  </p>
                ) : (
                  <>
                    <div style={s.simInputRow}>
                      <div style={{ flex: 2 }}>
                        <label style={s.label}>Producto</label>
                        <select style={s.input} value={simProd}
                          onChange={e => { setSimProd(e.target.value); setSimCant('') }}>
                          <option value="">Selecciona un producto...</option>
                          {prodsConPrecio.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={s.label}>Cantidad</label>
                        <input style={s.input} type="number" min="1" value={simCant}
                          onChange={e => setSimCant(e.target.value)} placeholder="Ej: 50" />
                      </div>
                    </div>

                    {simResult?.error && (
                      <p style={{ color: '#dc2626', fontSize: 13, margin: '8px 0 0' }}>{simResult.error}</p>
                    )}

                    {simResult && !simResult.error && (
                      <div style={s.simResult}>
                        <p style={s.simResultTitle}>
                          {simResult.prod?.nombre} · {fmtNum(simResult.cantidad)} unidades
                        </p>
                        <div style={s.simSteps}>
                          <div style={s.simStep}>
                            <span style={s.simLabel}>Precio de lista</span>
                            <span style={s.simValue}>{fmtMoney(simResult.base)}</span>
                          </div>
                          {(simResult.pctDet > 0 || simResult.montoFijoDet > 0) && (
                            <div style={s.simStep}>
                              <span style={s.simLabel}>
                                − Descuento por producto
                                {simResult.montoFijoDet > 0
                                  ? ` (Bs. ${simResult.montoFijoDet} fijo)`
                                  : ` (${simResult.pctDet}%)`}
                              </span>
                              <span style={{ ...s.simValue, color: '#16a34a' }}>
                                − {fmtMoney(simResult.base - simResult.precioUnit)}
                              </span>
                            </div>
                          )}
                          <div style={s.simStepTotal}>
                            <span style={s.simLabel}>Tu precio por unidad</span>
                            <span style={{ ...s.simValue, fontWeight: 800 }}>{fmtMoney(simResult.precioUnit)}</span>
                          </div>
                          <div style={s.simStep}>
                            <span style={s.simLabel}>× {fmtNum(simResult.cantidad)} unidades</span>
                            <span style={s.simValue}>{fmtMoney(simResult.subtotal)}</span>
                          </div>
                          {simResult.tramo ? (
                            <div style={s.simStep}>
                              <span style={s.simLabel}>
                                − Tramo {simResult.tramo.tipo === 'volumen' ? '📦 volumen' : '💰 costo'}{' '}
                                {(simResult.tramo.tipoDescuento ?? 'porcentaje') === 'fijo'
                                  ? `(Bs. ${simResult.tramo.montoFijo} × ${simResult.cantidad} uds.)`
                                  : `(${simResult.tramo.porcentajeDesc}%)`}
                              </span>
                              <span style={{ ...s.simValue, color: '#16a34a' }}>
                                − {fmtMoney(simResult.descuentoTramo)}
                              </span>
                            </div>
                          ) : c.tramos.length > 0 && (
                            <div style={s.simStep}>
                              <span style={{ ...s.simLabel, fontStyle: 'italic' }}>
                                Sin tramo aplicable en este rango
                              </span>
                              <span style={s.simValue}>—</span>
                            </div>
                          )}
                          <div style={s.simStepFinal}>
                            <span style={s.simFinalLabel}>Total a pagar</span>
                            <span style={s.simFinalValue}>{fmtMoney(simResult.total)}</span>
                          </div>
                          {(simResult.pctDet > 0 || simResult.montoFijoDet > 0 || simResult.descuentoTramo > 0) && (
                            <div style={s.simSavings}>
                              Ahorro total:{' '}
                              <strong>
                                {fmtMoney(simResult.base * simResult.cantidad - simResult.total)}
                                {' '}({((1 - simResult.total / (simResult.base * simResult.cantidad)) * 100).toFixed(1)}% menos)
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  newBtn:    { background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  alert:     { borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 },
  alertOk:   { background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' },
  alertErr:  { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' },

  formCard:  { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(6,23,93,0.06)' },
  formTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: 'var(--c-text)' },
  formSub:   { margin: '0 0 1.25rem', fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 },
  twoColForm:{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: '1rem' },
  twoCol:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  label:     { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .4 },
  input:     { width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 13, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' },
  hint:      { margin: '4px 0 0', fontSize: 11, color: 'var(--c-muted)' },

  dateChip:      { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-bg-page)', cursor: 'pointer', boxSizing: 'border-box' },
  dateChipLabel: { background: 'var(--c-primary)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  dateChipDate:  { color: 'var(--c-text)', fontWeight: 600, fontSize: 13, flex: 1 },
  dateChipEdit:  { fontSize: 11, color: 'var(--c-muted)' },

  seccionWrap:  { background: '#F8F9FF', border: '1px solid var(--c-border)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' },
  seccionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sectionLabel: { margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--c-text)' },
  sectionHint:  { margin: '2px 0 0', fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.5 },
  addBtn:       { background: 'var(--c-bg)', border: '1.5px solid var(--c-primary)', color: 'var(--c-primary)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  tramoHeaderNew: { display: 'grid', gridTemplateColumns: '160px 90px 100px 1fr 32px', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', padding: '0 0 6px', borderBottom: '1px solid var(--c-border)', marginBottom: 8 },
  tramoRowNew:    { display: 'grid', gridTemplateColumns: '160px 90px 100px 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' },
  inputSm:     { width: '100%', padding: '8px 10px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 13, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' },

  previewBox:   { marginTop: 10, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '10px 12px' },
  previewTitle: { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 },
  previewChip:  { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--c-bg-page)', borderRadius: 8, padding: '6px 12px', minWidth: 90 },
  previewRange: { fontSize: 11, color: 'var(--c-muted)', marginBottom: 4, textAlign: 'center' },
  previewPct:   { fontSize: 14, fontWeight: 800, color: 'var(--c-primary)' },

  productPickerList: { border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-bg)', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  productPickerItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--c-border-light)' },
  lineaAgregada:     { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 7, padding: '6px 10px' },
  removeBtnSm:       { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700, flexShrink: 0 },
  removeBtn:         { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '8px', fontSize: 12, cursor: 'pointer', fontWeight: 700 },

  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn:   { padding: '9px 16px', background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--c-muted)', fontSize: 13 },
  saveBtn:     { padding: '9px 16px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },

  emptyBox:  { textAlign: 'center', padding: '3rem', background: 'var(--c-bg)', borderRadius: 14, border: '1px solid var(--c-border)' },
  emptyTitle:{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--c-text)' },
  emptySub:  { margin: 0, fontSize: 13, color: 'var(--c-muted)' },

  card:        { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--c-shadow-sm)' },
  cardInactive:{ opacity: .7 },
  cardHead:    { display: 'flex', alignItems: 'center', gap: 8, padding: '1rem 1.25rem' },
  partes:      { display: 'flex', alignItems: 'center', gap: 8 },
  empresa:     { fontWeight: 800, fontSize: 14, color: 'var(--c-text)' },
  partesArrow: { fontSize: 11, color: 'var(--c-muted)' },
  vigencia:    { fontSize: 12, color: 'var(--c-muted)' },
  badge:       { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0 },
  badgeOk:     { background: '#dcfce7', color: '#15803d' },
  badgeOff:    { background: '#fee2e2', color: '#991b1b' },
  toggleBtn:   { padding: '5px 12px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  deleteBtn:   { padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },

  cardBody:    { padding: '0 1.25rem 1.25rem' },
  section:     { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--c-border-light)' },
  sectionTitle:{ margin: '0 0 0', fontSize: 13, color: 'var(--c-text)' },
  sectionNote: { fontWeight: 400, color: 'var(--c-muted)', fontSize: 12 },
  noData:      { margin: '6px 0 0', fontSize: 12, color: 'var(--c-muted)' },

  tramoChip:      { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--c-bg-page)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '6px 12px', minWidth: 90 },
  tramoChipLabel: { fontSize: 11, color: 'var(--c-muted)', textAlign: 'center', marginBottom: 2 },
  tramoChipPct:   { fontSize: 15, fontWeight: 800, color: 'var(--c-primary)' },

  table:    { width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: 13 },
  th:       { padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4, borderBottom: '1px solid var(--c-border)' },
  td:       { padding: '8px 12px', color: 'var(--c-text)', verticalAlign: 'middle' },
  skuBadge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--c-bg-page)', color: 'var(--c-muted)', fontFamily: 'monospace', marginRight: 6 },
  allProd:  { fontSize: 12, color: 'var(--c-muted)', fontStyle: 'italic' },
  precioRow:  { display: 'inline-flex', alignItems: 'center', gap: 6 },
  baseStrike: { textDecoration: 'line-through', color: 'var(--c-muted)', fontSize: 12 },
  arrow:      { color: 'var(--c-muted)', fontSize: 11 },
  precioFinal:{ fontWeight: 700, color: '#16a34a', fontSize: 13 },

  simToggleBtn: { padding: '5px 12px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  simBox:       { marginTop: 12, background: '#F8F9FF', border: '1px solid var(--c-border)', borderRadius: 10, padding: '1rem' },
  simInputRow:  { display: 'flex', gap: 12, marginBottom: 12 },
  simResult:    { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  simResultTitle:{ margin: 0, padding: '10px 14px', fontWeight: 800, fontSize: 13, color: 'var(--c-text)', background: 'var(--c-primary-light)', borderBottom: '1px solid var(--c-border)' },
  simSteps:     { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  simStep:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--c-text)' },
  simStepTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--c-text)', borderTop: '1px solid var(--c-border)', paddingTop: 6, marginTop: 2 },
  simStepFinal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 800, color: 'var(--c-primary)', borderTop: '2px solid var(--c-border)', paddingTop: 8, marginTop: 4 },
  simLabel:     { color: 'var(--c-muted)', fontSize: 12 },
  simValue:     { fontFamily: 'monospace', fontSize: 13 },
  simFinalLabel:{ color: 'var(--c-primary)', fontWeight: 700 },
  simFinalValue:{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: 'var(--c-primary)' },
  simSavings:   { fontSize: 12, color: '#15803d', background: '#f0fdf4', borderRadius: 6, padding: '6px 10px', marginTop: 4 },
}
