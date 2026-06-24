import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../AuthContext'
import ImportarProductosModal from '../components/ImportarProductosModal'

const norm = (d) => Array.isArray(d) ? d : (d?.content ?? [])
const toInput = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : ''
const toISO   = (str) => str ? new Date(str).toISOString() : null
const fmtMoney = (n) => `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
const fmtDate  = (d) => { if (!d) return null; const dt = new Date(d); const dd = String(dt.getDate()).padStart(2,'0'); const mm = String(dt.getMonth()+1).padStart(2,'0'); const yy = String(dt.getFullYear()).slice(-2); return `${dd}/${mm}/${yy}` }
const todayInput = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export default function MisProductos() {
  const { session } = useAuth()

  // ── Datos maestros ──
  const [proveedor,  setProveedor]  = useState(null)
  const [almacen,    setAlmacen]    = useState(null)
  const [almacenes,  setAlmacenes]  = useState([])
  const [categorias, setCategorias] = useState([])
  const [unidades,   setUnidades]   = useState([])

  // ── Listas enriquecidas ──
  const [productos,  setProductos]  = useState([])  // con .precioActual y .stockActual

  const [loading, setLoading] = useState(true)
  const [msg,     setMsg]     = useState(null)   // { ok, text }

  // ── Filtros ──
  const [search,  setSearch]  = useState('')
  const [filtro,  setFiltro]  = useState('todos')

  // ── Panel lateral ──
  const [sel, setSel] = useState(null)   // producto seleccionado (enriquecido)

  // ── Formulario nuevo producto ──
  const [showForm,   setShowForm]   = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [newForm,  setNewForm]  = useState({ sku:'', nombre:'', descripcion:'', idUnidadMedida:'', idCategoria:'', precio:'', vigenteDesde: todayInput(), stock:'' })
  const [saving,   setSaving]   = useState(false)


  /* ── Carga ───────────────────────────────────────────────── */
  const cargar = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const [provRes, catRes, unidRes] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/categorias'),
        api.get('/api/v1/unidades-medida/activas'),
      ])
      const prov = norm(provRes).find(p => p.idEmpresa?.id === session?.id_empresa && p.activo)
      setCategorias(norm(catRes))
      setUnidades(norm(unidRes))

      if (!prov) {
        setMsg({ ok: false, text: 'Tu empresa no tiene perfil de proveedor activo.' })
        setLoading(false)
        return
      }
      setProveedor(prov)

      const [prodRes, precRes, almRes] = await Promise.all([
        api.get(`/api/v1/products/proveedor/${prov.id}`),
        api.get('/api/v1/precios-base'),
        api.get('/api/v1/almacenes'),
      ])

      const hoy  = new Date()
      const prods = norm(prodRes)
      const precios = norm(precRes).filter(p => p.idProveedor?.id === prov.id)
      const almsArr = norm(almRes).filter(a => a.idProveedor?.id === prov.id)
      const alm     = almsArr[0] ?? null
      setAlmacen(alm)
      setAlmacenes(almsArr)

      let inventario = []
      if (alm) {
        const invRes = await api.get(`/api/v1/producto-almacen/almacen/${alm.id}`)
        inventario = norm(invRes)
      }

      const enriched = prods.map(p => {
        const allPrices = precios.filter(pr => pr.idProducto?.id === p.id)
        const precioVigente = allPrices.find(pr =>
          new Date(pr.vigenteDesde) <= hoy && (!pr.vigenteHasta || new Date(pr.vigenteHasta) >= hoy)
        ) ?? null
        const stock = inventario.find(i => i.idProducto === p.id) ?? null
        return { ...p, precioActual: precioVigente, allPrices, stockActual: stock }
      })

      setProductos(enriched)

      // Actualizar panel si había producto seleccionado
      if (sel) {
        const updated = enriched.find(p => p.id === sel.id)
        if (updated) setSel(updated)
      }
    } catch (e) {
      setMsg({ ok: false, text: `Error cargando datos: ${e.message}` })
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [session])

  /* ── Filtrado ─────────────────────────────────────────────── */
  const filtrados = productos
    .filter(p => {
      if (filtro === 'sin-precio') return !p.precioActual
      if (filtro === 'stock-bajo') return p.stockActual && p.stockActual.min != null && p.stockActual.stock < p.stockActual.min
      if (filtro === 'inactivos')  return !p.activo
      return p.activo
    })
    .filter(p => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    })

  /* ── Crear producto ────────────────────────────────────────── */
  const crearProducto = async () => {
    if (!newForm.sku || !newForm.nombre || !newForm.idUnidadMedida || !newForm.idCategoria) {
      setMsg({ ok: false, text: 'Completa SKU, nombre, unidad y categoría.' }); return
    }
    if (!proveedor) { setMsg({ ok: false, text: 'Sin perfil de proveedor activo.' }); return }
    setSaving(true)
    setMsg(null)
    try {
      const prod = await api.post('/api/v1/products', {
        sku: newForm.sku, nombre: newForm.nombre,
        descripcion: newForm.descripcion || null,
        idUnidadMedida: newForm.idUnidadMedida,
        activo: true, idCategoria: newForm.idCategoria,
        idProveedor: proveedor.id,
      })
      // Precio inicial opcional
      if (newForm.precio && newForm.vigenteDesde) {
        await api.post('/api/v1/precios-base', {
          idProducto: prod.id, idProveedor: proveedor.id,
          precioBase: Number(newForm.precio),
          vigenteDesde: toISO(newForm.vigenteDesde), vigenteHasta: null,
        })
      }
      // Stock inicial opcional
      if (newForm.stock !== '' && almacen) {
        await api.post('/api/v1/producto-almacen', {
          idAlmacen: almacen.id, idProducto: prod.id,
          stock: Number(newForm.stock), activo: true,
        })
      }
      setMsg({ ok: true, text: 'Producto creado correctamente.' })
      setNewForm({ sku:'', nombre:'', descripcion:'', idUnidadMedida:'', idCategoria:'', precio:'', vigenteDesde: todayInput(), stock:'' })
      setShowForm(false)
      await cargar()
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSaving(false)
  }

  const sinPrecio = productos.filter(p => p.activo && !p.precioActual).length
  const stockBajo = productos.filter(p => p.activo && p.stockActual && p.stockActual.min != null && p.stockActual.stock < p.stockActual.min).length

  return (
    <div>
      <PageHeader
        title="Mis Productos"
        subtitle={`${productos.length} productos · ${almacen ? `Almacén: ${almacen.nombre}` : 'Sin almacén — ve a Almacenes para crear uno'}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.importBtn} onClick={() => setShowImport(true)}>⬆ Importar Excel</button>
            <button style={s.newBtn} onClick={() => { setShowForm(v => !v); setMsg(null) }}>
              {showForm ? '✕ Cancelar' : '+ Nuevo producto'}
            </button>
          </div>
        }
      />

      {msg && (
        <div style={{ ...s.alert, ...(msg.ok ? s.alertOk : s.alertErr) }}>{msg.text}</div>
      )}

      {/* ── Formulario nuevo producto ── */}
      {showForm && (
        <div style={s.formCard}>
          <p style={s.formTitle}>Nuevo producto</p>
          <div style={s.formGrid}>
            <Field label="SKU *">
              <input style={s.input} placeholder="PROD-001" value={newForm.sku}
                onChange={e => setNewForm(f => ({ ...f, sku: e.target.value }))} />
            </Field>
            <Field label="Nombre *">
              <input style={s.input} placeholder="Arroz Premium 1kg" value={newForm.nombre}
                onChange={e => setNewForm(f => ({ ...f, nombre: e.target.value }))} />
            </Field>
            <Field label="Unidad de medida *">
              <select style={s.input} value={newForm.idUnidadMedida}
                onChange={e => setNewForm(f => ({ ...f, idUnidadMedida: e.target.value }))}>
                <option value="">Selecciona...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
              </select>
            </Field>
            <Field label="Categoría *">
              <select style={s.input} value={newForm.idCategoria}
                onChange={e => setNewForm(f => ({ ...f, idCategoria: e.target.value }))}>
                <option value="">Selecciona...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Descripción" full>
              <input style={s.input} placeholder="Descripción opcional" value={newForm.descripcion}
                onChange={e => setNewForm(f => ({ ...f, descripcion: e.target.value }))} />
            </Field>
            <Field label="Precio inicial (Bs.)" hint="Opcional — puedes setearlo después">
              <input style={s.input} type="number" min="0" step="0.01" placeholder="0.00" value={newForm.precio}
                onChange={e => setNewForm(f => ({ ...f, precio: e.target.value }))} />
            </Field>
            <Field label="Precio vigente desde" hint="Requerido si configuras precio">
              <input style={s.input} type="datetime-local" value={newForm.vigenteDesde}
                onChange={e => setNewForm(f => ({ ...f, vigenteDesde: e.target.value }))} />
            </Field>
            <Field label="Stock inicial" hint={almacen ? `Se vincula a ${almacen.nombre}` : 'Sin almacén registrado'}>
              <input style={s.input} type="number" min="0" placeholder="0" disabled={!almacen} value={newForm.stock}
                onChange={e => setNewForm(f => ({ ...f, stock: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button style={s.cancelBtn} onClick={() => { setShowForm(false); setMsg(null) }}>Cancelar</button>
            <button style={s.saveBtn} onClick={crearProducto} disabled={saving}>
              {saving ? 'Creando...' : 'Crear producto'}
            </button>
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9599AE" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input style={s.searchInput} placeholder="Buscar SKU o nombre..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key:'todos',      label: 'Activos' },
            { key:'sin-precio', label: `Sin precio${sinPrecio > 0 ? ` (${sinPrecio})` : ''}` },
            { key:'stock-bajo', label: `Stock bajo${stockBajo > 0 ? ` (${stockBajo})` : ''}` },
            { key:'inactivos',  label: 'Inactivos' },
          ].map(f => (
            <button key={f.key}
              style={{ ...s.chip, ...(filtro === f.key ? s.chipActive : {}), ...(f.key !== 'todos' && (f.key === 'sin-precio' && sinPrecio > 0 || f.key === 'stock-bajo' && stockBajo > 0) ? s.chipWarn : {}) }}
              onClick={() => setFiltro(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout: lista + panel ── */}
      <div style={{ ...s.layout, ...(sel ? s.layoutSplit : {}) }}>
        {/* Lista */}
        <div style={s.listWrap}>
          {loading ? (
            <p style={s.muted}>Cargando...</p>
          ) : filtrados.length === 0 ? (
            <div style={s.emptyBox}>
              <p style={s.emptyTitle}>Sin productos</p>
              <p style={s.emptySub}>Crea tu primer producto con el botón de arriba.</p>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>SKU</th>
                    <th style={s.th}>Producto</th>
                    <th style={s.th}>Categoría</th>
                    <th style={s.th}>Precio vigente</th>
                    <th style={s.th}>Stock</th>
                    <th style={s.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p, i) => {
                    const isSel     = sel?.id === p.id
                    const sinPrecio = !p.precioActual
                    const bajo      = p.stockActual?.min != null && p.stockActual?.stock < p.stockActual?.min
                    return (
                      <tr key={p.id}
                        style={{ ...s.tr, ...(isSel ? s.trSelected : i % 2 === 1 ? s.trAlt : {}), cursor: 'pointer' }}
                        onClick={() => setSel(isSel ? null : p)}>
                        <td style={s.td}><span style={s.skuBadge}>{p.sku || '—'}</span></td>
                        <td style={{ ...s.td, fontWeight: 600, color: 'var(--c-text)' }}>{p.nombre}</td>
                        <td style={s.td}><span style={s.catBadge}>{p.idCategoria?.nombre ?? '—'}</span></td>
                        <td style={s.td}>
                          {sinPrecio
                            ? <span style={s.warnBadge}>Sin precio</span>
                            : <span style={{ fontWeight: 700, color: 'var(--c-primary)' }}>{fmtMoney(p.precioActual.precioBase)}</span>
                          }
                        </td>
                        <td style={s.td}>
                          {!p.stockActual
                            ? <span style={s.warnBadge}>Sin stock</span>
                            : <span style={{ fontWeight: 600, color: bajo ? '#dc2626' : 'var(--c-text)' }}>
                                {p.stockActual.stock}
                                {bajo && <span style={{ fontSize: 10, marginLeft: 4, color: '#dc2626' }}>↓ bajo</span>}
                              </span>
                          }
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, ...(p.activo ? s.badgeOk : s.badgeOff) }}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        {sel && (
          <ProductoPanel
            producto={sel}
            categorias={categorias}
            unidades={unidades}
            proveedor={proveedor}
            almacen={almacen}
            onClose={() => setSel(null)}
            onRefresh={cargar}
            setMsg={setMsg}
          />
        )}
      </div>

      {showImport && proveedor && (
        <ImportarProductosModal
          proveedorId={proveedor.id}
          categorias={categorias}
          unidades={unidades}
          almacenes={almacenes}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); cargar() }}
        />
      )}
    </div>
  )
}

/* ─── Panel derecho ────────────────────────────────────────────────────────── */
function ProductoPanel({ producto: p, categorias, unidades, proveedor, almacen, onClose, onRefresh, setMsg }) {
  const [tab, setTab] = useState('datos')

  return (
    <div style={s.panel}>
      {/* Panel header */}
      <div style={s.panelHead}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={s.skuBadge}>{p.sku}</span>
          <p style={s.panelNombre}>{p.nombre}</p>
          <p style={s.panelSub}>{p.idCategoria?.nombre ?? '—'} · {p.idUnidadMedida?.abreviatura}</p>
        </div>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[['datos','Datos'],['precio','Precio'],['stock','Stock']].map(([k,l]) => (
          <button key={k} style={{ ...s.tab, ...(tab === k ? s.tabActive : {}) }} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={s.panelBody}>
        {tab === 'datos'  && <TabDatos  p={p} categorias={categorias} unidades={unidades} proveedor={proveedor} onRefresh={onRefresh} onDelete={() => { onClose(); onRefresh() }} setMsg={setMsg} />}
        {tab === 'precio' && <TabPrecio p={p} proveedor={proveedor} onRefresh={onRefresh} setMsg={setMsg} />}
        {tab === 'stock'  && <TabStock  p={p} almacen={almacen} onRefresh={onRefresh} setMsg={setMsg} />}
      </div>
    </div>
  )
}

/* ─── Tab: Datos ─────────────────────────────────────────────────────────── */
function TabDatos({ p, categorias, unidades, proveedor, onRefresh, onDelete, setMsg }) {
  const [form, setForm] = useState({
    sku: p.sku ?? '', nombre: p.nombre ?? '', descripcion: p.descripcion ?? '',
    idUnidadMedida: p.idUnidadMedida?.id ?? '', idCategoria: p.idCategoria?.id ?? '', activo: p.activo,
  })
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const guardar = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.put(`/api/v1/products/${p.id}`, {
        sku: form.sku, nombre: form.nombre, descripcion: form.descripcion || null,
        idUnidadMedida: form.idUnidadMedida || null,
        activo: form.activo,
        idCategoria: form.idCategoria, idProveedor: proveedor.id,
      })
      setMsg({ ok: true, text: 'Producto actualizado.' })
      onRefresh()
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSaving(false)
  }

  const borrar = async () => {
    setDeleting(true)
    setMsg(null)
    try {
      await api.delete(`/api/v1/products/${p.id}`)
      onDelete()
    } catch (e) {
      setMsg({ ok: false, text: `Error al eliminar: ${e.message}` })
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field label="SKU">
        <input style={s.input} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
      </Field>
      <Field label="Nombre">
        <input style={s.input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      </Field>
      <Field label="Unidad de medida">
        <select style={s.input} value={form.idUnidadMedida}
          onChange={e => setForm(f => ({ ...f, idUnidadMedida: e.target.value }))}>
          <option value="">Selecciona...</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
        </select>
      </Field>
      <Field label="Categoría">
        <select style={s.input} value={form.idCategoria} onChange={e => setForm(f => ({ ...f, idCategoria: e.target.value }))}>
          <option value="">Selecciona...</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </Field>
      <Field label="Descripción">
        <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-text)', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
        Activo en el catálogo
      </label>
      <button style={s.saveBtn} onClick={guardar} disabled={saving || deleting}>
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      <div style={{ borderTop: '1px solid var(--c-border-light)', marginTop: 8, paddingTop: 12 }}>
        {!confirmDel ? (
          <button style={s.delProductoBtn} onClick={() => setConfirmDel(true)} disabled={deleting}>
            Eliminar producto
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>¿Eliminar "{p.nombre}"? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ ...s.delProductoBtn, flex: 1 }} onClick={borrar} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button style={{ ...s.cancelBtn, flex: 1 }} onClick={() => setConfirmDel(false)} disabled={deleting}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Tab: Precio ────────────────────────────────────────────────────────── */
function TabPrecio({ p, proveedor, onRefresh, setMsg }) {
  const hoy = new Date()
  const vigente = p.precioActual

  const emptyP = { precioBase: '', vigenteDesde: '', vigenteHasta: '' }
  const [editForm, setEditForm]   = useState(vigente ? {
    precioBase:   vigente.precioBase ?? '',
    vigenteDesde: toInput(vigente.vigenteDesde),
    vigenteHasta: toInput(vigente.vigenteHasta),
  } : emptyP)
  const [saving, setSaving] = useState(false)

  const guardarPrecio = async () => {
    if (!editForm.precioBase || !editForm.vigenteDesde) {
      setMsg({ ok: false, text: 'El precio y la fecha de inicio son obligatorios.' }); return
    }
    setSaving(true); setMsg(null)
    try {
      const body = {
        idProducto: p.id, idProveedor: proveedor.id,
        precioBase: Number(editForm.precioBase),
        vigenteDesde: toISO(editForm.vigenteDesde),
        vigenteHasta: toISO(editForm.vigenteHasta),
      }
      if (vigente) {
        await api.put(`/api/v1/precios-base/${vigente.id}`, body)
      } else {
        await api.post('/api/v1/precios-base', body)
      }
      setMsg({ ok: true, text: 'Precio guardado.' })
      onRefresh()
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSaving(false)
  }

  const eliminarPrecio = async (id) => {
    setSaving(true); setMsg(null)
    try {
      await api.delete(`/api/v1/precios-base/${id}`)
      setMsg({ ok: true, text: 'Precio eliminado.' })
      onRefresh()
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Estado actual */}
      <div style={vigente ? s.precioCard : s.precioClearCard}>
        {vigente ? (
          <>
            <p style={s.precioCardLabel}>Precio vigente</p>
            <p style={s.precioCardVal}>{fmtMoney(vigente.precioBase)}</p>
            <p style={s.precioCardSub}>
              Desde {fmtDate(vigente.vigenteDesde)}
              {vigente.vigenteHasta ? ` → ${fmtDate(vigente.vigenteHasta)}` : ' → sin vencimiento'}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: '#d97706' }}>
            Sin precio vigente — este producto no aparece en el catálogo.
          </p>
        )}
      </div>

      {/* Formulario editar/crear precio vigente */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.sectionLabel}>{vigente ? 'Editar precio vigente' : 'Configurar precio'}</p>
        <Field label="Precio (Bs.) *">
          <input style={s.input} type="number" min="0" step="0.01" value={editForm.precioBase}
            onChange={e => setEditForm(f => ({ ...f, precioBase: e.target.value }))} placeholder="0.00" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Desde *">
            <input style={s.input} type="datetime-local" value={editForm.vigenteDesde}
              onChange={e => setEditForm(f => ({ ...f, vigenteDesde: e.target.value }))} />
          </Field>
          <Field label="Hasta (opcional)">
            <input style={s.input} type="datetime-local" value={editForm.vigenteHasta}
              onChange={e => setEditForm(f => ({ ...f, vigenteHasta: e.target.value }))} />
          </Field>
        </div>
        <button style={s.saveBtn} onClick={guardarPrecio} disabled={saving}>
          {saving ? 'Guardando...' : vigente ? 'Actualizar precio' : 'Guardar precio'}
        </button>
      </div>

      {/* Historial de precios */}
      {p.allPrices?.length > 0 && (
        <div>
          <p style={s.sectionLabel}>Historial de precios</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.allPrices.map(pr => {
              const isVigente = pr.id === vigente?.id
              const expirado  = pr.vigenteHasta && new Date(pr.vigenteHasta) < hoy
              return (
                <div key={pr.id} style={{ ...s.histRow, ...(isVigente ? s.histRowActive : {}) }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, color: 'var(--c-text)', fontSize: 13 }}>{fmtMoney(pr.precioBase)}</span>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)', marginLeft: 8 }}>
                      {fmtDate(pr.vigenteDesde)} → {fmtDate(pr.vigenteHasta) ?? 'sin vencimiento'}
                    </span>
                  </div>
                  {isVigente && <span style={s.badge2}>Vigente</span>}
                  {expirado   && <span style={s.badge3}>Expirado</span>}
                  {!isVigente && (
                    <button style={s.delBtn} onClick={() => eliminarPrecio(pr.id)}>✕</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tab: Stock ─────────────────────────────────────────────────────────── */
function TabStock({ p, almacen, onRefresh, setMsg }) {
  const stock = p.stockActual
  const [form, setForm] = useState({
    stock: stock?.stock ?? '',
    min:   stock?.min   ?? '',
    max:   stock?.max   ?? '',
    activo: stock?.activo ?? true,
  })
  const [saving, setSaving] = useState(false)

  const guardarStock = async () => {
    if (!almacen) { setMsg({ ok: false, text: 'No hay almacén registrado.' }); return }
    if (form.stock === '') { setMsg({ ok: false, text: 'Ingresa el stock.' }); return }
    setSaving(true); setMsg(null)
    try {
      if (stock) {
        await api.put(`/api/v1/producto-almacen/${almacen.id}/${p.id}`, {
          stock: Number(form.stock),
          min: form.min !== '' ? Number(form.min) : null,
          max: form.max !== '' ? Number(form.max) : null,
          activo: form.activo,
        })
      } else {
        await api.post('/api/v1/producto-almacen', {
          idAlmacen: almacen.id, idProducto: p.id,
          stock: Number(form.stock),
          min: form.min !== '' ? Number(form.min) : null,
          max: form.max !== '' ? Number(form.max) : null,
          activo: form.activo,
        })
      }
      setMsg({ ok: true, text: 'Stock actualizado.' })
      onRefresh()
    } catch (e) {
      setMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSaving(false)
  }

  if (!almacen) {
    return (
      <div style={s.precioClearCard}>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#d97706', fontWeight: 600 }}>Sin almacén registrado</p>
        <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
          Usa el botón "Crear almacén" arriba para registrar tu almacén y luego podrás configurar el stock de este producto.
        </p>
      </div>
    )
  }

  const bajo = stock && stock.min != null && stock.stock < stock.min

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Estado actual */}
      <div style={stock ? s.precioCard : s.precioClearCard}>
        {stock ? (
          <>
            <p style={s.precioCardLabel}>{almacen.nombre}</p>
            <p style={{ ...s.precioCardVal, color: bajo ? '#dc2626' : 'var(--c-primary)' }}>
              {stock.stock} {p.idUnidadMedida?.abreviatura || 'unidades'}
            </p>
            <p style={s.precioCardSub}>
              {stock.min != null ? `Mín: ${stock.min}` : 'Sin mínimo'}
              {stock.max != null ? ` · Máx: ${stock.max}` : ''}
              {bajo ? ' · ⚠ Por debajo del mínimo' : ''}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: '#d97706' }}>
            Producto no vinculado al almacén — configura el stock abajo.
          </p>
        )}
      </div>

      {/* Formulario */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.sectionLabel}>{stock ? 'Editar stock' : `Vincular a ${almacen.nombre}`}</p>
        <Field label={`Stock actual (${p.idUnidadMedida?.abreviatura || 'unidades'}) *`}>
          <input style={s.input} type="number" min="0" value={form.stock}
            onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Mínimo (alerta)" hint="Alerta si baja de este valor">
            <input style={s.input} type="number" min="0" value={form.min}
              onChange={e => setForm(f => ({ ...f, min: e.target.value }))} placeholder="Sin límite" />
          </Field>
          <Field label="Máximo">
            <input style={s.input} type="number" min="0" value={form.max}
              onChange={e => setForm(f => ({ ...f, max: e.target.value }))} placeholder="Sin límite" />
          </Field>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-text)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
          Disponible para venta
        </label>
        <button style={s.saveBtn} onClick={guardarStock} disabled={saving}>
          {saving ? 'Guardando...' : stock ? 'Actualizar stock' : 'Vincular al almacén'}
        </button>
      </div>
    </div>
  )
}

/* ─── Helper ─────────────────────────────────────────────────────────────── */
function Field({ label, hint, full, children }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <label style={s.label}>{label}</label>
      {children}
      {hint && <p style={s.hint}>{hint}</p>}
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  alert:      { borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 },
  alertOk:    { background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' },
  alertErr:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' },
  newBtn:    { background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  importBtn: { background: 'var(--c-bg)', color: 'var(--c-primary)', border: '1.5px solid var(--c-primary)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  formCard:   { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(6,23,93,0.05)' },
  formTitle:  { margin: '0 0 1rem', fontWeight: 800, fontSize: 15, color: 'var(--c-text)' },
  formGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 12px' },

  toolbar:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem', flexWrap: 'wrap' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, padding: '8px 12px', flex: 1, maxWidth: 320 },
  searchInput:{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--c-text)', flex: 1, background: 'transparent' },
  chip:       { padding: '6px 12px', border: '1.5px solid var(--c-border)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', background: 'var(--c-bg)', cursor: 'pointer' },
  chipActive: { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' },
  chipWarn:   { borderColor: '#fcd34d', color: '#92400e' },

  layout:     { display: 'grid', gridTemplateColumns: '1fr' },
  layoutSplit:{ gridTemplateColumns: '1fr 360px', gap: '1rem' },

  listWrap:   {},
  tableWrap:  { overflowX: 'auto', border: '1px solid var(--c-border)', borderRadius: 12, background: 'var(--c-bg)', boxShadow: 'var(--c-shadow-sm)' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { padding: '10px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--c-border)', fontSize: 11, letterSpacing: .3 },
  tr:         { transition: 'background .1s' },
  trAlt:      { background: 'var(--c-bg-subtle)' },
  trSelected: { background: 'var(--c-primary-light)' },
  td:         { padding: '10px 14px', color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)', whiteSpace: 'nowrap' },
  skuBadge:   { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: 'var(--c-bg-page)', color: 'var(--c-muted)', fontFamily: 'monospace' },
  catBadge:   { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--c-primary-light)', color: 'var(--c-primary)', fontWeight: 600 },
  warnBadge:  { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontWeight: 600 },
  badge:      { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  badgeOk:    { background: '#dcfce7', color: '#15803d' },
  badgeOff:   { background: '#fee2e2', color: '#991b1b' },
  badge2:     { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#15803d' },
  badge3:     { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--c-bg-page)', color: 'var(--c-muted)' },

  muted:      { color: 'var(--c-muted)', fontSize: 13 },
  emptyBox:   { textAlign: 'center', padding: '3rem', background: 'var(--c-bg)', borderRadius: 14, border: '1px solid var(--c-border)' },
  emptyTitle: { margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--c-text)' },
  emptySub:   { margin: 0, fontSize: 13, color: 'var(--c-muted)' },

  panel:      { background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 14, display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'sticky', top: 24, maxHeight: 'calc(100vh - 120px)', overflow: 'hidden', boxShadow: 'var(--c-shadow-md)' },
  panelHead:  { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--c-border-light)', flexShrink: 0 },
  panelNombre:{ margin: '4px 0 2px', fontSize: 15, fontWeight: 800, color: 'var(--c-text)' },
  panelSub:   { margin: 0, fontSize: 11, color: 'var(--c-muted)' },
  closeBtn:   { background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 },

  tabs:       { display: 'flex', borderBottom: '1px solid var(--c-border-light)', flexShrink: 0 },
  tab:        { flex: 1, padding: '9px', border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', cursor: 'pointer', borderBottom: '2px solid transparent' },
  tabActive:  { color: 'var(--c-primary)', borderBottom: '2px solid var(--c-primary)' },
  panelBody:  { flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' },

  label:      { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 },
  hint:       { margin: '3px 0 0', fontSize: 10, color: 'var(--c-muted)' },
  input:      { width: '100%', padding: '9px 11px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 13, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-bg)' },
  saveBtn:    { width: '100%', padding: '9px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  cancelBtn:       { padding: '9px 16px', background: 'var(--c-bg)', border: '1.5px solid var(--c-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--c-muted)', fontSize: 13 },
  delProductoBtn:  { width: '100%', padding: '8px', background: 'var(--c-bg)', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },

  precioCard:      { background: 'var(--c-primary-light)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '12px 14px' },
  precioClearCard: { background: '#fef9ec', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px' },
  precioCardLabel: { margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: .4 },
  precioCardVal:   { margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: 'var(--c-primary)' },
  precioCardSub:   { margin: 0, fontSize: 11, color: 'var(--c-muted)' },
  sectionLabel:    { margin: '0 0 8px', fontWeight: 700, fontSize: 12, color: 'var(--c-text)' },

  histRow:         { display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FF', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--c-border)' },
  histRowActive:   { background: 'var(--c-primary-light)', border: '1px solid var(--c-border)' },
  delBtn:          { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700, flexShrink: 0 },
}
