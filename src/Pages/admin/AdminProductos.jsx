import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const PAGE_SIZE = 12

export default function AdminProductos() {
  const [data,          setData]          = useState([])
  const [categorias,    setCategorias]    = useState([])
  const [unidades,      setUnidades]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search,        setSearch]        = useState('')
  const [searchBy,      setSearchBy]      = useState('ambos')

  const [selected, setSelected] = useState(null)
  const [editing,  setEditing]  = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState(null)

  const cargar = async (p = 0) => {
    setLoading(true)
    try {
      const [res, catRes, unidRes] = await Promise.all([
        api.get(`/api/v1/products/paged?page=${p}&size=${PAGE_SIZE}`),
        api.get('/api/v1/categorias').catch(() => []),
        api.get('/api/v1/unidades-medida/activas').catch(() => []),
      ])
      setData(res.content ?? [])
      setTotalPages(res.totalPages ?? 0)
      setTotalElements(res.totalElements ?? 0)
      setCategorias(norm(catRes))
      setUnidades(norm(unidRes))
    } catch { setData([]) }
    setLoading(false)
  }

  useEffect(() => { cargar(0) }, [])

  const cambiarPagina = (p) => { setPage(p); cargar(p); setSelected(null) }

  const filtrados = search.trim()
    ? data.filter(p => {
        const q = search.toLowerCase()
        if (searchBy === 'nombre') return p.nombre?.toLowerCase().includes(q)
        if (searchBy === 'sku')    return p.sku?.toLowerCase().includes(q)
        return (
          p.nombre?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.nombreProveedor?.toLowerCase().includes(q)
        )
      })
    : data

  const openPanel = (prod) => {
    setSelected(prod)
    setEditing(false)
    setFeedback(null)
    setEditForm({
      sku:             prod.sku          ?? '',
      nombre:          prod.nombre       ?? '',
      descripcion:     prod.descripcion  ?? '',
      idUnidadMedida:  prod.idUnidadMedida?.id ?? '',
      idCategoria:     prod.idCategoria?.id    ?? '',
      activo:          prod.activo       ?? true,
    })
  }

  const saveEdit = async () => {
    setSaving(true); setFeedback(null)
    try {
      await api.put(`/api/v1/products/${selected.id}`, {
        sku:            editForm.sku,
        nombre:         editForm.nombre,
        descripcion:    editForm.descripcion,
        idUnidadMedida: editForm.idUnidadMedida || null,
        idCategoria:    editForm.idCategoria    || null,
        idProveedor:    selected.idProveedor?.id ?? selected.nombreProveedor ?? null,
        activo:         editForm.activo,
      })
      setFeedback({ ok: true, msg: 'Producto actualizado.' })
      setEditing(false)
      await cargar(page)
    } catch (e) { setFeedback({ ok: false, msg: e.message || 'Error al guardar.' }) }
    setSaving(false)
  }

  // Resolve unit name from either nested object or flat field
  const unidadNombre = (prod) =>
    prod.nombreUnidadMedida ?? prod.idUnidadMedida?.nombre ?? prod.unidadMedida ?? '—'

  return (
    <div>
      <PageHeader title="Productos" subtitle={`${totalElements} productos registrados`} />

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9599AE" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <select style={s.searchSelect} value={searchBy}
            onChange={e => { setSearchBy(e.target.value); setSelected(null) }}>
            <option value="ambos">Nombre o SKU</option>
            <option value="nombre">Nombre</option>
            <option value="sku">SKU</option>
          </select>
          <div style={{ width: 1, height: 16, background: 'var(--c-border)', flexShrink: 0 }} />
          <input
            style={s.searchInput}
            placeholder={searchBy === 'sku' ? 'Buscar por SKU...' : searchBy === 'nombre' ? 'Buscar por nombre...' : 'Buscar...'}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null) }}
          />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>
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
                      {['SKU', 'Nombre', 'Unidad', 'Categoría', 'Proveedor', 'Estado'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((p, i) => {
                      const sel = selected?.id === p.id
                      return (
                        <tr
                          key={p.id}
                          onClick={() => openPanel(p)}
                          style={{
                            background: sel ? 'var(--c-primary-light)' : i % 2 === 0 ? '#fff' : 'var(--c-bg-subtle)',
                            cursor: 'pointer',
                            borderLeft: `3px solid ${sel ? 'var(--c-primary)' : 'transparent'}`,
                          }}
                        >
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12, color: 'var(--c-muted)' }}>{p.sku || '—'}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{p.nombre}</td>
                          <td style={s.td}>
                            <span style={s.unidadChip}>{unidadNombre(p)}</span>
                          </td>
                          <td style={s.td}>{p.nombreCategoria || '—'}</td>
                          <td style={s.td}>{p.nombreProveedor || '—'}</td>
                          <td style={s.td}>
                            <span style={{ color: p.activo ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 12 }}>
                              ● {p.activo ? 'Activo' : 'Inactivo'}
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
        {selected && (
          <div style={s.panel}>
            <div style={s.panelHead}>
              <div style={s.panelIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={s.panelNombre}>{selected.nombre}</p>
                <p style={s.panelSku}>{selected.sku}</p>
              </div>
              <button style={s.closeBtn} onClick={() => { setSelected(null); setFeedback(null); setEditing(false) }}>✕</button>
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
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FieldWrap label="SKU">
                    <input style={s.input} value={editForm.sku}
                      onChange={e => setEditForm(f => ({ ...f, sku: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Nombre">
                    <input style={s.input} value={editForm.nombre}
                      onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Descripción">
                    <textarea style={{ ...s.input, height: 68, resize: 'vertical' }} value={editForm.descripcion}
                      onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Unidad de medida">
                    <select style={s.input} value={editForm.idUnidadMedida}
                      onChange={e => setEditForm(f => ({ ...f, idUnidadMedida: e.target.value }))}>
                      <option value="">Sin unidad</option>
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </FieldWrap>
                  <FieldWrap label="Categoría">
                    <select style={s.input} value={editForm.idCategoria}
                      onChange={e => setEditForm(f => ({ ...f, idCategoria: e.target.value }))}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </FieldWrap>
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
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <InfoRow label="Descripción"    value={selected.descripcion} />
                  <InfoRow label="Unidad"         value={unidadNombre(selected)} />
                  <InfoRow label="Categoría"      value={selected.nombreCategoria} />
                  <InfoRow label="Proveedor"      value={selected.nombreProveedor} />
                  <InfoRow label="Estado"         value={selected.activo ? 'Activo' : 'Inactivo'}
                    valueColor={selected.activo ? '#16a34a' : '#dc2626'} />
                </div>
              )}
            </div>

            <div style={s.panelActions}>
              {editing ? (
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
                  Editar producto
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

function FieldWrap({ label, children }) {
  return (
    <div>
      <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 }}>{label}</p>
      {children}
    </div>
  )
}

function InfoRow({ label, value, valueColor }) {
  const empty = value == null || value === ''
  return (
    <div style={{ background: 'var(--c-bg-subtle)', borderRadius: 8, padding: '9px 11px' }}>
      <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: empty ? '#C4C7D6' : valueColor ?? 'var(--c-text)', fontStyle: empty ? 'italic' : 'normal' }}>
        {empty ? 'No disponible' : value}
      </p>
    </div>
  )
}

function Paginacion({ page, totalPages, totalElements, pageSize, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--c-border-light)' }}>
      <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
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
  toolbar:      { display: 'flex', gap: 12, marginBottom: '1rem' },
  searchWrap:   { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, padding: '8px 12px', flex: 1, maxWidth: 400 },
  searchInput:  { border: 'none', outline: 'none', fontSize: 13, color: 'var(--c-text)', flex: 1, background: 'transparent' },
  searchSelect: { border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'var(--c-primary)', background: 'transparent', cursor: 'pointer', paddingRight: 4 },
  clearBtn:     { border: 'none', background: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 12 },

  tableWrap:    { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:           { padding: '10px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--c-border)', whiteSpace: 'nowrap' },
  td:           { padding: '9px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  empty:        { padding: '2.5rem', color: 'var(--c-muted)', fontSize: 14, textAlign: 'center', margin: 0 },
  unidadChip:   { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--c-primary-light)', color: 'var(--c-primary)' },

  pageBtn:      { padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1px solid var(--c-border)', borderRadius: 6, cursor: 'pointer' },
  pageBtnActive:{ background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },

  panel:        { width: 296, flexShrink: 0, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)', overflow: 'hidden', boxShadow: 'var(--c-shadow-md)', position: 'sticky', top: 20 },
  panelHead:    { display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', borderBottom: '1px solid var(--c-border-light)', flexShrink: 0 },
  panelIcon:    { width: 42, height: 42, borderRadius: 10, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  panelNombre:  { margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  panelSku:     { margin: '2px 0 0', fontSize: 11, color: 'var(--c-muted)', fontFamily: 'monospace' },
  closeBtn:     { background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 4 },

  panelScroll:  { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 },
  panelActions: { padding: '1rem', borderTop: '1px solid var(--c-border-light)', flexShrink: 0 },

  input:        { width: '100%', padding: '8px 10px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 13, color: 'var(--c-text)', boxSizing: 'border-box', outline: 'none', background: 'var(--c-bg)' },
  toggleBtn:    { flex: 1, padding: '8px', border: '1.5px solid var(--c-border)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--c-bg)', color: 'var(--c-muted)' },
  toggleBtnActive:{ background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },

  btn:          { padding: '10px 14px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: 'var(--c-bg)', color: 'var(--c-text)', border: '1.5px solid var(--c-border)' },
}
