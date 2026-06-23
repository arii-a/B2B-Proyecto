import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const PAGE_SIZE = 12
const EMPTY_CREATE = { nombre: '', email: '', password: '', idRol: '', idEmpresa: '', activo: true }

export default function AdminUsuarios() {
  const [data,          setData]          = useState([])
  const [roles,         setRoles]         = useState([])
  const [empresas,      setEmpresas]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search,        setSearch]        = useState('')

  const [selected,  setSelected]  = useState(null)
  const [editing,   setEditing]   = useState(false)
  const [editForm,  setEditForm]  = useState({})
  const [creating,  setCreating]  = useState(false)
  const [createForm,setCreateForm]= useState(EMPTY_CREATE)
  const [saving,    setSaving]    = useState(false)
  const [feedback,  setFeedback]  = useState(null)

  const cargar = async (p = 0) => {
    setLoading(true)
    try {
      const [res, rolesRes, empresasRes] = await Promise.all([
        api.get(`/api/v1/usuarios?page=${p}&size=${PAGE_SIZE}&sortBy=nombre&sortDir=ASC`),
        api.get('/api/v1/roles').catch(() => []),
        api.get('/api/v1/empresas').catch(() => []),
      ])
      setData(res.content ?? [])
      setTotalPages(res.totalPages ?? 0)
      setTotalElements(res.totalElements ?? 0)
      setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes?.content ?? []))
      const emp = Array.isArray(empresasRes) ? empresasRes : (empresasRes?.content ?? [])
      setEmpresas(emp)
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { cargar(0) }, [])

  const cambiarPagina = (p) => { setPage(p); cargar(p); setSelected(null) }

  const filtrados = search.trim()
    ? data.filter(u =>
        u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.nombreEmpresa?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  const openPanel = (u) => {
    setCreating(false)
    setSelected(u)
    setEditing(false)
    setFeedback(null)
    setEditForm({
      nombre:     u.nombre    ?? '',
      email:      u.email     ?? '',
      activo:     u.activo    ?? true,
      idRol:      u.idRol?.id ?? u.idRol ?? '',
      idEmpresa:  u.idEmpresa?.id ?? '',
    })
  }

  const openCreate = () => {
    setSelected(null)
    setEditing(false)
    setFeedback(null)
    setCreateForm(EMPTY_CREATE)
    setCreating(true)
  }

  const closePanel = () => { setSelected(null); setCreating(false); setEditing(false); setFeedback(null) }

  const saveEdit = async () => {
    setSaving(true); setFeedback(null)
    try {
      await api.put(`/api/v1/usuarios/${selected.id}`, {
        nombre:     editForm.nombre,
        email:      editForm.email,
        activo:     editForm.activo,
        idEmpresa:  editForm.idEmpresa || null,
        idSucursal: selected.idSucursal?.id ?? null,
        idRol:      editForm.idRol || null,
      })
      setFeedback({ ok: true, msg: 'Usuario actualizado correctamente.' })
      setEditing(false)
      await cargar(page)
      setSelected(prev => ({
        ...prev, ...editForm,
        nombreRol: roles.find(r => r.id === editForm.idRol)?.nombre ?? prev.nombreRol,
        nombreEmpresa: empresas.find(e => e.id === editForm.idEmpresa)?.nombre ?? prev.nombreEmpresa,
      }))
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error al guardar.' }) }
    setSaving(false)
  }

  const saveCreate = async () => {
    if (!createForm.nombre.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setFeedback({ ok: false, msg: 'Nombre, email y contraseña son obligatorios.' })
      return
    }
    setSaving(true); setFeedback(null)
    try {
      await api.post('/api/v1/usuarios', {
        nombre:    createForm.nombre,
        email:     createForm.email,
        password:  createForm.password,
        activo:    createForm.activo,
        idEmpresa: createForm.idEmpresa || null,
        idRol:     createForm.idRol || null,
      })
      setFeedback({ ok: true, msg: 'Usuario creado correctamente.' })
      setCreateForm(EMPTY_CREATE)
      await cargar(page)
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error al crear usuario.' }) }
    setSaving(false)
  }

  const panelOpen = selected !== null || creating

  return (
    <div>
      <PageHeader title="Usuarios" subtitle={`${totalElements} usuarios registrados`} />

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9599AE" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={s.searchInput}
            placeholder="Buscar por nombre, email o empresa..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null) }}
          />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>
        <button style={s.btnNew} onClick={openCreate}>+ Nuevo usuario</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Tabla */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.tableWrap}>
            {loading ? (
              <p style={s.empty}>Cargando...</p>
            ) : filtrados.length === 0 ? (
              <p style={s.empty}>{search ? `Sin resultados para "${search}"` : 'Sin datos.'}</p>
            ) : (
              <>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Nombre', 'Email', 'Empresa', 'Rol', 'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((u, i) => {
                      const sel = selected?.id === u.id
                      return (
                        <tr
                          key={u.id}
                          onClick={() => openPanel(u)}
                          style={{
                            background: sel ? '#EEF1FB' : i % 2 === 0 ? '#fff' : '#F7F8FC',
                            cursor: 'pointer',
                            borderLeft: `3px solid ${sel ? '#06175D' : 'transparent'}`,
                          }}
                        >
                          <td style={{ ...s.td, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ ...s.avatar, background: u.avatarUrl ? 'transparent' : strColor(u.nombre), overflow: 'hidden' }}>
                                {u.avatarUrl
                                  ? <img src={u.avatarUrl} alt={u.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : u.nombre?.charAt(0)?.toUpperCase() ?? '?'}
                              </div>
                              {u.nombre}
                            </div>
                          </td>
                          <td style={{ ...s.td, color: '#9599AE' }}>{u.email}</td>
                          <td style={s.td}>{u.nombreEmpresa || '—'}</td>
                          <td style={s.td}><RolChip rol={u.nombreRol} /></td>
                          <td style={s.td}>
                            <span style={{ color: u.activo ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 12 }}>
                              ● {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {totalPages > 1 && !search && (
                  <Paginacion page={page} totalPages={totalPages} totalElements={totalElements} pageSize={PAGE_SIZE} onChange={cambiarPagina} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        {panelOpen && (
          <div style={s.panel}>
            {/* Header */}
            <div style={s.panelHead}>
              {creating ? (
                <div style={{ flex: 1 }}>
                  <p style={s.panelNombre}>Nuevo usuario</p>
                  <p style={s.panelSub}>Completa los datos para crear la cuenta</p>
                </div>
              ) : (
                <>
                  <div style={{ ...s.panelAvatar, background: selected.avatarUrl ? 'transparent' : strColor(selected.nombre), overflow: 'hidden' }}>
                    {selected.avatarUrl
                      ? <img src={selected.avatarUrl} alt={selected.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : selected.nombre?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.panelNombre}>{selected.nombre}</p>
                    <p style={s.panelSub}>{selected.email}</p>
                  </div>
                </>
              )}
              <button style={s.closeBtn} onClick={closePanel}>✕</button>
            </div>

            {feedback && (
              <div style={{ margin: '0 1rem 8px', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                background: feedback.ok ? '#f0fdf4' : '#fef2f2',
                color:      feedback.ok ? '#16a34a'  : '#dc2626',
                border: `1px solid ${feedback.ok ? '#bbf7d0' : '#fca5a5'}` }}>
                {feedback.msg}
              </div>
            )}

            <div style={s.panelScroll}>
              {/* ── CREAR ── */}
              {creating && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FieldWrap label="Nombre completo *">
                    <input style={s.input} placeholder="Juan Pérez" value={createForm.nombre}
                      onChange={e => setCreateForm(f => ({ ...f, nombre: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Email *">
                    <input style={s.input} type="email" placeholder="usuario@empresa.com" value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Contraseña *">
                    <input style={s.input} type="password" placeholder="Contraseña inicial" value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                  </FieldWrap>
                  {roles.length > 0 && (
                    <FieldWrap label="Rol">
                      <select style={s.input} value={createForm.idRol}
                        onChange={e => setCreateForm(f => ({ ...f, idRol: e.target.value }))}>
                        <option value="">Sin rol</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </FieldWrap>
                  )}
                  {empresas.length > 0 && (
                    <FieldWrap label="Empresa">
                      <select style={s.input} value={createForm.idEmpresa}
                        onChange={e => setCreateForm(f => ({ ...f, idEmpresa: e.target.value }))}>
                        <option value="">Sin empresa</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </FieldWrap>
                  )}
                  <FieldWrap label="Estado">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[true, false].map(v => (
                        <button key={String(v)}
                          style={{ ...s.toggleBtn, ...(createForm.activo === v ? s.toggleBtnActive : {}) }}
                          onClick={() => setCreateForm(f => ({ ...f, activo: v }))}>
                          {v ? 'Activo' : 'Inactivo'}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>
                </div>
              )}

              {/* ── EDITAR / VER ── */}
              {!creating && editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FieldWrap label="Nombre completo">
                    <input style={s.input} value={editForm.nombre}
                      onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Email">
                    <input style={s.input} type="email" value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  </FieldWrap>
                  {roles.length > 0 && (
                    <FieldWrap label="Rol">
                      <select style={s.input} value={editForm.idRol}
                        onChange={e => setEditForm(f => ({ ...f, idRol: e.target.value }))}>
                        <option value="">Sin rol</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </FieldWrap>
                  )}
                  {empresas.length > 0 && (
                    <FieldWrap label="Empresa">
                      <select style={s.input} value={editForm.idEmpresa}
                        onChange={e => setEditForm(f => ({ ...f, idEmpresa: e.target.value }))}>
                        <option value="">Sin empresa</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </FieldWrap>
                  )}
                  <FieldWrap label="Estado">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[true, false].map(v => (
                        <button key={String(v)}
                          style={{ ...s.toggleBtn, ...(editForm.activo === v ? s.toggleBtnActive : {}) }}
                          onClick={() => setEditForm(f => ({ ...f, activo: v }))}>
                          {v ? 'Activo' : 'Inactivo'}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>
                </div>
              )}

              {!creating && !editing && selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoRow label="Empresa"  value={selected.nombreEmpresa} />
                  <InfoRow label="Sucursal" value={selected.nombreSucursal} />
                  <InfoRow label="Rol"      value={selected.nombreRol} />
                  <InfoRow label="Estado"   value={selected.activo ? 'Activo' : 'Inactivo'}
                    valueColor={selected.activo ? '#16a34a' : '#dc2626'} />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={s.panelActions}>
              {creating ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...s.btn, ...s.btnSecondary, flex: 1 }}
                    onClick={closePanel} disabled={saving}>
                    Cancelar
                  </button>
                  <button style={{ ...s.btn, flex: 2 }} onClick={saveCreate} disabled={saving}>
                    {saving ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              ) : editing ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...s.btn, ...s.btnSecondary, flex: 1 }}
                    onClick={() => { setEditing(false); setFeedback(null) }} disabled={saving}>
                    Cancelar
                  </button>
                  <button style={{ ...s.btn, flex: 2 }} onClick={saveEdit} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <button style={{ ...s.btn, width: '100%' }} onClick={() => setEditing(true)}>
                  Editar usuario
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helpers ─── */

const PALETTE = ['#06175D','#065f46','#78350f','#4a1d96','#7f1d1d','#134e4a']
const strColor = (s) => PALETTE[(s?.charCodeAt(0) ?? 0) % PALETTE.length]

function RolChip({ rol }) {
  const map = {
    admin:     { bg: '#fef3c7', color: '#92400e' },
    proveedor: { bg: '#EEF1FB', color: '#06175D' },
    empresa:   { bg: '#F0FDF4', color: '#15803d' },
  }
  const key = rol?.toLowerCase()
  const { bg, color } = map[key] ?? { bg: '#F0F2FA', color: '#9599AE' }
  return <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{rol || '—'}</span>
}

function InfoRow({ label, value, valueColor }) {
  const empty = value == null || value === ''
  return (
    <div style={{ background: '#F7F8FC', borderRadius: 8, padding: '9px 11px' }}>
      <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .4 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: empty ? '#C4C7D6' : valueColor ?? '#1A1D3B', fontStyle: empty ? 'italic' : 'normal' }}>
        {empty ? 'No disponible' : value}
      </p>
    </div>
  )
}

function FieldWrap({ label, children }) {
  return (
    <div>
      <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: '#9599AE', textTransform: 'uppercase', letterSpacing: .4 }}>{label}</p>
      {children}
    </div>
  )
}

function Paginacion({ page, totalPages, totalElements, pageSize, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #F0F2FA' }}>
      <span style={{ fontSize: 12, color: '#9599AE' }}>
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} de {totalElements}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={s.pageBtn} onClick={() => onChange(page - 1)} disabled={page === 0}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} style={{ ...s.pageBtn, ...(i === page ? s.pageBtnActive : {}) }} onClick={() => onChange(i)}>{i + 1}</button>
        ))}
        <button style={s.pageBtn} onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>›</button>
      </div>
    </div>
  )
}

/* ─── Styles ─── */
const s = {
  toolbar:       { display: 'flex', gap: 12, marginBottom: '1rem', alignItems: 'center' },
  searchWrap:    { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #DDE0EE', borderRadius: 8, padding: '8px 12px', flex: 1, maxWidth: 400 },
  searchInput:   { border: 'none', outline: 'none', fontSize: 13, color: '#1A1D3B', flex: 1, background: 'transparent' },
  clearBtn:      { border: 'none', background: 'none', color: '#9599AE', cursor: 'pointer', fontSize: 12 },
  btnNew:        { padding: '9px 18px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },

  tableWrap:     { background: '#fff', border: '1px solid #DDE0EE', borderRadius: 10, overflow: 'hidden' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:            { padding: '10px 14px', background: '#EEF1FB', color: '#06175D', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #DDE0EE', whiteSpace: 'nowrap' },
  td:            { padding: '9px 14px', color: '#1A1D3B', borderBottom: '1px solid #F0F2FA', whiteSpace: 'nowrap' },
  empty:         { padding: '2.5rem', color: '#9599AE', fontSize: 14, textAlign: 'center', margin: 0 },
  avatar:        { width: 28, height: 28, borderRadius: 8, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 },

  pageBtn:       { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: '#fff', color: '#9599AE', border: '1px solid #DDE0EE', borderRadius: 6, cursor: 'pointer' },
  pageBtnActive: { background: '#06175D', color: '#fff', borderColor: '#06175D' },

  panel:         { width: 296, flexShrink: 0, background: '#fff', border: '1px solid #DDE0EE', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(6,23,93,0.08)', position: 'sticky', top: 20 },
  panelHead:     { display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', borderBottom: '1px solid #F0F2FA', flexShrink: 0 },
  panelAvatar:   { width: 42, height: 42, borderRadius: 10, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 },
  panelNombre:   { margin: 0, fontWeight: 700, fontSize: 14, color: '#1A1D3B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  panelSub:      { margin: '2px 0 0', fontSize: 11, color: '#9599AE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  closeBtn:      { background: 'none', border: 'none', color: '#9599AE', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 4 },

  panelScroll:   { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 },
  panelActions:  { padding: '1rem', borderTop: '1px solid #F0F2FA', flexShrink: 0 },

  input:         { width: '100%', padding: '8px 10px', border: '1.5px solid #DDE0EE', borderRadius: 7, fontSize: 13, color: '#1A1D3B', boxSizing: 'border-box', outline: 'none', background: '#fff' },
  toggleBtn:     { flex: 1, padding: '8px', border: '1.5px solid #DDE0EE', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#9599AE' },
  toggleBtnActive:{ background: '#06175D', color: '#fff', borderColor: '#06175D' },

  btn:           { padding: '10px 14px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:  { background: '#fff', color: '#1A1D3B', border: '1.5px solid #DDE0EE' },
}
