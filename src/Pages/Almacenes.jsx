import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const empty = { nombre: '', direccion: '', activo: true }

export default function Almacenes() {
  const { session } = useAuth()
  const [proveedor,  setProveedor]  = useState(null)
  const [almacenes,  setAlmacenes]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [msg,        setMsg]        = useState(null)
  const [modal,      setModal]      = useState(null)   // null | { modo:'crear'|'editar', form, id? }
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)

  const cargar = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const [provRes, almRes] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/almacenes'),
      ])
      const prov = norm(provRes).find(p => p.idEmpresa?.id === session?.id_empresa && p.activo)
      if (!prov) { setMsg({ ok: false, text: 'Tu empresa no tiene perfil de proveedor activo.' }); setLoading(false); return }
      setProveedor(prov)
      setAlmacenes(norm(almRes).filter(a => a.idProveedor?.id === prov.id))
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [session])

  const abrirCrear = () => setModal({ modo: 'crear', form: { ...empty } })
  const abrirEditar = (a) => setModal({ modo: 'editar', id: a.id, form: { nombre: a.nombre, direccion: a.direccion ?? '', activo: a.activo } })

  const guardar = async () => {
    if (!modal.form.nombre.trim()) { setMsg({ ok: false, text: 'El nombre es obligatorio.' }); return }
    if (!proveedor) { setMsg({ ok: false, text: 'Sin perfil de proveedor activo.' }); return }
    setSaving(true); setMsg(null)
    try {
      const body = { nombre: modal.form.nombre, direccion: modal.form.direccion || null, activo: modal.form.activo, idProveedor: proveedor.id }
      if (modal.modo === 'crear') {
        await api.post('/api/v1/almacenes', body)
        setMsg({ ok: true, text: 'Almacén creado.' })
      } else {
        await api.put(`/api/v1/almacenes/${modal.id}`, body)
        setMsg({ ok: true, text: 'Almacén actualizado.' })
      }
      setModal(null)
      await cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSaving(false)
  }

  const eliminar = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/api/v1/almacenes/${id}`)
      setMsg({ ok: true, text: 'Almacén eliminado.' })
      await cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error al eliminar: ${e.message}` })
    }
    setDeleting(null)
  }

  const setForm = (fn) => setModal(m => ({ ...m, form: fn(m.form) }))

  return (
    <div>
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <p style={s.modalTitle}>{modal.modo === 'crear' ? 'Nuevo almacén' : 'Editar almacén'}</p>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={s.label}>Nombre *</label>
                <input style={s.input} placeholder="Almacén Central" value={modal.form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
              </div>
              <div>
                <label style={s.label}>Dirección</label>
                <input style={s.input} placeholder="Calle, ciudad..." value={modal.form.direccion}
                  onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
              </div>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={modal.form.activo}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                Almacén activo
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancelar</button>
              <button style={s.saveBtn} onClick={guardar} disabled={saving}>
                {saving ? 'Guardando...' : modal.modo === 'crear' ? 'Crear almacén' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Almacenes"
        subtitle={`${almacenes.length} almacén${almacenes.length !== 1 ? 'es' : ''} registrado${almacenes.length !== 1 ? 's' : ''}`}
        action={<button style={s.newBtn} onClick={abrirCrear}>+ Nuevo almacén</button>}
      />

      {msg && <div style={{ ...s.alert, ...(msg.ok ? s.alertOk : s.alertErr) }}>{msg.text}</div>}

      {loading ? (
        <p style={s.muted}>Cargando...</p>
      ) : almacenes.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={s.emptyTitle}>Sin almacenes</p>
          <p style={s.emptySub}>Crea tu primer almacén para poder gestionar el stock de tus productos.</p>
          <button style={{ ...s.newBtn, marginTop: 16 }} onClick={abrirCrear}>+ Crear almacén</button>
        </div>
      ) : (
        <div style={s.grid}>
          {almacenes.map(a => (
            <div key={a.id} style={s.card}>
              <div style={s.cardHead}>
                <div>
                  <p style={s.cardNombre}>{a.nombre}</p>
                  {a.direccion && <p style={s.cardDir}>{a.direccion}</p>}
                </div>
                <span style={{ ...s.badge, ...(a.activo ? s.badgeOk : s.badgeOff) }}>
                  {a.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div style={s.cardActions}>
                <button style={s.editBtn} onClick={() => abrirEditar(a)}>Editar</button>
                <button style={s.delBtn}
                  onClick={() => eliminar(a.id)}
                  disabled={deleting === a.id}>
                  {deleting === a.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  alert:      { borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 },
  alertOk:    { background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' },
  alertErr:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' },
  newBtn:     { background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  muted:      { color: '#9599AE', fontSize: 13 },

  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', borderRadius: 16, padding: '1.5rem', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: 0 },
  modalHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 800, color: '#1A1D3B' },
  closeBtn:   { background: 'none', border: 'none', color: '#9599AE', cursor: 'pointer', fontSize: 18, padding: 4 },
  label:      { display: 'block', fontSize: 11, fontWeight: 700, color: '#9599AE', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 },
  input:      { width: '100%', padding: '9px 11px', border: '1.5px solid #DDE0EE', borderRadius: 8, fontSize: 13, color: '#1A1D3B', outline: 'none', boxSizing: 'border-box' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A1D3B', cursor: 'pointer' },
  saveBtn:    { padding: '9px 20px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  cancelBtn:  { padding: '9px 16px', background: '#fff', border: '1.5px solid #DDE0EE', borderRadius: 8, cursor: 'pointer', color: '#9599AE', fontSize: 13 },

  emptyBox:   { textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #E8EBF5' },
  emptyTitle: { margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1A1D3B' },
  emptySub:   { margin: 0, fontSize: 13, color: '#9599AE' },

  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  card:       { background: '#fff', border: '1px solid #E8EBF5', borderRadius: 14, padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(6,23,93,0.04)', display: 'flex', flexDirection: 'column', gap: 14 },
  cardHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardNombre: { margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: '#1A1D3B' },
  cardDir:    { margin: 0, fontSize: 12, color: '#9599AE' },
  badge:      { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 },
  badgeOk:    { background: '#dcfce7', color: '#15803d' },
  badgeOff:   { background: '#fee2e2', color: '#991b1b' },
  cardActions:{ display: 'flex', gap: 8 },
  editBtn:    { flex: 1, padding: '7px', background: '#EEF1FB', color: '#06175D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  delBtn:     { flex: 1, padding: '7px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
}
