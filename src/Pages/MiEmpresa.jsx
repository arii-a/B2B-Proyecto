import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'

const TIPOS_DOC = ['Cédula de Identidad', 'Pasaporte', 'RUC']
const BLANK_C   = { nombres: '', apellidos: '', telefono: '', idCargoEmpresa: '' }

function initials(nombres, apellidos) {
  return ((nombres?.[0] ?? '') + (apellidos?.[0] ?? '')).toUpperCase() || '?'
}

export default function MiEmpresa() {
  const { session } = useAuth()

  const [cargos,   setCargos]   = useState([])
  const [contactos, setContactos] = useState([])
  const [sucursal, setSucursal] = useState(null)
  const [loading,  setLoading]  = useState(true)

  const [editandoContacto, setEditandoContacto] = useState(null) // null = nuevo
  const [contactoForm,     setContactoForm]     = useState(BLANK_C)
  const [sucursalForm,     setSucursalForm]     = useState({ nombre: '', direccion: '' })
  const [logoUrl,          setLogoUrl]          = useState('')
  const [logoPreview,      setLogoPreview]      = useState('')
  const [logoFile,         setLogoFile]         = useState(null)

  const [saving,   setSaving]   = useState('')
  const [feedback, setFeedback] = useState({})

  // proveedor verification
  const [estadoProveedor, setEstadoProveedor] = useState(null)
  const [showVerForm,     setShowVerForm]     = useState(false)
  const [enviado,         setEnviado]         = useState(false)
  const [verLoading,      setVerLoading]      = useState(false)
  const [verError,        setVerError]        = useState('')
  const [docs, setDocs] = useState({ matricula: null, ciFrontal: null, ciReverso: null })
  const [verForm, setVerForm] = useState({
    nombreComercial:     session?.nombreEmpresa          || '',
    razonSocial:         session?.idEmpresa?.razonSocial || '',
    nit:                 session?.idEmpresa?.nit         || '',
    numMatricula:        '',
    numFundaempresa:     '',
    nombreRepresentante: '',
    cargoRepresentante:  '',
    tipoDocumento:       'Cédula de Identidad',
    numDocumento:        '',
    banco:               '',
    numeroCuenta:        '',
    titularCuenta:       '',
    domicilioFiscal:     '',
  })

  const cargarContactos = async () => {
    try {
      const res = await api.get('/api/v1/contactos-empresa')
      const all = Array.isArray(res) ? res : []
      setContactos(all.filter(c => {
        const empId = typeof c.idEmpresa === 'object' ? c.idEmpresa?.id : c.idEmpresa
        return empId === session.id_empresa
      }))
    } catch {}
  }

  useEffect(() => {
    const init = async () => {
      try {
        const calls = [
          api.get('/api/v1/contactos-empresa'),
          api.get('/api/v1/sucursales-empresa'),
          api.get('/api/v1/cargos-empresa'),
        ]
        if (session?.rol === 'empresa') calls.push(api.get('/api/v1/proveedores'))

        const [contactosRes, sucursalesRes, cargosRes, proveedoresRes] = await Promise.all(calls)

        const logoInit = session?.idEmpresa?.logo_url ?? session?.idEmpresa?.logoUrl ?? ''
        setLogoUrl(logoInit)
        setLogoPreview(logoInit)

        const allContactos = Array.isArray(contactosRes) ? contactosRes : []
        setContactos(allContactos.filter(c => {
          const empId = typeof c.idEmpresa === 'object' ? c.idEmpresa?.id : c.idEmpresa
          return empId === session.id_empresa
        }))

        const allSucursales = Array.isArray(sucursalesRes) ? sucursalesRes : []
        const mySucursal = allSucursales.find(s => s.id === (session.idSucursal?.id ?? session.id_sucursal))
        setSucursal(mySucursal ?? null)
        setSucursalForm({
          nombre:    mySucursal?.nombre    ?? session.idSucursal?.nombre    ?? '',
          direccion: mySucursal?.direccion ?? session.idSucursal?.direccion ?? '',
        })

        setCargos(Array.isArray(cargosRes) ? cargosRes : [])

        if (proveedoresRes) {
          const arr = Array.isArray(proveedoresRes) ? proveedoresRes : (proveedoresRes?.content ?? [])
          const mio = arr.find(p => {
            const empId = typeof p.idEmpresa === 'object' ? p.idEmpresa?.id : p.idEmpresa
            return empId === session.id_empresa
          })
          if (mio) setEstadoProveedor(mio.activo ? 'aprobado' : 'pendiente')
        }
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  const setFb = (section, ok, msg) => setFeedback(f => ({ ...f, [section]: { ok, msg } }))

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('b2b_token')}` },
      body: fd,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
    return data.url
  }

  const saveLogo = async () => {
    setSaving('logo')
    try {
      let url = logoUrl
      if (logoFile) url = await uploadFile(logoFile)
      await api.put(`/api/v1/empresas/${session.id_empresa}`, {
        nombre:       session?.nombreEmpresa,
        razon_social: session?.idEmpresa?.razonSocial,
        nit:          session?.idEmpresa?.nit,
        dominio:      session?.idEmpresa?.dominio,
        logo_url:     url || null,
      })
      setLogoUrl(url)
      setLogoPreview(url)
      setLogoFile(null)
      setFb('logo', true, 'Logo actualizado correctamente.')
    } catch (e) { setFb('logo', false, e.message) }
    setSaving('')
  }

  const saveContacto = async () => {
    if (!contactoForm.nombres || !contactoForm.apellidos)
      return setFb('contacto', false, 'Nombres y apellidos son requeridos.')
    setSaving('contacto')
    try {
      const body = {
        nombres:        contactoForm.nombres,
        apellidos:      contactoForm.apellidos,
        telefono:       contactoForm.telefono       || null,
        idCargoEmpresa: contactoForm.idCargoEmpresa || null,
        idEmpresa:      session.id_empresa,
      }
      if (editandoContacto?.id) {
        await api.put(`/api/v1/contactos-empresa/${editandoContacto.id}`, body)
        setFb('contacto', true, 'Contacto actualizado.')
      } else {
        await api.post('/api/v1/contactos-empresa', body)
        setFb('contacto', true, 'Contacto agregado.')
      }
      setContactoForm(BLANK_C)
      setEditandoContacto(null)
      await cargarContactos()
    } catch (e) { setFb('contacto', false, e.message) }
    setSaving('')
  }

  const editarContacto = (c) => {
    setEditandoContacto(c)
    setContactoForm({
      nombres:        c.nombres        ?? '',
      apellidos:      c.apellidos      ?? '',
      telefono:       c.telefono       ?? '',
      idCargoEmpresa: c.idCargoEmpresa ?? '',
    })
    setFb('contacto', null, '')
  }

  const cancelarEdicion = () => {
    setEditandoContacto(null)
    setContactoForm(BLANK_C)
    setFb('contacto', null, '')
  }

  const eliminarContacto = async (c) => {
    if (!window.confirm(`¿Eliminar el contacto "${c.nombres} ${c.apellidos}"?`)) return
    try {
      await api.delete(`/api/v1/contactos-empresa/${c.id}`)
      setFb('contacto', true, 'Contacto eliminado.')
      await cargarContactos()
    } catch (e) { setFb('contacto', false, e.message) }
  }

  const saveSucursal = async () => {
    const id = sucursal?.id ?? session.idSucursal?.id ?? session.id_sucursal
    if (!id) return setFb('sucursal', false, 'No se encontró la sucursal asignada.')
    setSaving('sucursal')
    try {
      await api.put(`/api/v1/sucursales-empresa/${id}`, {
        nombre:      sucursalForm.nombre,
        direccion:   sucursalForm.direccion,
        coordenadas: sucursal?.coordenadas ?? null,
        activo:      sucursal?.activo ?? true,
        idEmpresa:   session.id_empresa,
      })
      setFb('sucursal', true, 'Sucursal actualizada.')
    } catch (e) { setFb('sucursal', false, e.message) }
    setSaving('')
  }

  const handleVerSubmit = async () => {
    setVerError('')
    if (!verForm.nombreRepresentante || !verForm.numDocumento || !verForm.banco || !verForm.numeroCuenta) {
      setVerError('Completa los campos obligatorios: representante, número de documento, banco y número de cuenta.')
      return
    }
    if (!docs.matricula || !docs.ciFrontal || !docs.ciReverso) {
      setVerError('Debés subir los 3 documentos: Matrícula de Comercio, CI frontal y CI reverso.')
      return
    }
    setVerLoading(true)
    try {
      const [urlMatricula, urlCiFrontal, urlCiReverso] = await Promise.all([
        uploadFile(docs.matricula),
        uploadFile(docs.ciFrontal),
        uploadFile(docs.ciReverso),
      ])
      await api.post(`/api/v1/proveedores/${session.id_empresa}`, {
        activo: false,
        urlMatricula,
        urlCiFrontal,
        urlCiReverso,
      })
      setEnviado(true)
      setEstadoProveedor('pendiente')
      setShowVerForm(false)
    } catch (e) { setVerError(e.message || 'Error al enviar la solicitud.') }
    setVerLoading(false)
  }

  const setV = key => e => setVerForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) return <p style={{ color: 'var(--c-muted)', padding: '2rem' }}>Cargando...</p>

  return (
    <div>
      <PageHeader title="Mi empresa" subtitle="Logo, contactos, sucursal y verificación" />

      {/* ── Logo ── */}
      <Section title="Logo de empresa" feedback={feedback.logo}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: 14, border: '1.5px solid var(--c-border-mid)', background: 'var(--c-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 8 }} onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--c-border-mid)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={s.label}>Imagen del logo</label>
            <label style={s.fileLabel}>
              <span style={s.fileBtn}>Elegir imagen</span>
              <span style={s.fileName}>{logoFile ? logoFile.name : 'Ningún archivo seleccionado'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setLogoFile(f)
                  setLogoPreview(URL.createObjectURL(f))
                }} />
            </label>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--c-muted)' }}>JPG, PNG o WebP. Máx. 5 MB. Se muestra en el catálogo de proveedores.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
              <SaveBtn onClick={saveLogo} loading={saving === 'logo'} label="Guardar logo" />
              {(logoPreview || logoUrl) && (
                <button style={s.btnQuitar} onClick={() => { setLogoFile(null); setLogoUrl(''); setLogoPreview('') }}>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Datos de empresa ── */}
      <Section title="Datos de empresa" readOnly>
        <div style={s.grid2}>
          <ReadOnly label="Nombre comercial" value={session?.nombreEmpresa} />
          <ReadOnly label="Razón social"      value={session?.idEmpresa?.razonSocial} />
          <ReadOnly label="NIT"               value={session?.idEmpresa?.nit} />
          <ReadOnly label="Dominio"           value={session?.idEmpresa?.dominio} />
        </div>
      </Section>

      {/* ── Contactos ── */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <p style={s.cardTitle}>Contactos de la empresa</p>
          <span style={s.countBadge}>{contactos.length} registrado{contactos.length !== 1 ? 's' : ''}</span>
        </div>

        {feedback.contacto && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12,
            background: feedback.contacto.ok ? '#f0fdf4' : '#fef2f2',
            color:      feedback.contacto.ok ? '#16a34a'  : '#dc2626',
            border:     `1px solid ${feedback.contacto.ok ? '#bbf7d0' : '#fca5a5'}`,
          }}>{feedback.contacto.msg}</div>
        )}

        {/* Formulario agregar / editar */}
        <div style={s.contactForm}>
          <p style={s.contactFormTitle}>
            {editandoContacto ? `Editando: ${editandoContacto.nombres} ${editandoContacto.apellidos}` : 'Agregar contacto'}
          </p>
          <div style={s.grid2}>
            <Field label="Nombres *"   value={contactoForm.nombres}   onChange={v => setContactoForm(f => ({ ...f, nombres: v }))}   placeholder="Ana" />
            <Field label="Apellidos *" value={contactoForm.apellidos} onChange={v => setContactoForm(f => ({ ...f, apellidos: v }))} placeholder="García" />
            <Field label="Teléfono / Celular" value={contactoForm.telefono} onChange={v => setContactoForm(f => ({ ...f, telefono: v }))} placeholder="+591 70000000" />
            <div>
              <label style={s.label}>Cargo</label>
              <select style={s.input} value={contactoForm.idCargoEmpresa} onChange={e => setContactoForm(f => ({ ...f, idCargoEmpresa: e.target.value }))}>
                <option value="">Sin cargo asignado</option>
                {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
            {editandoContacto && (
              <button style={s.btnCancelar} onClick={cancelarEdicion} disabled={saving === 'contacto'}>
                Cancelar
              </button>
            )}
            <button style={s.saveBtn} onClick={saveContacto} disabled={saving === 'contacto'}>
              {saving === 'contacto' ? 'Guardando...' : editandoContacto ? 'Guardar cambios' : 'Agregar contacto'}
            </button>
          </div>
        </div>

        {/* Lista de contactos */}
        {contactos.length === 0 ? (
          <p style={{ margin: '1rem 0 0', fontSize: 13, color: 'var(--c-muted)' }}>
            Aún no hay contactos registrados para esta empresa.
          </p>
        ) : (
          <div style={s.contactGrid}>
            {contactos.map(c => (
              <div key={c.id} style={{ ...s.contactCard, ...(editandoContacto?.id === c.id ? s.contactCardActive : {}) }}>
                <div style={s.contactTop}>
                  <div style={s.avatar}>{initials(c.nombres, c.apellidos)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.contactNombre}>{c.nombres} {c.apellidos}</p>
                    {c.nombreCargoEmpresa && <span style={s.cargoBadge}>{c.nombreCargoEmpresa}</span>}
                    {c.telefono && <p style={s.contactTel}>{c.telefono}</p>}
                  </div>
                </div>
                <div style={s.contactActions}>
                  <button style={s.btnEdit} onClick={() => editarContacto(c)}>Editar</button>
                  <button style={s.btnDel}  onClick={() => eliminarContacto(c)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sucursal asignada ── */}
      <Section title="Sucursal asignada" feedback={feedback.sucursal}>
        <div style={s.grid2}>
          <Field label="Nombre de sucursal" value={sucursalForm.nombre}    onChange={v => setSucursalForm(f => ({ ...f, nombre: v }))}    placeholder="Oficina Central" />
          <Field label="Dirección"          value={sucursalForm.direccion} onChange={v => setSucursalForm(f => ({ ...f, direccion: v }))} placeholder="Av. Bush 123, Santa Cruz" />
        </div>
        <SaveBtn onClick={saveSucursal} loading={saving === 'sucursal'} />
      </Section>

      {/* ── Verificación como proveedor (empresa only) ── */}
      {session?.rol === 'empresa' && (
        <div style={s.card}>
          <p style={s.sectionTitle}>Verificación como proveedor</p>

          {estadoProveedor === 'aprobado' ? (
            <StatusBadge color="#16a34a" bg="#f0fdf4" border="#bbf7d0">
              Verificado como proveedor — tienes acceso completo al panel de ventas.
            </StatusBadge>

          ) : estadoProveedor === 'pendiente' || enviado ? (
            <div>
              <StatusBadge color="#d97706" bg="#fffbeb" border="#fde68a">
                Solicitud enviada — pendiente de aprobación por el administrador.
              </StatusBadge>
              <p style={{ ...s.muted, marginTop: 8 }}>Una vez aprobada, podrás acceder al panel de proveedor.</p>
            </div>

          ) : showVerForm ? null : (
            <div>
              <p style={s.muted}>
                Tu cuenta está registrada como empresa compradora. Si también deseas vender productos
                en la plataforma, completa la verificación como proveedor.
              </p>
              <button style={s.verifyBtn} onClick={() => setShowVerForm(true)}>
                Verificarme como proveedor →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Formulario de verificación ── */}
      {showVerForm && session?.rol === 'empresa' && (
        <div style={s.formCard}>
          <p style={s.formTitle}>Solicitud de verificación como proveedor</p>
          <p style={s.formDesc}>Completa la información requerida. Los campos marcados con <b>*</b> son obligatorios.</p>

          {verError && <div style={s.errorBox}>{verError}</div>}

          <FormSection number="1" title="Identificación Legal y Tributaria">
            <ReadOnly label="Nombre comercial"            value={verForm.nombreComercial || '—'} />
            <ReadOnly label="Razón social"                value={verForm.razonSocial     || '—'} />
            <ReadOnly label="NIT / Identificación Fiscal" value={verForm.nit             || '—'} />
            <FormField label="Nº Matrícula de Comercio"  value={verForm.numMatricula}    onChange={setV('numMatricula')}    placeholder="Ej: MC-123456" />
            <FormField label="Nº Registro FUNDAEMPRESA"  value={verForm.numFundaempresa} onChange={setV('numFundaempresa')} placeholder="Ej: FE-789012" />
          </FormSection>

          <FormSection number="2" title="Representación Legal">
            <FormField label="Nombre completo del representante *" value={verForm.nombreRepresentante} onChange={setV('nombreRepresentante')} placeholder="Ej: Juan Carlos Pérez López" />
            <FormField label="Cargo del representante"             value={verForm.cargoRepresentante}  onChange={setV('cargoRepresentante')}  placeholder="Ej: Gerente General" />
            <div>
              <label style={s.label}>Tipo de documento *</label>
              <select style={s.input} value={verForm.tipoDocumento} onChange={setV('tipoDocumento')}>
                {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <FormField label="Número de documento *" value={verForm.numDocumento} onChange={setV('numDocumento')} placeholder="Ej: 12345678 SC" />
          </FormSection>

          <FormSection number="3" title="Documentos Requeridos">
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 1rem', fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 }}>
                Subí los siguientes documentos para verificar tu empresa. Se aceptan imágenes (JPG, PNG) y PDF. Máx. 5 MB cada uno.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DocUpload label="Matrícula de Comercio (SEPREC) *"                        file={docs.matricula} onChange={f => setDocs(d => ({ ...d, matricula: f }))} accept="image/*,application/pdf" />
                <DocUpload label="Carnet de Identidad del representante — cara frontal *"   file={docs.ciFrontal} onChange={f => setDocs(d => ({ ...d, ciFrontal: f }))} accept="image/*,application/pdf" />
                <DocUpload label="Carnet de Identidad del representante — cara reverso *"   file={docs.ciReverso} onChange={f => setDocs(d => ({ ...d, ciReverso: f }))} accept="image/*,application/pdf" />
              </div>
            </div>
          </FormSection>

          <FormSection number="4" title="Información Financiera y Bancaria">
            <FormField label="Banco *"              value={verForm.banco}          onChange={setV('banco')}          placeholder="Ej: Banco Nacional de Bolivia" />
            <FormField label="Número de cuenta *"   value={verForm.numeroCuenta}   onChange={setV('numeroCuenta')}   placeholder="Ej: 1234567890" />
            <FormField label="Titular de la cuenta" value={verForm.titularCuenta}  onChange={setV('titularCuenta')}  placeholder="Ej: TechCorp S.R.L." />
            <FormField label="Dirección del domicilio fiscal" value={verForm.domicilioFiscal} onChange={setV('domicilioFiscal')} placeholder="Ej: Av. Cristóbal de Mendoza 456" fullWidth />
          </FormSection>

          <div style={s.formActions}>
            <button style={s.cancelBtn} onClick={() => { setShowVerForm(false); setVerError('') }} disabled={verLoading}>
              Cancelar
            </button>
            <button style={s.submitBtn} onClick={handleVerSubmit} disabled={verLoading}>
              {verLoading ? 'Enviando...' : 'Enviar solicitud →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function Section({ title, children, feedback, readOnly }) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <p style={s.cardTitle}>{title}</p>
        {readOnly && <span style={s.readOnlyBadge}>Solo lectura</span>}
      </div>
      {feedback && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12,
          background: feedback.ok ? '#f0fdf4' : '#fef2f2',
          color:      feedback.ok ? '#16a34a'  : '#dc2626',
          border:     `1px solid ${feedback.ok ? '#bbf7d0' : '#fca5a5'}`,
        }}>{feedback.msg}</div>
      )}
      {children}
    </div>
  )
}

function StatusBadge({ color, bg, border, children }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color }}>
      <span style={{ marginTop: 1 }}>●</span>
      <span>{children}</span>
    </div>
  )
}

function FormSection({ number, title, children }) {
  return (
    <div style={s.fsection}>
      <div style={s.fsectionHeader}>
        <span style={s.fsectionNum}>{number}</span>
        <p style={s.fsectionName}>{title}</p>
      </div>
      <div style={s.fieldsGrid}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
      <label style={s.label}>{label}</label>
      <input style={s.input} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

function DocUpload({ label, file, onChange, accept }) {
  const isPdf   = file?.type === 'application/pdf'
  const preview = file && !isPdf ? URL.createObjectURL(file) : null
  return (
    <div style={{ background: file ? '#f0fdf4' : 'var(--c-bg-subtle)', border: `1.5px solid ${file ? '#bbf7d0' : 'var(--c-border-mid)'}`, borderRadius: 10, padding: '12px 14px' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {preview && <img src={preview} alt="preview" style={{ height: 56, maxWidth: 100, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--c-border-mid)', background: 'var(--c-bg)', padding: 3 }} />}
        {isPdf && (
          <div style={{ width: 56, height: 56, borderRadius: 6, border: '1px solid var(--c-border-mid)', background: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>📄</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ padding: '7px 14px', background: file ? '#16a34a' : 'var(--c-primary-light)', color: file ? '#fff' : 'var(--c-primary)', border: `1.5px solid ${file ? '#16a34a' : 'var(--c-border-mid)'}`, borderRadius: 7, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {file ? '✓ Cambiar' : 'Elegir archivo'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file ? file.name : 'Ningún archivo seleccionado'}
            </span>
            <input type="file" accept={accept} style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f) }} />
          </label>
        </div>
      </div>
    </div>
  )
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <div style={s.roValue}>{value || '—'}</div>
    </div>
  )
}

function SaveBtn({ onClick, loading, label = 'Guardar cambios' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
      <button style={s.saveBtn} onClick={onClick} disabled={loading}>
        {loading ? 'Guardando...' : label}
      </button>
    </div>
  )
}

/* ─── Styles ─── */
const s = {
  card:            { background: 'var(--c-bg)', border: '1px solid var(--c-border-mid)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' },
  cardHeader:      { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' },
  cardTitle:       { margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--c-text)' },
  readOnlyBadge:   { fontSize: 11, fontWeight: 600, padding: '2px 8px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 20 },
  countBadge:      { fontSize: 11, fontWeight: 600, padding: '2px 8px', background: 'var(--c-bg-subtle)', color: 'var(--c-muted)', borderRadius: 20, border: '1px solid var(--c-border-mid)' },
  grid2:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  label:           { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-muted)', marginBottom: 5 },
  input:           { width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, fontSize: 14, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-input-bg)' },
  roValue:         { padding: '9px 12px', border: '1.5px solid var(--c-primary-light)', borderRadius: 8, fontSize: 14, color: 'var(--c-text)', background: 'var(--c-bg-subtle)', fontWeight: 600 },
  saveBtn:         { padding: '9px 20px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  fileLabel:       { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  fileBtn:         { padding: '8px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0 },
  fileName:        { fontSize: 13, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  btnQuitar:       { padding: '9px 14px', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, background: 'var(--c-bg)', fontSize: 13, color: 'var(--c-muted)', cursor: 'pointer' },
  btnCancelar:     { padding: '9px 16px', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, background: 'var(--c-bg)', fontSize: 14, color: 'var(--c-muted)', cursor: 'pointer' },

  contactForm:     { background: 'var(--c-bg-subtle)', border: '1px solid var(--c-border-mid)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1rem' },
  contactFormTitle:{ margin: '0 0 .75rem', fontWeight: 600, fontSize: 13, color: 'var(--c-muted)' },

  contactGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, marginTop: '0.5rem' },
  contactCard:     { background: 'var(--c-bg)', border: '1px solid var(--c-border-mid)', borderRadius: 10, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: 10 },
  contactCardActive:{ borderColor: 'var(--c-primary)', boxShadow: '0 0 0 2px var(--c-primary-light)' },
  contactTop:      { display: 'flex', gap: 10, alignItems: 'flex-start' },
  avatar:          { width: 40, height: 40, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 },
  contactNombre:   { margin: '0 0 3px', fontWeight: 700, fontSize: 13, color: 'var(--c-text)' },
  cargoBadge:      { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--c-primary-light)', color: 'var(--c-primary)', display: 'inline-block' },
  contactTel:      { margin: '4px 0 0', fontSize: 12, color: 'var(--c-muted)' },
  contactActions:  { display: 'flex', gap: 6, borderTop: '1px solid var(--c-border-light)', paddingTop: 8 },
  btnEdit:         { flex: 1, padding: '5px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnDel:          { padding: '5px 10px', background: 'var(--c-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },

  sectionTitle:    { margin: '0 0 .75rem', fontWeight: 700, fontSize: 15, color: 'var(--c-text)' },
  muted:           { margin: 0, fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.5 },
  verifyBtn:       { marginTop: '1rem', padding: '10px 20px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  formCard:        { background: 'var(--c-bg)', border: '1px solid var(--c-border-mid)', borderRadius: 12, padding: '1.75rem', marginBottom: '1rem' },
  formTitle:       { margin: '0 0 6px', fontWeight: 700, fontSize: 17, color: 'var(--c-primary)' },
  formDesc:        { margin: '0 0 1.5rem', fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.6 },

  fsection:        { marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--c-border-light)' },
  fsectionHeader:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' },
  fsectionNum:     { width: 26, height: 26, borderRadius: '50%', background: 'var(--c-primary-light)', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  fsectionName:    { margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--c-text)' },
  fieldsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },

  errorBox:        { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem', color: '#dc2626', fontSize: 13 },
  formActions:     { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '0.5rem' },
  cancelBtn:       { padding: '10px 18px', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, background: 'var(--c-bg)', fontSize: 14, fontWeight: 500, color: 'var(--c-muted)', cursor: 'pointer' },
  submitBtn:       { padding: '10px 22px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
