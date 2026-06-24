import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'

const emptyForm = { idProducto: '', precioBase: '', vigenteDesde: '', vigenteHasta: '' }

const toInputDate = (instant) => {
  if (!instant) return ''
  return new Date(instant).toISOString().slice(0, 16)
}

const toInstant = (localStr) => {
  if (!localStr) return null
  return new Date(localStr).toISOString()
}

export default function PreciosBase() {
  const { session } = useAuth()

  const [precios, setPrecios] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: true })
  const [idProveedorActual, setIdProveedorActual] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [editModal, setEditModal] = useState({ open: false, id: null, form: emptyForm })

  const showMsg = (text, ok = true) => setMsg({ text, ok })

  const cargarDatos = async (idProv) => {
    setLoading(true)
    setMsg({ text: '', ok: true })
    try {
      const [provData, preciosData] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/precios-base'),
      ])

      const prov = (provData || []).find(p => p.idEmpresa?.id === session?.id_empresa)
      const resolvedId = idProv ?? prov?.id ?? null
      setIdProveedorActual(resolvedId)

      if (resolvedId) {
        const prodData = await api.get(`/api/v1/products/proveedor/${resolvedId}`)
        setProductos(prodData || [])
        const mios = (preciosData || []).filter(p => p.idProveedor?.id === resolvedId)
        setPrecios(mios)
      } else {
        setProductos([])
        setPrecios([])
        showMsg('Tu empresa no tiene un perfil de proveedor activo.', false)
      }
    } catch (e) {
      showMsg(`Error cargando datos: ${e.message}`, false)
    }
    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const crearPrecio = async () => {
    setMsg({ text: '', ok: true })
    if (!createForm.idProducto || !createForm.precioBase || !createForm.vigenteDesde) {
      showMsg('Producto, precio y fecha "vigente desde" son obligatorios.', false)
      return
    }
    if (!idProveedorActual) {
      showMsg('No se pudo detectar tu proveedor.', false)
      return
    }
    setSaving(true)
    try {
      await api.post('/api/v1/precios-base', {
        idProducto: createForm.idProducto,
        idProveedor: idProveedorActual,
        precioBase: Number(createForm.precioBase),
        vigenteDesde: toInstant(createForm.vigenteDesde),
        vigenteHasta: toInstant(createForm.vigenteHasta) || null,
      })
      showMsg('Precio registrado correctamente.')
      setCreateForm(emptyForm)
      await cargarDatos(idProveedorActual)
    } catch (e) {
      showMsg(`Error: ${e.message}`, false)
    }
    setSaving(false)
  }

  const guardarEdicion = async () => {
    const { id, form } = editModal
    setSaving(true)
    try {
      await api.put(`/api/v1/precios-base/${id}`, {
        precioBase: Number(form.precioBase),
        vigenteDesde: toInstant(form.vigenteDesde),
        vigenteHasta: toInstant(form.vigenteHasta) || null,
        idProveedor: idProveedorActual,
        idProducto: form.idProducto,
      })
      showMsg('Precio actualizado.')
      setEditModal({ open: false, id: null, form: emptyForm })
      await cargarDatos(idProveedorActual)
    } catch (e) {
      showMsg(`Error actualizando: ${e.message}`, false)
    }
    setSaving(false)
  }

  const eliminar = async (id) => {
    try {
      await api.delete(`/api/v1/precios-base/${id}`)
      setDeletingId(null)
      showMsg('Precio eliminado.')
      await cargarDatos(idProveedorActual)
    } catch (e) {
      showMsg(`Error eliminando: ${e.message}`, false)
    }
  }

  const abrirEditar = (p) =>
    setEditModal({
      open: true,
      id: p.id,
      form: {
        idProducto: p.idProducto?.id || '',
        precioBase: p.precioBase ?? '',
        vigenteDesde: toInputDate(p.vigenteDesde),
        vigenteHasta: toInputDate(p.vigenteHasta),
      },
    })

  const hoy = new Date()
  const esVigente = (p) => {
    const desde = p.vigenteDesde ? new Date(p.vigenteDesde) : null
    const hasta = p.vigenteHasta ? new Date(p.vigenteHasta) : null
    return desde && desde <= hoy && (!hasta || hasta >= hoy)
  }

  const formatBOB = (val) =>
    Number(val).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })

  const formatFecha = (instant) =>
    instant ? new Date(instant).toLocaleDateString('es-BO') : '—'

  return (
    <div>
      <PageHeader
        title="Precios base"
        subtitle="Configura el precio de cada producto para que las órdenes calculen el total correctamente"
        action={<button onClick={() => cargarDatos(idProveedorActual)} style={styles.refreshBtn}>↺ Actualizar</button>}
      />

      {msg.text && (
        <div style={{
          ...styles.msg,
          borderColor: msg.ok ? '#bbf7d0' : '#fecaca',
          background: msg.ok ? '#f0fdf4' : '#fef2f2',
          color: msg.ok ? '#15803d' : '#b91c1c',
        }}>
          {msg.text}
        </div>
      )}

      {/* Formulario crear */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Agregar precio</h3>
        <div style={styles.grid}>
          <div style={styles.full}>
            <label style={styles.label}>Producto <span style={{ color: '#dc2626' }}>*</span></label>
            <select style={styles.input} value={createForm.idProducto}
              onChange={e => setCreateForm({ ...createForm, idProducto: e.target.value })}>
              <option value="">Selecciona un producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.sku ? `(${p.sku})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Precio base (Bs) <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={styles.input} type="number" min="0" step="0.01" value={createForm.precioBase}
              onChange={e => setCreateForm({ ...createForm, precioBase: e.target.value })}
              placeholder="Ej: 150.00" />
          </div>
          <div>
            <label style={styles.label}>Vigente desde <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={styles.input} type="datetime-local" value={createForm.vigenteDesde}
              onChange={e => setCreateForm({ ...createForm, vigenteDesde: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Vigente hasta <span style={{ color: '#94a3b8', fontSize: '11px' }}>(opcional — indefinido si vacío)</span></label>
            <input style={styles.input} type="datetime-local" value={createForm.vigenteHasta}
              onChange={e => setCreateForm({ ...createForm, vigenteHasta: e.target.value })} />
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.clearBtn} onClick={() => setCreateForm(emptyForm)} disabled={saving}>Limpiar</button>
          <button style={styles.saveBtn} onClick={crearPrecio} disabled={saving}>
            {saving ? 'Guardando...' : 'Agregar precio'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={styles.empty}><div style={styles.spinner} /> Cargando...</div>
        ) : precios.length === 0 ? (
          <p style={styles.emptyText}>No hay precios configurados. Agrega uno arriba.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Producto', 'SKU', 'Precio base', 'Vigente desde', 'Vigente hasta', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {precios.map((p, i) => {
                const vigente = esVigente(p)
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-bg-subtle)' }}>
                    <td style={styles.td}>{p.idProducto?.nombre || p.nombreProducto || '—'}</td>
                    <td style={styles.td}>{p.idProducto?.sku || '—'}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: 'var(--c-text)' }}>{formatBOB(p.precioBase)}</td>
                    <td style={styles.td}>{formatFecha(p.vigenteDesde)}</td>
                    <td style={styles.td}>{formatFecha(p.vigenteHasta)}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
                        background: vigente ? '#dcfce7' : '#EEF1FB',
                        color: vigente ? '#166534' : '#9599AE',
                      }}>
                        {vigente ? 'Vigente' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {deletingId === p.id ? (
                        <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#9599AE' }}>¿Eliminar?</span>
                          <button style={styles.btnDanger} onClick={() => eliminar(p.id)}>Sí</button>
                          <button style={styles.btnGhost} onClick={() => setDeletingId(null)}>No</button>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', gap: '6px' }}>
                          <button style={styles.btnEdit} onClick={() => abrirEditar(p)}>Editar</button>
                          <button style={styles.btnDel} onClick={() => setDeletingId(p.id)}>Eliminar</button>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal editar */}
      {editModal.open && (
        <div style={styles.overlay} onClick={() => setEditModal({ open: false, id: null, form: emptyForm })}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '16px', color: 'var(--c-text)' }}>Editar precio</h3>
            <div style={styles.grid}>
              <div style={styles.full}>
                <label style={styles.label}>Producto</label>
                <select style={styles.input} value={editModal.form.idProducto}
                  onChange={e => setEditModal({ ...editModal, form: { ...editModal.form, idProducto: e.target.value } })}>
                  <option value="">Selecciona un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.sku ? `(${p.sku})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Precio base (Bs)</label>
                <input style={styles.input} type="number" min="0" step="0.01" value={editModal.form.precioBase}
                  onChange={e => setEditModal({ ...editModal, form: { ...editModal.form, precioBase: e.target.value } })} />
              </div>
              <div>
                <label style={styles.label}>Vigente desde</label>
                <input style={styles.input} type="datetime-local" value={editModal.form.vigenteDesde}
                  onChange={e => setEditModal({ ...editModal, form: { ...editModal.form, vigenteDesde: e.target.value } })} />
              </div>
              <div>
                <label style={styles.label}>Vigente hasta <span style={{ color: '#94a3b8', fontSize: '11px' }}>(opcional)</span></label>
                <input style={styles.input} type="datetime-local" value={editModal.form.vigenteHasta}
                  onChange={e => setEditModal({ ...editModal, form: { ...editModal.form, vigenteHasta: e.target.value } })} />
              </div>
            </div>
            <div style={styles.actions}>
              <button style={styles.clearBtn}
                onClick={() => setEditModal({ open: false, id: null, form: emptyForm })}
                disabled={saving}>Cancelar</button>
              <button style={styles.saveBtn} onClick={guardarEdicion} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  refreshBtn: { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--c-muted)' },
  msg: { border: '1px solid', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px' },
  card: { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  cardTitle: { margin: '0 0 1rem', fontSize: '16px', color: 'var(--c-text)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  full: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--c-muted)', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--c-border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'var(--c-input-bg)', color: 'var(--c-text)', outline: 'none' },
  actions: { marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  clearBtn: { padding: '10px 16px', background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1.5px solid var(--c-border)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { padding: '10px 16px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  tableWrapper: { overflowX: 'auto', border: '1px solid var(--c-border)', borderRadius: '10px', background: 'var(--c-bg)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '10px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: '700', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--c-border)' },
  td: { padding: '9px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  empty: { display: 'flex', alignItems: 'center', gap: '10px', padding: '2rem', color: 'var(--c-muted)', fontSize: '14px' },
  emptyText: { color: 'var(--c-muted)', padding: '1.5rem', fontSize: '14px', margin: 0 },
  spinner: { width: '16px', height: '16px', border: '2px solid var(--c-border)', borderTop: '2px solid var(--c-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  btnEdit: { padding: '5px 12px', fontSize: '12px', fontWeight: '600', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: '1px solid var(--c-border)', borderRadius: '6px', cursor: 'pointer' },
  btnDel: { padding: '5px 12px', fontSize: '12px', fontWeight: '600', background: 'var(--c-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' },
  btnDanger: { padding: '4px 10px', fontSize: '12px', fontWeight: '600', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnGhost: { padding: '4px 10px', fontSize: '12px', fontWeight: '600', background: 'var(--c-border-light)', color: 'var(--c-muted)', border: '1px solid var(--c-border)', borderRadius: '6px', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(6,23,93,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--c-bg)', borderRadius: '12px', padding: '1.5rem', width: '540px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(6,23,93,0.2)' },
}
