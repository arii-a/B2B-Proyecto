import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { useAuth } from '../AuthContext'

export default function Productos() {
  const { session } = useAuth()

  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [idProveedorActual, setIdProveedorActual] = useState(null)

  const [form, setForm] = useState({ sku: '', nombre: '', descripcion: '', unidadMedida: '', idCategoria: '' })

  const cargarDatos = async () => {
    setLoading(true)
    setMsg('')
    try {
      const [catData, prodData, provData] = await Promise.all([
        api.get('/api/v1/categorias'),
        api.get('/api/v1/products'),
        api.get('/api/v1/proveedores'),
      ])

      setCategorias(catData || [])

      const proveedor = (provData || []).find(p => p.idEmpresa?.id === session?.id_empresa)
      setIdProveedorActual(proveedor?.id || null)

      const formateados = (prodData || []).map(p => ({
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion,
        'unidad medida': p.unidadMedida,
        categoria: p.nombreCategoria || p.idCategoria?.nombre || 'Sin categoría',
        estado: p.activo ? 'Activo' : 'Inactivo',
      }))
      setProductos(formateados)
    } catch (e) {
      setMsg(`Error cargando datos: ${e.message}`)
    }
    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const limpiarForm = () => setForm({ sku: '', nombre: '', descripcion: '', unidadMedida: '', idCategoria: '' })

  const crearProducto = async () => {
    setMsg('')
    if (!form.sku || !form.nombre || !form.unidadMedida || !form.idCategoria) {
      setMsg('Completa SKU, nombre, unidad de medida y categoría.')
      return
    }
    if (!idProveedorActual) {
      setMsg('Tu empresa no tiene un perfil de proveedor activo.')
      return
    }
    setSaving(true)
    try {
      await api.post('/api/v1/products', {
        sku: form.sku,
        nombre: form.nombre,
        descripcion: form.descripcion,
        unidadMedida: form.unidadMedida,
        activo: true,
        idCategoria: form.idCategoria,
        idProveedor: idProveedorActual,
      })
      setMsg('Producto agregado correctamente.')
      limpiarForm()
      await cargarDatos()
    } catch (e) {
      setMsg(`Error agregando producto: ${e.message}`)
    }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Registra y consulta los productos disponibles en el marketplace"
        action={<button onClick={cargarDatos} style={styles.refreshBtn}>↺ Actualizar</button>}
      />

      {msg && <div style={styles.msg}>{msg}</div>}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Agregar producto</h3>
        <div style={styles.grid}>
          <div>
            <label style={styles.label}>SKU</label>
            <input style={styles.input} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ej: PROD-001" />
          </div>
          <div>
            <label style={styles.label}>Nombre</label>
            <input style={styles.input} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Arroz 1kg" />
          </div>
          <div>
            <label style={styles.label}>Unidad de medida</label>
            <input style={styles.input} value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} placeholder="Ej: unidad, kg, caja" />
          </div>
          <div>
            <label style={styles.label}>Categoría</label>
            <select style={styles.input} value={form.idCategoria} onChange={(e) => setForm({ ...form, idCategoria: e.target.value })}>
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div style={styles.full}>
            <label style={styles.label}>Descripción</label>
            <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto" />
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.clearBtn} onClick={limpiarForm} disabled={saving}>Limpiar</button>
          <button style={styles.saveBtn} onClick={crearProducto} disabled={saving}>{saving ? 'Guardando...' : 'Agregar producto'}</button>
        </div>
      </div>

      <DataTable data={productos} loading={loading} emptyMsg="No hay productos registrados." />
    </div>
  )
}

const styles = {
  refreshBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: '#475569' },
  msg: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#334155', fontSize: '13px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  cardTitle: { margin: '0 0 1rem', fontSize: '16px', color: '#0f172a' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  full: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#fff', color: '#0f172a', outline: 'none' },
  actions: { marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  clearBtn: { padding: '10px 16px', background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  saveBtn: { padding: '10px 16px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}
