import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { useAuth } from '../AuthContext'

export default function Contratos() {
  const { session } = useAuth()

  const [contratos, setContratos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [reglas, setReglas] = useState([])
  const [productos, setProductos] = useState([])
  const [proveedorActual, setProveedorActual] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [vigenteDesdeManual, setVigenteDesdeManual] = useState(false)
  const vigenteDesdeInputRef = useRef(null)

  const hoyLocal = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  const [form, setForm] = useState({
    idEmpresaCompradora: '',
    idRegla: '',
    vigenteDesde: hoyLocal(),
    vigenteHasta: '',
    idProducto: '',
    porcentaje: '',
  })

  const cargarBase = async () => {
    setLoading(true)
    setMsg('')
    try {
      const [empresasData, reglasData, productosData, proveedoresData, contratosData] = await Promise.all([
        api.get('/api/v1/empresas'),
        api.get('/api/v1/tarifas-reglas'),
        api.get('/api/v1/products'),
        api.get('/api/v1/proveedores'),
        api.get('/api/v1/contratos-tarifa'),
      ])

      const proveedor = (proveedoresData || []).find(p => p.idEmpresa?.id === session?.id_empresa && p.activo)
      setProveedorActual(proveedor || null)

      setEmpresas((empresasData || []).filter(e => e.id !== session?.id_empresa && e.activo))

      const misReglas = proveedor
        ? (reglasData || []).filter(r => r.idProveedor?.id === proveedor.id && r.activo)
        : []
      setReglas(misReglas)

      setProductos(productosData || [])

      const misContratos = (contratosData || [])
        .filter(c =>
          session?.rol === 'proveedor'
            ? c.idProveedor?.id === proveedor?.id
            : c.idEmpresa?.id === session?.id_empresa
        )
        .map(c => ({
          empresa: c.idEmpresa?.nombre || c.nombreEmpresa || '—',
          proveedor: c.idProveedor?.idEmpresa?.nombre || c.nombreProveedor || '—',
          regla: c.idRegla?.nombre || c.nombreRegla || '—',
          'vigente desde': c.vigenteDesde ? new Date(c.vigenteDesde).toLocaleDateString('es-BO') : '—',
          'vigente hasta': c.vigenteHasta ? new Date(c.vigenteHasta).toLocaleDateString('es-BO') : 'Sin vencimiento',
          activo: c.activo ? 'Sí' : 'No',
        }))
      setContratos(misContratos)
    } catch (e) {
      setMsg(`Error cargando datos: ${e.message}`)
    }
    setLoading(false)
  }

  useEffect(() => { cargarBase() }, [session])

  const crearContrato = async () => {
    setMsg('')
    if (!form.idEmpresaCompradora || !form.idRegla || !form.vigenteDesde || !form.porcentaje) {
      setMsg('Completa empresa compradora, regla, fecha desde y porcentaje.')
      return
    }
    const porcentaje = Number(form.porcentaje)
    if (porcentaje < 0 || porcentaje > 100) {
      setMsg('El porcentaje debe estar entre 0 y 100.')
      return
    }
    if (!proveedorActual) {
      setMsg('Tu empresa no tiene un perfil de proveedor activo.')
      return
    }
    setSaving(true)
    try {
      const contrato = await api.post('/api/v1/contratos-tarifa', {
        vigenteDesde: new Date(form.vigenteDesde).toISOString(),
        vigenteHasta: form.vigenteHasta ? new Date(form.vigenteHasta).toISOString() : null,
        activo: true,
        idEmpresa: form.idEmpresaCompradora,
        idProveedor: proveedorActual.id,
        idRegla: form.idRegla,
      })

      await api.post('/api/v1/contratos-detalle', {
        porcentajeDescuento: porcentaje,
        idProducto: form.idProducto || null,
        idContrato: contrato.id,
      })

      setMsg('Contrato creado correctamente.')
      setMostrarForm(false)
      setVigenteDesdeManual(false)
      setForm({ idEmpresaCompradora: '', idRegla: '', vigenteDesde: hoyLocal(), vigenteHasta: '', idProducto: '', porcentaje: '' })
      cargarBase()
    } catch (e) {
      setMsg(`Error creando contrato: ${e.message}`)
    }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle="Crea descuentos directos para empresas compradoras"
        action={
          session?.rol === 'proveedor' && (
            <button style={styles.newBtn} onClick={() => setMostrarForm(true)}>+ Crear contrato</button>
          )
        }
      />

      {msg && <div style={styles.msg}>{msg}</div>}

      {mostrarForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Nuevo contrato</h3>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Empresa compradora</label>
              <select style={styles.input} value={form.idEmpresaCompradora} onChange={e => setForm({ ...form, idEmpresaCompradora: e.target.value })}>
                <option value="">Selecciona empresa</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Regla de tarifa</label>
              <select style={styles.input} value={form.idRegla} onChange={e => setForm({ ...form, idRegla: e.target.value })}>
                <option value="">Selecciona regla</option>
                {reglas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Vigente desde</label>
              {vigenteDesdeManual ? (
                <input
                  ref={vigenteDesdeInputRef}
                  style={styles.input}
                  type="datetime-local"
                  value={form.vigenteDesde}
                  onChange={e => setForm({ ...form, vigenteDesde: e.target.value })}
                />
              ) : (
                <button
                  type="button"
                  style={styles.dateChip}
                  onClick={() => {
                    setVigenteDesdeManual(true)
                    setTimeout(() => vigenteDesdeInputRef.current?.showPicker?.(), 50)
                  }}
                >
                  <span style={styles.dateChipLabel}>Hoy</span>
                  <span style={styles.dateChipDate}>
                    {new Date(form.vigenteDesde).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={styles.dateChipEdit}>clic para cambiar</span>
                </button>
              )}
            </div>
            <div>
              <label style={styles.label}>Vigente hasta</label>
              <input style={styles.input} type="datetime-local" value={form.vigenteHasta} onChange={e => setForm({ ...form, vigenteHasta: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Producto específico (opcional)</label>
              <select style={styles.input} value={form.idProducto} onChange={e => setForm({ ...form, idProducto: e.target.value })}>
                <option value="">Todos los productos</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Descuento %</label>
              <input style={styles.input} type="number" min="0" max="100" value={form.porcentaje} onChange={e => setForm({ ...form, porcentaje: e.target.value })} placeholder="Ej: 10" />
            </div>
          </div>
          <div style={styles.actions}>
            <button style={styles.cancelBtn} onClick={() => { setMostrarForm(false); setVigenteDesdeManual(false) }} disabled={saving}>Cancelar</button>
            <button style={styles.saveBtn} onClick={crearContrato} disabled={saving}>{saving ? 'Creando...' : 'Crear contrato'}</button>
          </div>
        </div>
      )}

      <DataTable data={contratos} loading={loading} emptyMsg="No hay contratos registrados." />
    </div>
  )
}

const styles = {
  newBtn: { background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  msg: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#334155', fontSize: '13px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  cardTitle: { margin: '0 0 1rem', fontSize: '16px', color: '#0f172a' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#fff', color: '#0f172a', outline: 'none' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' },
  dateChip: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '14px' },
  dateChipLabel: { background: '#1e40af', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  dateChipDate: { color: '#0f172a', fontWeight: '600', flex: 1 },
  dateChipEdit: { fontSize: '11px', color: '#94a3b8' },
  cancelBtn: { padding: '10px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#475569' },
  saveBtn: { padding: '10px 16px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
}
