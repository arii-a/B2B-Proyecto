import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const BLANK = { nombres: '', apellidos: '', idCargoEmpresa: '' }

function initials(nombres, apellidos) {
  return ((nombres?.[0] ?? '') + (apellidos?.[0] ?? '')).toUpperCase() || '?'
}

export default function Contactos() {
  const { session } = useAuth()

  const [contactos, setContactos] = useState([])
  const [cargos,    setCargos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [msg,       setMsg]       = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState(BLANK)
  const [saving,    setSaving]    = useState(false)

  const empresaId = session?.id_empresa

  const showMsg = (ok, text) => {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 8000)
  }

  const cargar = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const [contRes, cargoRes] = await Promise.all([
        api.get('/api/v1/contactos-empresa'),
        api.get('/api/v1/cargos-empresa'),
      ])
      setContactos(norm(contRes).filter(c => c.idEmpresa?.id === empresaId))
      setCargos(norm(cargoRes))
    } catch (e) {
      showMsg(false, e.message)
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [empresaId])

  const abrirNuevo = () => {
    setForm(BLANK)
    setEditando(null)
    setShowForm(true)
    setMsg(null)
  }

  const abrirEditar = (c) => {
    setForm({ nombres: c.nombres ?? '', apellidos: c.apellidos ?? '', idCargoEmpresa: '' })
    setEditando(c)
    setShowForm(true)
    setMsg(null)
  }

  const cancelar = () => { setShowForm(false); setEditando(null); setForm(BLANK) }

  const guardar = async () => {
    if (!form.nombres || !form.apellidos) { showMsg(false, 'Nombres y apellidos son requeridos.'); return }
    if (!form.idCargoEmpresa) { showMsg(false, 'Selecciona un cargo.'); return }
    setSaving(true); setMsg(null)
    try {
      const body = { nombres: form.nombres, apellidos: form.apellidos, idCargoEmpresa: form.idCargoEmpresa, idEmpresa: empresaId }
      if (editando) {
        await api.put(`/api/v1/contactos-empresa/${editando.id}`, body)
        showMsg(true, 'Contacto actualizado.')
      } else {
        await api.post('/api/v1/contactos-empresa', body)
        showMsg(true, 'Contacto agregado.')
      }
      cancelar()
      cargar()
    } catch (e) {
      showMsg(false, e.message || 'Error al guardar.')
    }
    setSaving(false)
  }

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar el contacto "${c.nombres} ${c.apellidos}"?`)) return
    try {
      await api.delete(`/api/v1/contactos-empresa/${c.id}`)
      showMsg(true, 'Contacto eliminado.')
      cargar()
    } catch (e) {
      showMsg(false, e.message)
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Contactos"
        subtitle={`${contactos.length} contacto${contactos.length !== 1 ? 's' : ''} registrado${contactos.length !== 1 ? 's' : ''}`}
        action={!showForm && <button style={s.newBtn} onClick={abrirNuevo}>+ Nuevo contacto</button>}
      />

      {msg && (
        <div style={{ ...s.alert, ...(msg.ok ? s.alertOk : s.alertErr) }}>{msg.text}</div>
      )}

      {/* Formulario */}
      {showForm && (
        <div style={s.formCard}>
          <p style={s.formTitle}>{editando ? 'Editar contacto' : 'Nuevo contacto'}</p>
          <div style={s.formGrid}>
            <div>
              <label style={s.label}>Nombres *</label>
              <input style={s.input} value={form.nombres} onChange={e => f('nombres', e.target.value)} placeholder="Ej: Ana María" />
            </div>
            <div>
              <label style={s.label}>Apellidos *</label>
              <input style={s.input} value={form.apellidos} onChange={e => f('apellidos', e.target.value)} placeholder="Ej: García López" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Cargo *</label>
              {cargos.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: '#d97706' }}>No hay cargos disponibles en el sistema.</p>
              ) : (
                <select style={s.input} value={form.idCargoEmpresa} onChange={e => f('idCargoEmpresa', e.target.value)}>
                  <option value="">Selecciona un cargo...</option>
                  {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              )}
            </div>
          </div>
          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={cancelar} disabled={saving}>Cancelar</button>
            <button style={s.saveBtn} onClick={guardar} disabled={saving || cargos.length === 0}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar contacto'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>Cargando...</p>
      ) : contactos.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>Sin contactos registrados</p>
          <p style={s.emptySub}>Agrega los contactos de tu empresa con el botón de arriba.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {contactos.map(c => (
            <div key={c.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.avatar}>{initials(c.nombres, c.apellidos)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.cardNombre}>{c.nombres} {c.apellidos}</p>
                  <span style={s.cargoBadge}>{c.nombreCargoEmpresa ?? '—'}</span>
                </div>
              </div>
              <div style={s.cardActions}>
                <button style={s.btnEdit} onClick={() => abrirEditar(c)}>Editar</button>
                <button style={s.btnDel}  onClick={() => eliminar(c)}>Eliminar</button>
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
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: '9px 16px', background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--c-muted)', fontSize: 13 },
  saveBtn:   { padding: '9px 16px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },

  empty:     { textAlign: 'center', padding: '3rem', background: 'var(--c-bg)', borderRadius: 12, border: '1px solid var(--c-border)' },
  emptyTitle:{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--c-text)' },
  emptySub:  { margin: 0, fontSize: 13, color: 'var(--c-muted)' },

  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 },
  card:       { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 },
  cardTop:    { display: 'flex', gap: 12, alignItems: 'center' },
  avatar:     { width: 44, height: 44, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 },
  cardNombre: { margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--c-text)' },
  cargoBadge: { fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: 'var(--c-primary-light)', color: 'var(--c-primary)' },
  cardActions:{ display: 'flex', gap: 6, borderTop: '1px solid var(--c-border-light)', paddingTop: 10 },
  btnEdit:    { flex: 1, padding: '6px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnDel:     { padding: '6px 10px', background: 'var(--c-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
}
