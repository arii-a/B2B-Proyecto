import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const BLANK = { nombre: '', direccion: '', coordenadas: '', activo: true }

export default function Sucursales() {
  const { session } = useAuth()

  const [sucursales, setSucursales] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [msg,        setMsg]        = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [editando,   setEditando]   = useState(null)   // { id, ...form } cuando edita
  const [form,       setForm]       = useState(BLANK)
  const [saving,     setSaving]     = useState(false)

  const empresaId = session?.id_empresa

  const cargar = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await api.get('/api/v1/sucursales-empresa')
      setSucursales(norm(res).filter(s => s.idEmpresa?.id === empresaId))
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [empresaId])

  const abrirNueva = () => {
    setForm(BLANK)
    setEditando(null)
    setShowForm(true)
    setMsg(null)
  }

  const abrirEditar = (s) => {
    setForm({ nombre: s.nombre ?? '', direccion: s.direccion ?? '', coordenadas: s.coordenadas ?? '', activo: s.activo })
    setEditando(s)
    setShowForm(true)
    setMsg(null)
  }

  const cancelar = () => { setShowForm(false); setEditando(null); setForm(BLANK) }

  const guardar = async () => {
    if (!form.nombre || !form.direccion) { setMsg({ ok: false, text: 'Nombre y dirección son requeridos.' }); return }
    setSaving(true); setMsg(null)
    try {
      const body = { nombre: form.nombre, direccion: form.direccion, coordenadas: form.coordenadas || null, activo: form.activo, idEmpresa: empresaId }
      if (editando) {
        await api.put(`/api/v1/sucursales-empresa/${editando.id}`, body)
        setMsg({ ok: true, text: 'Sucursal actualizada.' })
      } else {
        await api.post('/api/v1/sucursales-empresa', body)
        setMsg({ ok: true, text: 'Sucursal creada.' })
      }
      cancelar()
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Error al guardar.' })
    }
    setSaving(false)
  }

  const toggleActivo = async (s) => {
    try {
      await api.put(`/api/v1/sucursales-empresa/${s.id}`, {
        nombre: s.nombre, direccion: s.direccion, coordenadas: s.coordenadas || null,
        activo: !s.activo, idEmpresa: empresaId,
      })
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
  }

  const eliminar = async (s) => {
    if (!window.confirm(`¿Eliminar la sucursal "${s.nombre}"?`)) return
    try {
      await api.delete(`/api/v1/sucursales-empresa/${s.id}`)
      setMsg({ ok: true, text: 'Sucursal eliminada.' })
      cargar()
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Sucursales"
        subtitle={`${sucursales.length} sucursal${sucursales.length !== 1 ? 'es' : ''} registrada${sucursales.length !== 1 ? 's' : ''}`}
        action={!showForm && <button style={s.newBtn} onClick={abrirNueva}>+ Nueva sucursal</button>}
      />

      {msg && (
        <div style={{ ...s.alert, ...(msg.ok ? s.alertOk : s.alertErr) }}>{msg.text}</div>
      )}

      {/* Formulario */}
      {showForm && (
        <div style={s.formCard}>
          <p style={s.formTitle}>{editando ? 'Editar sucursal' : 'Nueva sucursal'}</p>
          <div style={s.formGrid}>
            <div>
              <label style={s.label}>Nombre *</label>
              <input style={s.input} value={form.nombre} onChange={e => f('nombre', e.target.value)} placeholder="Ej: Oficina Central" />
            </div>
            <div>
              <label style={s.label}>Dirección *</label>
              <input style={s.input} value={form.direccion} onChange={e => f('direccion', e.target.value)} placeholder="Ej: Av. Arce 123, La Paz" />
            </div>
            <div>
              <label style={s.label}>Coordenadas (opcional)</label>
              <input style={s.input} value={form.coordenadas} onChange={e => f('coordenadas', e.target.value)} placeholder="Ej: -16.5000, -68.1500" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <label style={s.label}>Estado</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 1 }}>
                {[true, false].map(v => (
                  <button key={String(v)}
                    style={{ ...s.toggleBtn, ...(form.activo === v ? s.toggleBtnActive : {}) }}
                    onClick={() => f('activo', v)}>
                    {v ? 'Activo' : 'Inactivo'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={cancelar} disabled={saving}>Cancelar</button>
            <button style={s.saveBtn} onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear sucursal'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>Cargando...</p>
      ) : sucursales.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>Sin sucursales registradas</p>
          <p style={s.emptySub}>Crea tu primera sucursal con el botón de arriba.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {sucursales.map(suc => (
            <div key={suc.id} style={{ ...s.card, opacity: suc.activo ? 1 : 0.6 }}>
              <div style={s.cardTop}>
                <div style={s.cardIcon}>🏢</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.cardNombre}>{suc.nombre}</p>
                  <p style={s.cardDir}>{suc.direccion}</p>
                  {suc.coordenadas && (
                    <p style={s.cardCoord}>📍 {suc.coordenadas}</p>
                  )}
                </div>
                <span style={{ ...s.badge, ...(suc.activo ? s.badgeOk : s.badgeOff) }}>
                  {suc.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div style={s.cardActions}>
                <button style={s.btnEdit} onClick={() => abrirEditar(suc)}>Editar</button>
                <button style={s.btnToggle} onClick={() => toggleActivo(suc)}>
                  {suc.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button style={s.btnDel} onClick={() => eliminar(suc)}>Eliminar</button>
              </div>
            </div>
          ))}
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

  formCard:  { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' },
  formTitle: { margin: '0 0 1rem', fontWeight: 700, fontSize: 15, color: 'var(--c-text)' },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' },
  label:     { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 5 },
  input:     { width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 13, color: 'var(--c-text)', background: 'var(--c-input-bg)', outline: 'none', boxSizing: 'border-box' },
  toggleBtn: { padding: '7px 14px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--c-bg)', color: 'var(--c-muted)' },
  toggleBtnActive: { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: '9px 16px', background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--c-muted)', fontSize: 13 },
  saveBtn:   { padding: '9px 16px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },

  empty:     { textAlign: 'center', padding: '3rem', background: 'var(--c-bg)', borderRadius: 12, border: '1px solid var(--c-border)' },
  emptyTitle:{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--c-text)' },
  emptySub:  { margin: 0, fontSize: 13, color: 'var(--c-muted)' },

  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 },
  card:      { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 },
  cardTop:   { display: 'flex', gap: 12, alignItems: 'flex-start' },
  cardIcon:  { width: 40, height: 40, borderRadius: 10, background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  cardNombre:{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--c-text)' },
  cardDir:   { margin: '2px 0 0', fontSize: 12, color: 'var(--c-muted)' },
  cardCoord: { margin: '3px 0 0', fontSize: 11, color: 'var(--c-muted)', fontFamily: 'monospace' },
  badge:     { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0 },
  badgeOk:   { background: '#dcfce7', color: '#15803d' },
  badgeOff:  { background: '#fee2e2', color: '#991b1b' },
  cardActions:{ display: 'flex', gap: 6, borderTop: '1px solid var(--c-border-light)', paddingTop: 10 },
  btnEdit:   { flex: 1, padding: '6px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnToggle: { flex: 1, padding: '6px', background: 'var(--c-bg-subtle)', color: 'var(--c-muted)', border: '1px solid var(--c-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnDel:    { padding: '6px 10px', background: 'var(--c-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
}
