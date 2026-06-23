import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const fmtNum = (n) => n == null ? '∞' : Number(n).toLocaleString('es-BO')

export default function ReglasTarifa() {
  const { session } = useAuth()

  const [proveedorActual, setProveedorActual] = useState(null)
  const [planes,   setPlanes]   = useState([])
  const [usoPorPlan, setUsoPorPlan] = useState({}) // { [idRegla]: nContratos }
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const [form,   setForm]   = useState({ nombre: '', descripcion: '' })
  const [tramos, setTramos] = useState([
    { tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', porcentajeDesc: '' },
  ])

  const cargar = async () => {
    setLoading(true); setMsg(null)
    try {
      const [provRes, reglasRes, tramosRes, contratosRes] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/tarifas-reglas'),
        api.get('/api/v1/tramos-tarifa'),
        api.get('/api/v1/contratos-tarifa'),
      ])

      const proveedor = norm(provRes).find(p => p.idEmpresa?.id === session?.id_empresa && p.activo)
      setProveedorActual(proveedor ?? null)

      const misReglas = proveedor
        ? norm(reglasRes).filter(r => r.idProveedor?.id === proveedor.id)
        : []

      const tramosAll = norm(tramosRes)
      const enriched  = misReglas.map(r => ({
        ...r,
        tramos: tramosAll.filter(t => t.idRegla?.id === r.id)
          .sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima)),
      }))
      setPlanes(enriched)

      // Cuántos contratos activos usan cada plan
      const uso = {}
      norm(contratosRes)
        .filter(c => c.activo && c.idProveedor?.id === proveedor?.id)
        .forEach(c => {
          const rid = c.idRegla?.id ?? c.idRegla
          if (rid) uso[rid] = (uso[rid] ?? 0) + 1
        })
      setUsoPorPlan(uso)
    } catch (e) {
      setMsg({ ok: false, text: `Error cargando datos: ${e.message}` })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [session])

  /* ── Tramos helpers ── */
  const setTramo    = (i, campo, v) => setTramos(p => p.map((t, idx) => idx === i ? { ...t, [campo]: v } : t))
  const addTramo    = () => setTramos(p => [...p, { tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', porcentajeDesc: '' }])
  const removeTramo = (i) => {
    if (tramos.length === 1) { setMsg({ ok: false, text: 'Debe haber al menos un tramo.' }); return }
    setTramos(p => p.filter((_, idx) => idx !== i))
  }

  const validarTramos = () => {
    for (const t of tramos) {
      if (!t.tipo || t.cantidadMinima === '' || t.porcentajeDesc === '')
        return 'Completa tipo, cantidad mínima y descuento en todos los tramos.'
      if (Number(t.cantidadMinima) < 0) return 'La cantidad mínima no puede ser negativa.'
      if (t.cantidadMaxima !== '' && Number(t.cantidadMaxima) <= Number(t.cantidadMinima))
        return 'La cantidad máxima debe ser mayor a la mínima.'
      if (Number(t.porcentajeDesc) < 0 || Number(t.porcentajeDesc) > 100)
        return 'El descuento debe estar entre 0 y 100.'
    }
    return null
  }

  const crearPlan = async () => {
    setMsg(null)
    if (!form.nombre.trim()) { setMsg({ ok: false, text: 'Escribe un nombre para el plan.' }); return }
    if (!proveedorActual)    { setMsg({ ok: false, text: 'Tu empresa no tiene perfil de proveedor activo.' }); return }
    const err = validarTramos()
    if (err) { setMsg({ ok: false, text: err }); return }

    setSaving(true)
    try {
      const regla = await api.post('/api/v1/tarifas-reglas', {
        nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null,
        activo: true, idProveedor: proveedorActual.id,
      })
      await Promise.all(tramos.map(t => api.post('/api/v1/tramos-tarifa', {
        tipo: t.tipo,
        cantidadMinima: Number(t.cantidadMinima),
        cantidadMaxima: t.cantidadMaxima !== '' ? Number(t.cantidadMaxima) : null,
        porcentajeDesc: Number(t.porcentajeDesc),
        idRegla: regla.id,
      })))
      setMsg({ ok: true, text: 'Plan de descuento creado correctamente.' })
      setForm({ nombre: '', descripcion: '' })
      setTramos([{ tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', porcentajeDesc: '' }])
      setMostrarForm(false)
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error creando plan: ${e.message}` })
    }
    setSaving(false)
  }

  const toggleActivo = async (plan) => {
    try {
      await api.put(`/api/v1/tarifas-reglas/${plan.id}`, { ...plan, activo: !plan.activo })
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error actualizando plan: ${e.message}` })
    }
  }

  const eliminarPlan = async (id) => {
    if (!window.confirm('¿Eliminar este plan? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/v1/tarifas-reglas/${id}`)
      setMsg({ ok: true, text: 'Plan eliminado.' })
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error eliminando plan: ${e.message}` })
    }
  }

  return (
    <div>
      <PageHeader
        title="Planes de descuento"
        subtitle="Descuentos escalonados por volumen o costo de pedido"
        action={
          session?.rol === 'proveedor' && !mostrarForm && (
            <button style={s.newBtn} onClick={() => setMostrarForm(true)}>+ Nuevo plan</button>
          )
        }
      />

      {msg && <div style={{ ...s.alert, ...(msg.ok ? s.alertOk : s.alertErr) }}>{msg.text}</div>}

      {session?.rol !== 'proveedor' && (
        <div style={s.infoBox}>Solo los proveedores pueden gestionar planes de descuento.</div>
      )}

      {/* ── Formulario ── */}
      {mostrarForm && session?.rol === 'proveedor' && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Nuevo plan de descuento</h3>
          <p style={s.formSubtitle}>
            Un plan define tramos de descuento por <strong>volumen</strong> (unidades pedidas) o
            por <strong>costo</strong> (monto total del pedido). Puedes mezclar ambos tipos en un mismo plan.
          </p>

          <div style={s.twoCol}>
            <div>
              <label style={s.label}>Nombre del plan *</label>
              <input style={s.input} value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Descuento mayorista" />
            </div>
            <div>
              <label style={s.label}>Descripción</label>
              <input style={s.input} value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: Aplica para pedidos grandes" />
            </div>
          </div>

          <div style={s.tramosWrap}>
            <div style={s.tramosHead}>
              <div>
                <p style={s.sectionLabel}>Tramos de descuento</p>
                <p style={s.sectionHint}>Cada tramo define un rango (cantidad o monto) y el % de descuento sobre el total del pedido.</p>
              </div>
              <button style={s.addBtn} onClick={addTramo}>+ Agregar tramo</button>
            </div>

            <div style={s.tramoHeader}>
              <span>Tipo</span>
              <span>Desde</span>
              <span>Hasta (vacío = sin límite)</span>
              <span>Descuento %</span>
              <span />
            </div>

            {tramos.map((t, i) => (
              <div key={i} style={s.tramoRow}>
                <select style={s.inputSm} value={t.tipo} onChange={e => setTramo(i, 'tipo', e.target.value)}>
                  <option value="volumen">📦 Volumen (uds.)</option>
                  <option value="costo">💰 Costo (Bs.)</option>
                </select>
                <input style={s.inputSm} type="number" min="0" value={t.cantidadMinima}
                  onChange={e => setTramo(i, 'cantidadMinima', e.target.value)} placeholder="Ej: 10" />
                <input style={s.inputSm} type="number" min="0" value={t.cantidadMaxima}
                  onChange={e => setTramo(i, 'cantidadMaxima', e.target.value)} placeholder="Sin límite" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input style={{ ...s.inputSm, flex: 1 }} type="number" min="0" max="100"
                    value={t.porcentajeDesc} onChange={e => setTramo(i, 'porcentajeDesc', e.target.value)} placeholder="0–100" />
                  <span style={{ fontSize: 13, color: '#9599AE' }}>%</span>
                </div>
                <button style={s.removeBtn} onClick={() => removeTramo(i)}>✕</button>
              </div>
            ))}
          </div>

          {/* Preview live */}
          {tramos.some(t => t.cantidadMinima !== '' && t.porcentajeDesc !== '') && (
            <div style={s.previewBox}>
              <p style={s.previewTitle}>Vista previa del escalado</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[...tramos]
                  .filter(t => t.cantidadMinima !== '' && t.porcentajeDesc !== '')
                  .sort((a, b) => Number(a.cantidadMinima) - Number(b.cantidadMinima))
                  .map((t, i) => (
                    <div key={i} style={s.previewChip}>
                      <span style={s.previewRange}>
                        {t.tipo === 'volumen' ? '📦' : '💰'}{' '}
                        {fmtNum(t.cantidadMinima)}–{fmtNum(t.cantidadMaxima || null)}
                        {t.tipo === 'volumen' ? ' uds.' : ' Bs.'}
                      </span>
                      <span style={s.previewPct}>−{t.porcentajeDesc}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => { setMostrarForm(false); setMsg(null) }}>Cancelar</button>
            <button style={s.saveBtn} onClick={crearPlan} disabled={saving}>
              {saving ? 'Creando...' : 'Crear plan'}
            </button>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <p style={{ color: '#9599AE', fontSize: 13 }}>Cargando planes...</p>
      ) : planes.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={s.emptyTitle}>Sin planes de descuento</p>
          <p style={s.emptySub}>Crea un plan para poder asignarlo a contratos con tus clientes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planes.map(plan => (
            <PlanCard
              key={plan.id} plan={plan}
              usos={usoPorPlan[plan.id] ?? 0}
              onToggle={() => toggleActivo(plan)}
              onDelete={() => eliminarPlan(plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── PlanCard ───────────────────────────────────────────────────────────────── */
function PlanCard({ plan, usos, onToggle, onDelete }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ ...s.planCard, ...(plan.activo ? {} : { opacity: .7 }) }}>
      <div style={s.planHead}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={s.planNombre}>{plan.nombre}</p>
            <span style={{ ...s.badge, ...(plan.activo ? s.badgeOk : s.badgeOff) }}>
              {plan.activo ? 'Activo' : 'Inactivo'}
            </span>
            <span style={s.badgeMuted}>{plan.tramos.length} tramo{plan.tramos.length !== 1 ? 's' : ''}</span>
            <span style={{ ...s.badgeMuted, ...(usos > 0 ? s.badgeUsed : {}) }}>
              {usos > 0 ? `${usos} contrato${usos !== 1 ? 's' : ''} activo${usos !== 1 ? 's' : ''}` : 'Sin contratos'}
            </span>
          </div>
          {plan.descripcion && <p style={s.planDesc}>{plan.descripcion}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={s.toggleBtn} onClick={onToggle} title={plan.activo ? 'Desactivar' : 'Activar'}>
            {plan.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button
            style={{ ...s.deleteBtn, ...(usos > 0 ? s.deleteBtnDisabled : {}) }}
            onClick={usos > 0 ? undefined : onDelete}
            title={usos > 0 ? `No se puede eliminar: ${usos} contrato(s) activo(s) lo usan` : 'Eliminar plan'}
            disabled={usos > 0}>
            Eliminar
          </button>
          <span style={{ color: '#9599AE', fontSize: 16, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {open && (
        <div style={s.planBody}>
          {usos > 0 && (
            <div style={s.usoAlert}>
              <span style={s.usoAlertDot} />
              Este plan está asignado a <strong>{usos} contrato{usos !== 1 ? 's' : ''} activo{usos !== 1 ? 's' : ''}</strong>.
              Modificarlo afectará a todos esos compradores.
            </div>
          )}

          {plan.tramos.length === 0 ? (
            <p style={{ color: '#9599AE', fontSize: 12 }}>Sin tramos definidos.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Tipo</th>
                  <th style={s.th}>Desde</th>
                  <th style={s.th}>Hasta</th>
                  <th style={s.th}>Descuento</th>
                  <th style={s.th}>Cómo funciona</th>
                </tr>
              </thead>
              <tbody>
                {plan.tramos.map((t, i) => {
                  const pct = Number(t.porcentajeDesc)
                  const unidad = t.tipo === 'volumen' ? 'uds.' : 'Bs.'
                  return (
                    <tr key={t.id ?? i} style={i % 2 === 1 ? { background: '#F8F9FF' } : {}}>
                      <td style={s.td}>
                        <span style={{ ...s.tipoBadge, ...(t.tipo === 'volumen' ? s.tipoVol : s.tipoCosto) }}>
                          {t.tipo === 'volumen' ? '📦 Volumen' : '💰 Costo'}
                        </span>
                      </td>
                      <td style={s.tdMono}>{fmtNum(t.cantidadMinima)} {unidad}</td>
                      <td style={s.tdMono}>
                        {t.cantidadMaxima ? `${fmtNum(t.cantidadMaxima)} ${unidad}` : '∞'}
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: '#16a34a' }}>−{pct}%</td>
                      <td style={s.td}>
                        <span style={s.ejemplo}>
                          {t.tipo === 'volumen'
                            ? `Si pides ${fmtNum(t.cantidadMinima)}+ unidades, el total baja −${pct}%`
                            : `Si el pedido supera los Bs. ${fmtNum(t.cantidadMinima)}, el total baja −${pct}%`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  newBtn:       { background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  alert:        { borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 },
  alertOk:      { background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' },
  alertErr:     { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' },
  infoBox:      { background: '#EEF1FB', border: '1px solid #DDE0EE', color: '#06175D', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 },

  formCard:     { background: '#fff', border: '1px solid #E8EBF5', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(6,23,93,0.06)' },
  formTitle:    { margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1A1D3B' },
  formSubtitle: { margin: '0 0 1.25rem', fontSize: 12, color: '#9599AE', lineHeight: 1.6 },
  twoCol:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' },
  label:        { display: 'block', fontSize: 12, fontWeight: 700, color: '#9599AE', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .4 },
  input:        { width: '100%', padding: '9px 12px', border: '1.5px solid #DDE0EE', borderRadius: 8, fontSize: 13, color: '#1A1D3B', outline: 'none', boxSizing: 'border-box' },

  tramosWrap:   { background: '#F8F9FF', border: '1px solid #E8EBF5', borderRadius: 10, padding: '1rem', marginBottom: '1rem' },
  tramosHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sectionLabel: { margin: 0, fontWeight: 700, fontSize: 13, color: '#1A1D3B' },
  sectionHint:  { margin: '2px 0 0', fontSize: 11, color: '#9599AE' },
  addBtn:       { background: '#fff', border: '1.5px solid #06175D', color: '#06175D', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  tramoHeader:  { display: 'grid', gridTemplateColumns: '160px 1fr 1fr 120px 32px', gap: 8, padding: '0 0 6px', marginBottom: 6, borderBottom: '1px solid #E8EBF5', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase' },
  tramoRow:     { display: 'grid', gridTemplateColumns: '160px 1fr 1fr 120px 32px', gap: 8, marginBottom: 8, alignItems: 'center' },
  inputSm:      { width: '100%', padding: '8px 10px', border: '1.5px solid #DDE0EE', borderRadius: 7, fontSize: 13, color: '#1A1D3B', outline: 'none', boxSizing: 'border-box' },
  removeBtn:    { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '8px', fontSize: 12, cursor: 'pointer', fontWeight: 700 },

  previewBox:   { background: '#fff', border: '1px solid #E8EBF5', borderRadius: 8, padding: '10px 12px', marginBottom: '1rem' },
  previewTitle: { margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .4 },
  previewChip:  { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#F0F2FA', borderRadius: 8, padding: '8px 12px', minWidth: 90 },
  previewRange: { fontSize: 11, color: '#9599AE', marginBottom: 4, textAlign: 'center' },
  previewPct:   { fontSize: 16, fontWeight: 800, color: '#06175D' },

  formActions:  { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn:    { padding: '9px 16px', background: '#fff', border: '1.5px solid #DDE0EE', borderRadius: 8, cursor: 'pointer', color: '#9599AE', fontSize: 13 },
  saveBtn:      { padding: '9px 16px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },

  emptyBox:     { textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1px solid #E8EBF5' },
  emptyTitle:   { margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1A1D3B' },
  emptySub:     { margin: 0, fontSize: 13, color: '#9599AE' },

  planCard:     { background: '#fff', border: '1px solid #E8EBF5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(6,23,93,0.04)' },
  planHead:     { display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem' },
  planNombre:   { margin: 0, fontWeight: 800, fontSize: 15, color: '#1A1D3B' },
  planDesc:     { margin: '3px 0 0', fontSize: 12, color: '#9599AE' },
  planBody:     { padding: '0 1.25rem 1.25rem', borderTop: '1px solid #F0F2FA' },

  badge:        { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  badgeOk:      { background: '#dcfce7', color: '#15803d' },
  badgeOff:     { background: '#fee2e2', color: '#991b1b' },
  badgeMuted:   { fontSize: 11, color: '#9599AE', background: '#F0F2FA', borderRadius: 20, padding: '3px 9px', fontWeight: 600 },
  badgeUsed:    { background: '#EEF1FB', color: '#06175D' },

  toggleBtn:    { padding: '5px 12px', background: '#EEF1FB', color: '#06175D', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  deleteBtn:    { padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  deleteBtnDisabled: { opacity: .4, cursor: 'not-allowed' },

  usoAlert:     { display: 'flex', alignItems: 'center', gap: 8, background: '#EEF1FB', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#06175D', margin: '0.75rem 0' },
  usoAlertDot:  { width: 7, height: 7, borderRadius: '50%', background: '#06175D', flexShrink: 0 },

  table:        { width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: 13 },
  th:           { padding: '7px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .4, borderBottom: '1px solid #E8EBF5' },
  td:           { padding: '8px 12px', color: '#1A1D3B', verticalAlign: 'middle' },
  tdMono:       { padding: '8px 12px', color: '#1A1D3B', fontFamily: 'monospace', verticalAlign: 'middle' },
  tipoBadge:    { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  tipoVol:      { background: '#EEF1FB', color: '#06175D' },
  tipoCosto:    { background: '#fef3c7', color: '#92400e' },
  ejemplo:      { fontSize: 12, color: '#9599AE' },
}
