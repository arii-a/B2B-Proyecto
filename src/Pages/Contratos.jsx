import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : null
const fmtMoney = (n) => `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
const fmtNum = (n) => n == null ? '∞' : Number(n).toLocaleString('es-BO')

const hoyISO = () => new Date().toISOString().split('T')[0]

function DateInput({ value, onChange, style, placeholder = 'dd/mm/aaaa' }) {
  const fmt = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }
  const [text, setText] = useState(() => fmt(value))
  useEffect(() => { setText(fmt(value)) }, [value])

  const handle = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let display = digits
    if (digits.length > 4) display = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`
    else if (digits.length > 2) display = `${digits.slice(0,2)}/${digits.slice(2)}`
    setText(display)
    if (digits.length === 8)
      onChange(`${digits.slice(4,8)}-${digits.slice(2,4)}-${digits.slice(0,2)}`)
    else
      onChange('')
  }

  return <input type="text" value={text} onChange={handle} placeholder={placeholder} maxLength={10} style={style} />
}

const TRAMO_VACIO = { tipo: 'volumen', idProducto: '', cantidadMinima: '', cantidadMaxima: '', tipoDescuento: 'porcentaje', valor: '' }

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

  const [form, setForm] = useState({
    idEmpresaCompradora: '',
    vigenteDesde: hoyISO(),
    vigenteHasta: '',
  })

  // Tramos de descuento — ahora con producto opcional por tramo
  const [tramos, setTramos] = useState([{ ...TRAMO_VACIO }])
  const setTramo    = (i, c, v) => setTramos(p => p.map((t, idx) => idx === i ? { ...t, [c]: v } : t))
  const addTramo    = () => setTramos(p => [...p, { ...TRAMO_VACIO }])
  const removeTramo = (i) => { if (tramos.length > 1) setTramos(p => p.filter((_, idx) => idx !== i)) }

  // Errores inline por índice de tramo
  const tramosErrors = useMemo(() => {
    const errors = {}

    tramos.forEach((t, i) => {
      if (t.cantidadMinima === '' && t.valor === '') return
      if (t.cantidadMinima !== '' && Number(t.cantidadMinima) < 0) {
        errors[i] = 'La cantidad mínima no puede ser negativa.'; return
      }
      if (t.cantidadMaxima !== '' && Number(t.cantidadMaxima) <= Number(t.cantidadMinima)) {
        errors[i] = 'El máximo debe ser mayor al mínimo.'; return
      }
      if (t.tipoDescuento === 'porcentaje' && t.valor !== '') {
        const pct = Number(t.valor)
        if (pct < 0 || pct > 100) { errors[i] = 'El porcentaje debe estar entre 0 y 100.'; return }
      }
      if (t.tipoDescuento === 'fijo' && t.valor !== '' && Number(t.valor) < 0) {
        errors[i] = 'El monto fijo no puede ser negativo.'; return
      }
    })

    // Solapamiento agrupado por (tipo, idProducto)
    const grupos = {}
    tramos.forEach((t, i) => {
      if (t.cantidadMinima === '') return
      const key = `${t.tipo}__${t.idProducto || '__todos__'}`
      if (!grupos[key]) grupos[key] = []
      grupos[key].push({
        _idx: i,
        min: Number(t.cantidadMinima),
        max: t.cantidadMaxima !== '' ? Number(t.cantidadMaxima) : Infinity,
      })
    })

    Object.values(grupos).forEach(grupo => {
      const sorted = [...grupo].sort((a, b) => a.min - b.min)

      const infinitos = sorted.filter(t => t.max === Infinity)
      if (infinitos.length > 1) {
        infinitos.forEach(t => {
          if (!errors[t._idx]) errors[t._idx] = 'Solo puede haber un tramo sin límite superior en este grupo.'
        })
      }

      for (let j = 0; j < sorted.length - 1; j++) {
        const curr = sorted[j]
        const next = sorted[j + 1]
        if (curr.max >= next.min) {
          const currLabel = `${curr.min}–${curr.max === Infinity ? '∞' : curr.max}`
          const nextLabel = `${next.min}–${next.max === Infinity ? '∞' : next.max}`
          if (!errors[curr._idx]) errors[curr._idx] = `Se solapa con el tramo ${nextLabel}.`
          if (!errors[next._idx]) errors[next._idx] = `Se solapa con el tramo ${currLabel}.`
        }
      }
    })

    return errors
  }, [tramos])

  const hayErroresTramos = Object.keys(tramosErrors).length > 0

  const cargar = async () => {
    setLoading(true); setMsg(null)
    try {
      const [empRes, prodRes, provRes, contRes, tramosRes, preciosRes] = await Promise.all([
        api.get('/api/v1/empresas'),
        api.get('/api/v1/products'),
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/contratos-tarifa'),
        api.get('/api/v1/tramos-tarifa'),
        api.get('/api/v1/precios-base'),
      ])

      const proveedoresList = norm(provRes)
      const contratosList   = norm(contRes)
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

  const crearContrato = async () => {
    setMsg(null)
    if (!form.idEmpresaCompradora) { setMsg({ ok: false, text: 'Selecciona la empresa compradora.' }); return }
    if (!form.vigenteDesde)        { setMsg({ ok: false, text: 'Define la fecha de inicio.' }); return }
    if (!proveedorActual)          { setMsg({ ok: false, text: 'Tu empresa no tiene perfil de proveedor activo.' }); return }
    if (hayErroresTramos)          { setMsg({ ok: false, text: 'Corrige los errores en los tramos antes de continuar.' }); return }
    const tramosIncompletos = tramos.some(t => t.cantidadMinima === '' || t.valor === '')
    if (tramosIncompletos)         { setMsg({ ok: false, text: 'Completa todos los campos de cada tramo.' }); return }

    setSaving(true)
    try {
      const contrato = await api.post('/api/v1/contratos-tarifa', {
        vigenteDesde: new Date(form.vigenteDesde + 'T00:00:00').toISOString(),
        vigenteHasta: form.vigenteHasta ? new Date(form.vigenteHasta + 'T23:59:59').toISOString() : null,
        activo: true,
        idEmpresa:   form.idEmpresaCompradora,
        idProveedor: proveedorActual.id,
      })

      await Promise.all(
        tramos.map(t => api.post('/api/v1/tramos-tarifa', {
          tipo: t.tipo,
          idProducto: t.idProducto || null,
          cantidadMinima: Number(t.cantidadMinima),
          cantidadMaxima: t.cantidadMaxima !== '' ? Number(t.cantidadMaxima) : null,
          tipoDescuento:  t.tipoDescuento,
          porcentajeDesc: t.tipoDescuento === 'porcentaje' ? Number(t.valor) : 0,
          montoFijo:      t.tipoDescuento === 'fijo'       ? Number(t.valor) : null,
          idContrato: contrato.id,
        }))
      )

      setMsg({ ok: true, text: 'Contrato creado correctamente.' })
      setMostrarForm(false); setVigenteDesdeManual(false)
      setForm({ idEmpresaCompradora: '', vigenteDesde: hoyISO(), vigenteHasta: '' })
      setTramos([{ ...TRAMO_VACIO }])
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error creando contrato: ${e.message}` })
    }
    setSaving(false)
  }

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

  const productosProveedor = productos.filter(p => p.idProveedor?.id === proveedorActual?.id)
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

      {/* Formulario */}
      {mostrarForm && session?.rol === 'proveedor' && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Nuevo contrato</h3>
          <p style={s.formSub}>
            Define tramos de descuento por volumen o costo. Cada tramo puede aplicar a todos los productos o a uno específico.
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
                  <DateInput style={s.input} value={form.vigenteDesde}
                    onChange={v => setForm(f => ({ ...f, vigenteDesde: v }))} />
                ) : (
                  <button type="button" style={s.dateChip}
                    onClick={() => setVigenteDesdeManual(true)}>
                    <span style={s.dateChipLabel}>Hoy</span>
                    <span style={s.dateChipDate}>{fmtDate(new Date())}</span>
                    <span style={s.dateChipEdit}>cambiar</span>
                  </button>
                )}
              </div>
              <div>
                <label style={s.label}>Vigente hasta</label>
                <DateInput style={s.input} value={form.vigenteHasta}
                  onChange={v => setForm(f => ({ ...f, vigenteHasta: v }))} />
                <p style={s.hint}>Vacío = sin fecha de fin</p>
              </div>
            </div>
          </div>

          {/* Tramos de descuento */}
          <div style={s.seccionWrap}>
            <div style={s.seccionHead}>
              <div>
                <p style={s.sectionLabel}>Tramos de descuento</p>
                <p style={s.sectionHint}>
                  Cada tramo aplica por volumen (uds.) o costo (Bs.), sobre todos los productos o sobre uno específico.
                  Los rangos del mismo tipo y mismo producto no pueden solaparse.
                </p>
              </div>
              <button style={s.addBtn} onClick={addTramo}>+ Tramo</button>
            </div>

            <div style={s.tramoHeader}>
              <span>Producto</span>
              <span>Tipo rango</span>
              <span>Desde</span>
              <span>Hasta</span>
              <span>Descuento</span>
              <span />
            </div>

            {tramos.map((t, i) => (
              <div key={i}>
                <div style={{ ...s.tramoRow, ...(tramosErrors[i] ? s.tramoRowError : {}) }}>
                  {/* Producto */}
                  <select style={s.inputSm} value={t.idProducto}
                    onChange={e => setTramo(i, 'idProducto', e.target.value)}>
                    <option value="">Todos los productos</option>
                    {productosProveedor.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>
                    ))}
                  </select>
                  {/* Tipo rango */}
                  <select style={s.inputSm} value={t.tipo} onChange={e => setTramo(i, 'tipo', e.target.value)}>
                    <option value="volumen">📦 Volumen (uds.)</option>
                    <option value="costo">💰 Costo (Bs.)</option>
                  </select>
                  {/* Desde */}
                  <input style={s.inputSm} type="number" min="0" value={t.cantidadMinima}
                    onChange={e => setTramo(i, 'cantidadMinima', e.target.value)} placeholder="Ej: 1" />
                  {/* Hasta */}
                  <input style={s.inputSm} type="number" min="0" value={t.cantidadMaxima}
                    onChange={e => setTramo(i, 'cantidadMaxima', e.target.value)} placeholder="Sin límite" />
                  {/* Descuento */}
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
                {tramosErrors[i] && (
                  <div style={s.tramoErrorMsg}>⚠ {tramosErrors[i]}</div>
                )}
              </div>
            ))}

            {tramosValidos.length > 0 && !hayErroresTramos && (
              <div style={s.previewBox}>
                <p style={s.previewTitle}>Vista previa</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[...tramosValidos]
                    .sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima))
                    .map((t, i) => {
                      const prod = productosProveedor.find(p => p.id === t.idProducto)
                      const pb   = prod
                        ? preciosBase.find(p => p.idProducto?.id === prod.id && p.idProveedor?.id === proveedorActual?.id)
                        : null
                      const base = pb ? Number(pb.precioBase) : null
                      const final = base !== null
                        ? (t.tipoDescuento === 'fijo'
                            ? Math.max(0, base - Number(t.valor))
                            : base * (1 - Number(t.valor) / 100))
                        : null
                      return (
                        <div key={i} style={s.previewChip}>
                          {prod && <span style={s.previewProd}>{prod.sku}</span>}
                          <span style={s.previewRange}>
                            {t.tipo === 'volumen' ? '📦' : '💰'} {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima || null)}
                            {t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                          </span>
                          <span style={s.previewPct}>
                            {t.tipoDescuento === 'fijo' ? `−Bs. ${t.valor}` : `−${t.valor}%`}
                          </span>
                          {prod && base !== null && (
                            <span style={{ fontSize: 10, color: '#15803d', fontWeight: 600 }}>
                              {fmtMoney(base)} → {fmtMoney(final)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => { setMostrarForm(false); setVigenteDesdeManual(false); setMsg(null) }}>Cancelar</button>
            <button style={s.saveBtn} onClick={crearContrato} disabled={saving || hayErroresTramos}>
              {saving ? 'Creando...' : 'Crear contrato'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contratos.map(c => (
            <ContratoCard
              key={c.id} contrato={c} rol={session?.rol}
              onToggle={() => toggleContrato(c)}
              onDelete={() => eliminarContrato(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── ContratoCard ─────────────────────────────────────────────────────────── */
function ContratoCard({ contrato: c, rol, onToggle, onDelete }) {
  const [open, setOpen] = useState(false)

  const empresaNombre   = c.idEmpresa?.nombre             ?? '—'
  const proveedorNombre = c.idProveedor?.idEmpresa?.nombre ?? '—'
  const desde           = fmtDate(c.vigenteDesde)
  const hasta           = fmtDate(c.vigenteHasta)

  const diasRestantes = c.vigenteHasta
    ? Math.ceil((new Date(c.vigenteHasta) - new Date()) / (1000 * 60 * 60 * 24))
    : null
  const vencido     = diasRestantes !== null && diasRestantes < 0
  const vencePronto = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30

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
              Tramos de descuento
              <span style={s.sectionNote}> (por volumen o costo)</span>
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
                  const prodNombre = t.nombreProducto ?? null
                  const prodSku    = t.skuProducto    ?? null
                  return (
                    <div key={i} style={s.tramoChip}>
                      {prodSku && (
                        <span style={{ ...s.skuBadge, marginBottom: 2 }}>{prodSku}</span>
                      )}
                      <span style={s.tramoChipLabel}>
                        {t.tipo === 'volumen' ? '📦' : '💰'}{' '}
                        {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima)}
                        {t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                      </span>
                      {prodNombre && (
                        <span style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 1, maxWidth: 100, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prodNombre}
                        </span>
                      )}
                      {!prodNombre && (
                        <span style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 1, fontStyle: 'italic' }}>Todos</span>
                      )}
                      <span style={s.tramoChipPct}>{label}</span>
                    </div>
                  )
                })}
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
  input:     { width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 13, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-input-bg)' },
  hint:      { margin: '4px 0 0', fontSize: 11, color: 'var(--c-muted)' },

  dateChip:      { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-bg-page)', cursor: 'pointer', boxSizing: 'border-box' },
  dateChipLabel: { background: 'var(--c-primary)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  dateChipDate:  { color: 'var(--c-text)', fontWeight: 600, fontSize: 13, flex: 1 },
  dateChipEdit:  { fontSize: 11, color: 'var(--c-muted)' },

  seccionWrap:  { background: 'var(--c-bg-subtle)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' },
  seccionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sectionLabel: { margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--c-text)' },
  sectionHint:  { margin: '2px 0 0', fontSize: 11, color: 'var(--c-muted)', lineHeight: 1.5 },
  addBtn:       { background: 'var(--c-bg)', border: '1.5px solid var(--c-primary)', color: 'var(--c-primary)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  tramoHeader:  { display: 'grid', gridTemplateColumns: '1fr 140px 80px 90px 1fr 32px', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', padding: '0 0 6px', borderBottom: '1px solid var(--c-border)', marginBottom: 8 },
  tramoRow:     { display: 'grid', gridTemplateColumns: '1fr 140px 80px 90px 1fr 32px', gap: 8, marginBottom: 4, alignItems: 'center' },
  tramoRowError:{ background: '#fff5f5', borderRadius: 8, padding: '4px 6px', outline: '1.5px solid #fca5a5' },
  tramoErrorMsg:{ fontSize: 11, color: '#dc2626', padding: '2px 6px 6px', display: 'flex', alignItems: 'center', gap: 4 },
  inputSm:      { width: '100%', padding: '8px 10px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 13, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-input-bg)' },

  previewBox:   { marginTop: 10, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '10px 12px' },
  previewTitle: { margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 },
  previewChip:  { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--c-bg-page)', borderRadius: 8, padding: '6px 12px', minWidth: 90 },
  previewProd:  { fontSize: 10, fontWeight: 700, color: 'var(--c-primary)', background: 'var(--c-primary-light)', borderRadius: 4, padding: '1px 6px', marginBottom: 2, fontFamily: 'monospace' },
  previewRange: { fontSize: 11, color: 'var(--c-muted)', marginBottom: 4, textAlign: 'center' },
  previewPct:   { fontSize: 14, fontWeight: 800, color: 'var(--c-primary)' },

  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn:   { padding: '9px 16px', background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--c-muted)', fontSize: 13 },
  saveBtn:     { padding: '9px 16px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },

  emptyBox:  { textAlign: 'center', padding: '3rem', background: 'var(--c-bg)', borderRadius: 14, border: '1px solid var(--c-border)' },
  emptyTitle:{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--c-text)' },
  emptySub:  { margin: 0, fontSize: 13, color: 'var(--c-muted)' },

  card:        { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--c-shadow-sm)' },
  cardInactive:{ opacity: .7 },
  cardHead:    { display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem' },
  partes:      { display: 'flex', alignItems: 'center', gap: 6 },
  empresa:     { fontWeight: 700, fontSize: 13, color: 'var(--c-text)' },
  partesArrow: { fontSize: 10, color: 'var(--c-muted)' },
  vigencia:    { fontSize: 11, color: 'var(--c-muted)' },
  badge:       { fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0 },
  badgeOk:     { background: '#dcfce7', color: '#15803d' },
  badgeOff:    { background: '#fee2e2', color: '#991b1b' },
  toggleBtn:   { padding: '4px 10px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  deleteBtn:   { padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },

  cardBody:    { padding: '0 1rem 0.75rem' },
  section:     { marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--c-border-light)' },
  sectionTitle:{ margin: '0 0 0', fontSize: 12, color: 'var(--c-text)' },
  sectionNote: { fontWeight: 400, color: 'var(--c-muted)', fontSize: 11 },
  noData:      { margin: '4px 0 0', fontSize: 11, color: 'var(--c-muted)' },

  tramoChip:      { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--c-bg-page)', border: '1px solid var(--c-border)', borderRadius: 7, padding: '4px 10px', minWidth: 76 },
  tramoChipLabel: { fontSize: 10, color: 'var(--c-muted)', textAlign: 'center', marginBottom: 1 },
  tramoChipPct:   { fontSize: 13, fontWeight: 800, color: 'var(--c-primary)' },

  skuBadge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--c-bg-page)', color: 'var(--c-muted)', fontFamily: 'monospace', marginRight: 6 },

  simToggleBtn:  { padding: '5px 12px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  simBox:        { marginTop: 12, background: 'var(--c-bg-subtle)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '1rem' },
  simInputRow:   { display: 'flex', gap: 12, marginBottom: 12 },
  simResult:     { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  simResultTitle:{ margin: 0, padding: '10px 14px', fontWeight: 800, fontSize: 13, color: 'var(--c-text)', background: 'var(--c-primary-light)', borderBottom: '1px solid var(--c-border)' },
  simSteps:      { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  simStep:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--c-text)' },
  simStepFinal:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 800, color: 'var(--c-primary)', borderTop: '2px solid var(--c-border)', paddingTop: 8, marginTop: 4 },
  simLabel:      { color: 'var(--c-muted)', fontSize: 12 },
  simValue:      { fontFamily: 'monospace', fontSize: 13 },
  simFinalLabel: { color: 'var(--c-primary)', fontWeight: 700 },
  simFinalValue: { fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: 'var(--c-primary)' },
  simSavings:    { fontSize: 12, color: '#15803d', background: '#f0fdf4', borderRadius: 6, padding: '6px 10px', marginTop: 4 },
}
