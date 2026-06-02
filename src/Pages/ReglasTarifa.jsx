import { useEffect, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { useAuth } from '../AuthContext'

export default function ReglasTarifa() {
  const { session } = useAuth()

  const [proveedorActual, setProveedorActual] = useState(null)
  const [reglas, setReglas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [tramos, setTramos] = useState([{ tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', porcentajeDesc: '' }])

  const cargarDatos = async () => {
    setLoading(true)
    setMsg('')
    try {
      const [proveedoresData, reglasData] = await Promise.all([
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/tarifas-reglas'),
      ])

      const proveedor = (proveedoresData || []).find(p => p.idEmpresa?.id === session?.id_empresa && p.activo)
      setProveedorActual(proveedor || null)

      const misReglas = proveedor
        ? (reglasData || []).filter(r => r.idProveedor?.id === proveedor.id)
        : []

      setReglas(misReglas.map(r => ({
        nombre: r.nombre,
        descripcion: r.descripcion || '—',
        activo: r.activo ? 'Sí' : 'No',
      })))
    } catch (e) {
      setMsg(`Error cargando datos: ${e.message}`)
    }
    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [session])

  const actualizarTramo = (index, campo, valor) => {
    setTramos(prev => prev.map((t, i) => i === index ? { ...t, [campo]: valor } : t))
  }

  const agregarTramo = () => {
    setTramos(prev => [...prev, { tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', porcentajeDesc: '' }])
  }

  const quitarTramo = (index) => {
    if (tramos.length === 1) { setMsg('Debe existir al menos un tramo.'); return }
    setTramos(prev => prev.filter((_, i) => i !== index))
  }

  const crearRegla = async () => {
    setMsg('')
    if (!form.nombre) { setMsg('Escribe un nombre para la regla.'); return }
    if (!proveedorActual) { setMsg('Tu empresa no tiene un perfil de proveedor activo.'); return }

    for (const t of tramos) {
      if (!t.tipo || !t.cantidadMinima || !t.porcentajeDesc) {
        setMsg('Todos los tramos deben tener tipo, cantidad mínima y porcentaje.')
        return
      }
      if (Number(t.cantidadMinima) < 0) { setMsg('La cantidad mínima no puede ser negativa.'); return }
      if (t.cantidadMaxima !== '' && Number(t.cantidadMaxima) <= Number(t.cantidadMinima)) {
        setMsg('La cantidad máxima debe ser mayor a la mínima.'); return
      }
      if (Number(t.porcentajeDesc) < 0 || Number(t.porcentajeDesc) > 100) {
        setMsg('El porcentaje debe estar entre 0 y 100.'); return
      }
    }

    setSaving(true)
    try {
      const regla = await api.post('/api/v1/tarifas-reglas', {
        nombre: form.nombre,
        descripcion: form.descripcion,
        activo: true,
        idProveedor: proveedorActual.id,
      })

      await Promise.all(tramos.map(t => api.post('/api/v1/tramos-tarifa', {
        tipo: t.tipo,
        cantidadMinima: Number(t.cantidadMinima),
        cantidadMaxima: t.cantidadMaxima !== '' ? Number(t.cantidadMaxima) : null,
        porcentajeDesc: Number(t.porcentajeDesc),
        idRegla: regla.id,
      })))

      setMsg('Regla y tramos creados correctamente.')
      setForm({ nombre: '', descripcion: '' })
      setTramos([{ tipo: 'volumen', cantidadMinima: '', cantidadMaxima: '', porcentajeDesc: '' }])
      cargarDatos()
    } catch (e) {
      setMsg(`Error creando regla: ${e.message}`)
    }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Reglas de tarifa"
        subtitle="Crea reglas de tarifa con tramos para usarlas en contratos"
        action={<button onClick={cargarDatos} style={styles.refreshBtn}>↺ Actualizar</button>}
      />

      {msg && <div style={styles.msg}>{msg}</div>}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Nueva regla de tarifa</h3>

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Nombre de la regla</label>
            <input style={styles.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Descuento por volumen" />
          </div>
          <div>
            <label style={styles.label}>Descripción (opcional)</label>
            <input style={styles.input} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Aplica a pedidos grandes" />
          </div>
        </div>

        <div style={styles.tramosHeader}>
          <h4 style={styles.sectionTitle}>Tramos</h4>
          <button style={styles.addBtn} onClick={agregarTramo}>+ Agregar tramo</button>
        </div>

        {tramos.map((tramo, index) => (
          <div key={index} style={styles.tramoBox}>
            <div>
              <label style={styles.label}>Tipo</label>
              <select style={styles.input} value={tramo.tipo} onChange={e => actualizarTramo(index, 'tipo', e.target.value)}>
                <option value="volumen">Volumen</option>
                <option value="costo">Costo</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Cantidad mínima</label>
              <input style={styles.input} type="number" value={tramo.cantidadMinima} onChange={e => actualizarTramo(index, 'cantidadMinima', e.target.value)} placeholder="Ej: 1" />
            </div>
            <div>
              <label style={styles.label}>Cantidad máxima</label>
              <input style={styles.input} type="number" value={tramo.cantidadMaxima} onChange={e => actualizarTramo(index, 'cantidadMaxima', e.target.value)} placeholder="Vacío = sin límite" />
            </div>
            <div>
              <label style={styles.label}>Descuento %</label>
              <input style={styles.input} type="number" value={tramo.porcentajeDesc} onChange={e => actualizarTramo(index, 'porcentajeDesc', e.target.value)} placeholder="Ej: 10" />
            </div>
            <button style={styles.removeBtn} onClick={() => quitarTramo(index)}>Quitar</button>
          </div>
        ))}

        <div style={styles.actions}>
          <button style={styles.saveBtn} onClick={crearRegla} disabled={saving}>
            {saving ? 'Creando...' : 'Crear regla'}
          </button>
        </div>
      </div>

      <DataTable data={reglas} loading={loading} emptyMsg="No hay reglas de tarifa para este proveedor." />
    </div>
  )
}

const styles = {
  refreshBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', color: '#475569' },
  msg: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#334155', fontSize: '13px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  cardTitle: { margin: '0 0 1rem', fontSize: '16px', color: '#0f172a' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#fff', color: '#0f172a', outline: 'none' },
  tramosHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  sectionTitle: { margin: 0, fontSize: '15px', color: '#0f172a' },
  addBtn: { background: '#fff', color: '#1e293b', border: '1.5px solid #1e293b', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  tramoBox: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', marginBottom: '8px' },
  removeBtn: { background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  actions: { marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' },
  saveBtn: { padding: '10px 16px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}
