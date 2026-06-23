import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'

const TIPOS_DOC = ['Cédula de Identidad', 'Pasaporte', 'RUC']

export default function MiCuenta() {
  const { session } = useAuth()

  // ── remote data ──────────────────────────────────────────────────────
  const [cargos,   setCargos]   = useState([])
  const [fullUser, setFullUser] = useState(null)
  const [contacto, setContacto] = useState(null)
  const [sucursal, setSucursal] = useState(null)
  const [loading,  setLoading]  = useState(true)

  // ── form state ───────────────────────────────────────────────────────
  const [userForm,     setUserForm]     = useState({ nombre: '', email: '' })
  const [passForm,     setPassForm]     = useState({ nueva: '', confirmar: '' })
  const [contactoForm, setContactoForm] = useState({ nombres: '', apellidos: '', idCargoEmpresa: '' })
  const [sucursalForm, setSucursalForm] = useState({ nombre: '', direccion: '' })

  const [saving,    setSaving]    = useState('')
  const [feedback,  setFeedback]  = useState({})
  const [avatarUrl,     setAvatarUrl]     = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [logoUrl,      setLogoUrl]      = useState('')
  const [logoPreview,  setLogoPreview]  = useState('')
  const [logoFile,     setLogoFile]     = useState(null)

  // ── proveedor verification (empresa only) ────────────────────────────
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

  // ── load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const calls = [
          api.get('/api/v1/usuarios?page=0&size=1000'),
          api.get('/api/v1/contactos-empresa'),
          api.get('/api/v1/sucursales-empresa'),
          api.get('/api/v1/cargos-empresa'),
        ]
        if (session?.rol === 'empresa') calls.push(api.get('/api/v1/proveedores'))

        const [usuariosRes, contactosRes, sucursalesRes, cargosRes, proveedoresRes] = await Promise.all(calls)

        const allUsers = usuariosRes?.content ?? []
        const me = allUsers.find(u => u.id === session.id)
        setFullUser(me)
        setUserForm({ nombre: me?.nombre ?? '', email: me?.email ?? '' })
        const avatarInit = me?.avatarUrl ?? ''
        setAvatarUrl(avatarInit)
        setAvatarPreview(avatarInit)
        const logoInit = session?.idEmpresa?.logo_url ?? session?.idEmpresa?.logoUrl ?? ''
        setLogoUrl(logoInit)
        setLogoPreview(logoInit)

        const allContactos = Array.isArray(contactosRes) ? contactosRes : []
        const myContacto = allContactos.find(c => {
          const empId = typeof c.idEmpresa === 'object' ? c.idEmpresa?.id : c.idEmpresa
          return empId === session.id_empresa
        })
        setContacto(myContacto ?? null)
        setContactoForm({
          nombres:        myContacto?.nombres                               ?? '',
          apellidos:      myContacto?.apellidos                            ?? '',
          idCargoEmpresa: myContacto?.idCargoEmpresa?.id ?? myContacto?.idCargoEmpresa ?? '',
        })

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

  // ── account saves ─────────────────────────────────────────────────────
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

  const saveUser = async () => {
    setSaving('user')
    try {
      await api.put(`/api/v1/usuarios/${session.id}`, {
        nombre:     userForm.nombre,
        email:      userForm.email,
        password:   fullUser?.password ?? '',
        activo:     fullUser?.activo ?? true,
        avatarUrl:  fullUser?.avatarUrl ?? null,
        idEmpresa:  session.id_empresa,
        idSucursal: session.idSucursal?.id ?? session.id_sucursal,
        idRol:      fullUser?.idRol?.id ?? fullUser?.idRol,
      })
      setFb('user', true, 'Datos actualizados correctamente.')
    } catch (e) { setFb('user', false, e.message) }
    setSaving('')
  }

  const saveAvatar = async () => {
    setSaving('avatar')
    try {
      let url = avatarUrl
      if (avatarFile) url = await uploadFile(avatarFile)
      await api.put(`/api/v1/usuarios/${session.id}`, {
        nombre:     fullUser?.nombre,
        email:      fullUser?.email,
        password:   fullUser?.password ?? '',
        activo:     fullUser?.activo ?? true,
        avatarUrl:  url || null,
        idEmpresa:  session.id_empresa,
        idSucursal: session.idSucursal?.id ?? session.id_sucursal,
        idRol:      fullUser?.idRol?.id ?? fullUser?.idRol,
      })
      setAvatarUrl(url)
      setAvatarPreview(url)
      setAvatarFile(null)
      setFb('avatar', true, 'Foto de perfil actualizada.')
    } catch (e) { setFb('avatar', false, e.message) }
    setSaving('')
  }

  const savePass = async () => {
    if (!passForm.nueva) return setFb('pass', false, 'Ingresa la nueva contraseña.')
    if (passForm.nueva !== passForm.confirmar) return setFb('pass', false, 'Las contraseñas no coinciden.')
    setSaving('pass')
    try {
      await api.put(`/api/v1/usuarios/${session.id}`, {
        nombre:     fullUser?.nombre,
        email:      fullUser?.email,
        password:   passForm.nueva,
        activo:     fullUser?.activo ?? true,
        idEmpresa:  session.id_empresa,
        idSucursal: session.idSucursal?.id ?? session.id_sucursal,
        idRol:      fullUser?.idRol?.id ?? fullUser?.idRol,
      })
      setPassForm({ nueva: '', confirmar: '' })
      setFb('pass', true, 'Contraseña actualizada.')
    } catch (e) { setFb('pass', false, e.message) }
    setSaving('')
  }

  const saveContacto = async () => {
    if (!contacto?.id) return setFb('contacto', false, 'No se encontró un contacto para esta empresa.')
    setSaving('contacto')
    try {
      await api.put(`/api/v1/contactos-empresa/${contacto.id}`, {
        nombres:        contactoForm.nombres,
        apellidos:      contactoForm.apellidos,
        idCargoEmpresa: contactoForm.idCargoEmpresa || null,
        idEmpresa:      session.id_empresa,
      })
      setFb('contacto', true, 'Contacto actualizado.')
    } catch (e) { setFb('contacto', false, e.message) }
    setSaving('')
  }

  const saveSucursal = async () => {
    const id = sucursal?.id ?? session.idSucursal?.id ?? session.id_sucursal
    if (!id) return setFb('sucursal', false, 'No se encontró la sucursal.')
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

  // ── proveedor verification submit ─────────────────────────────────────
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

  if (loading) return <p style={{ color: '#9599AE', padding: '2rem' }}>Cargando...</p>

  return (
    <div>
      <PageHeader title="Mi cuenta" subtitle="Administra tu perfil, contacto y sucursal" />

      {/* ── Datos de usuario ── */}
      <Section title="Datos de usuario" feedback={feedback.user}>
        <div style={s.grid2}>
          <Field label="Nombre completo" value={userForm.nombre} onChange={v => setUserForm(f => ({ ...f, nombre: v }))} />
          <Field label="Email" value={userForm.email} onChange={v => setUserForm(f => ({ ...f, email: v }))} type="email" />
        </div>
        <SaveBtn onClick={saveUser} loading={saving === 'user'} />
      </Section>

      {/* ── Foto de perfil ── */}
      <Section title="Foto de perfil" feedback={feedback.avatar}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #DDE0EE', background: '#F7F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 700, color: '#9599AE' }}>{(fullUser?.nombre || session?.nombre || '?')[0].toUpperCase()}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={s.label}>Foto de perfil</label>
            <label style={s.fileLabel}>
              <span style={s.fileBtn}>Elegir imagen</span>
              <span style={s.fileName}>{avatarFile ? avatarFile.name : 'Ningún archivo seleccionado'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setAvatarFile(f)
                  setAvatarPreview(URL.createObjectURL(f))
                }} />
            </label>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9599AE' }}>JPG, PNG o WebP. Máx. 5 MB.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
              <SaveBtn onClick={saveAvatar} loading={saving === 'avatar'} label="Guardar foto" />
              {(avatarPreview || avatarUrl) && (
                <button style={{ padding: '9px 14px', border: '1.5px solid #DDE0EE', borderRadius: 8, background: '#fff', fontSize: 13, color: '#9599AE', cursor: 'pointer' }}
                  onClick={() => { setAvatarFile(null); setAvatarUrl(''); setAvatarPreview('') }}>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Cambiar contraseña ── */}
      <Section title="Cambiar contraseña" feedback={feedback.pass}>
        <div style={s.grid2}>
          <Field label="Nueva contraseña"    value={passForm.nueva}      onChange={v => setPassForm(f => ({ ...f, nueva: v }))}      type="password" placeholder="••••••••" />
          <Field label="Confirmar contraseña" value={passForm.confirmar} onChange={v => setPassForm(f => ({ ...f, confirmar: v }))} type="password" placeholder="••••••••" />
        </div>
        <SaveBtn onClick={savePass} loading={saving === 'pass'} label="Cambiar contraseña" />
      </Section>

      {/* ── Empresa (solo lectura) ── */}
      <Section title="Datos de empresa" readOnly>
        <div style={s.grid2}>
          <ReadOnly label="Nombre comercial" value={session?.nombreEmpresa} />
          <ReadOnly label="Razón social"      value={session?.idEmpresa?.razonSocial} />
          <ReadOnly label="NIT"               value={session?.idEmpresa?.nit} />
          <ReadOnly label="Dominio"           value={session?.idEmpresa?.dominio} />
        </div>
      </Section>

      {/* ── Logo de empresa ── */}
      <Section title="Logo de empresa" feedback={feedback.logo}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: 14, border: '1.5px solid #DDE0EE', background: '#F7F8FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 8 }} onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DDE0EE" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={s.label}>Logo de empresa</label>
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
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9599AE' }}>
              JPG, PNG o WebP. Máx. 5 MB. Se usará en la página de proveedores.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
              <SaveBtn onClick={saveLogo} loading={saving === 'logo'} label="Guardar logo" />
              {(logoPreview || logoUrl) && (
                <button style={{ padding: '9px 14px', border: '1.5px solid #DDE0EE', borderRadius: 8, background: '#fff', fontSize: 13, color: '#9599AE', cursor: 'pointer' }}
                  onClick={() => { setLogoFile(null); setLogoUrl(''); setLogoPreview('') }}>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Contacto principal ── */}
      <Section title="Contacto principal" feedback={feedback.contacto}>
        <div style={s.grid2}>
          <Field label="Nombres"   value={contactoForm.nombres}   onChange={v => setContactoForm(f => ({ ...f, nombres: v }))}   placeholder="Ana" />
          <Field label="Apellidos" value={contactoForm.apellidos} onChange={v => setContactoForm(f => ({ ...f, apellidos: v }))} placeholder="García" />
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={s.label}>Cargo</label>
            <select style={s.input} value={contactoForm.idCargoEmpresa} onChange={e => setContactoForm(f => ({ ...f, idCargoEmpresa: e.target.value }))}>
              <option value="">Sin cargo asignado</option>
              {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>
        <SaveBtn onClick={saveContacto} loading={saving === 'contacto'} />
      </Section>

      {/* ── Sucursal ── */}
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
              <p style={{ ...s.muted, marginTop: 8 }}>
                Una vez aprobada, podrás acceder al panel de proveedor.
              </p>
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
          <p style={s.formDesc}>
            Completa la información requerida. Los campos marcados con <b>*</b> son obligatorios.
          </p>

          {verError && <div style={s.errorBox}>{verError}</div>}

          <FormSection number="1" title="Identificación Legal y Tributaria">
            <ReadOnly label="Nombre comercial"            value={verForm.nombreComercial || '—'} />
            <ReadOnly label="Razón social"                value={verForm.razonSocial     || '—'} />
            <ReadOnly label="NIT / Identificación Fiscal" value={verForm.nit             || '—'} />
            <FormField label="Nº Matrícula de Comercio"  value={verForm.numMatricula}     onChange={setV('numMatricula')}    placeholder="Ej: MC-123456" />
            <FormField label="Nº Registro FUNDAEMPRESA"  value={verForm.numFundaempresa}  onChange={setV('numFundaempresa')} placeholder="Ej: FE-789012" />
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
              <p style={{ margin: '0 0 1rem', fontSize: 12, color: '#9599AE', lineHeight: 1.6 }}>
                Subí los siguientes documentos para verificar tu empresa. Se aceptan imágenes (JPG, PNG) y PDF. Máx. 5 MB cada uno.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DocUpload
                  label="Matrícula de Comercio (SEPREC) *"
                  file={docs.matricula}
                  onChange={f => setDocs(d => ({ ...d, matricula: f }))}
                  accept="image/*,application/pdf"
                />
                <DocUpload
                  label="Carnet de Identidad del representante — cara frontal *"
                  file={docs.ciFrontal}
                  onChange={f => setDocs(d => ({ ...d, ciFrontal: f }))}
                  accept="image/*,application/pdf"
                />
                <DocUpload
                  label="Carnet de Identidad del representante — cara reverso *"
                  file={docs.ciReverso}
                  onChange={f => setDocs(d => ({ ...d, ciReverso: f }))}
                  accept="image/*,application/pdf"
                />
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
  const isPdf  = file?.type === 'application/pdf'
  const preview = file && !isPdf ? URL.createObjectURL(file) : null
  return (
    <div style={{ background: file ? '#f0fdf4' : '#F7F8FC', border: `1.5px solid ${file ? '#bbf7d0' : '#DDE0EE'}`, borderRadius: 10, padding: '12px 14px' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9599AE', marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {preview && (
          <img src={preview} alt="preview" style={{ height: 56, maxWidth: 100, objectFit: 'contain', borderRadius: 6, border: '1px solid #DDE0EE', background: '#fff', padding: 3 }} />
        )}
        {isPdf && (
          <div style={{ width: 56, height: 56, borderRadius: 6, border: '1px solid #DDE0EE', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>📄</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ padding: '7px 14px', background: file ? '#16a34a' : '#EEF1FB', color: file ? '#fff' : '#06175D', border: `1.5px solid ${file ? '#16a34a' : '#DDE0EE'}`, borderRadius: 7, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {file ? '✓ Cambiar' : 'Elegir archivo'}
            </span>
            <span style={{ fontSize: 12, color: '#9599AE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
  card:          { background: '#fff', border: '1px solid #DDE0EE', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' },
  cardHeader:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' },
  cardTitle:     { margin: 0, fontWeight: 700, fontSize: 15, color: '#1A1D3B' },
  readOnlyBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', background: '#EEF1FB', color: '#06175D', borderRadius: 20 },
  grid2:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  label:         { display: 'block', fontSize: 13, fontWeight: 500, color: '#9599AE', marginBottom: 5 },
  input:         { width: '100%', padding: '9px 12px', border: '1.5px solid #DDE0EE', borderRadius: 8, fontSize: 14, color: '#1A1D3B', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  roValue:       { padding: '9px 12px', border: '1.5px solid #EEF1FB', borderRadius: 8, fontSize: 14, color: '#1A1D3B', background: '#F7F8FC', fontWeight: 600 },
  saveBtn:       { padding: '9px 20px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  fileLabel:     { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  fileBtn:       { padding: '8px 14px', background: '#EEF1FB', color: '#06175D', border: '1.5px solid #DDE0EE', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0 },
  fileName:      { fontSize: 13, color: '#9599AE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  sectionTitle:  { margin: '0 0 .75rem', fontWeight: 700, fontSize: 15, color: '#1A1D3B' },
  muted:         { margin: 0, fontSize: 14, color: '#9599AE', lineHeight: 1.5 },
  verifyBtn:     { marginTop: '1rem', padding: '10px 20px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  formCard:      { background: '#fff', border: '1px solid #DDE0EE', borderRadius: 12, padding: '1.75rem', marginBottom: '1rem' },
  formTitle:     { margin: '0 0 6px', fontWeight: 700, fontSize: 17, color: '#06175D' },
  formDesc:      { margin: '0 0 1.5rem', fontSize: 13, color: '#9599AE', lineHeight: 1.6 },

  fsection:      { marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #F0F2FA' },
  fsectionHeader:{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' },
  fsectionNum:   { width: 26, height: 26, borderRadius: '50%', background: '#EEF1FB', color: '#06175D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  fsectionName:  { margin: 0, fontWeight: 700, fontSize: 14, color: '#1A1D3B' },
  fieldsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },

  errorBox:      { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem', color: '#dc2626', fontSize: 13 },
  formActions:   { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '0.5rem' },
  cancelBtn:     { padding: '10px 18px', border: '1.5px solid #DDE0EE', borderRadius: 8, background: '#fff', fontSize: 14, fontWeight: 500, color: '#9599AE', cursor: 'pointer' },
  submitBtn:     { padding: '10px 22px', background: '#06175D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
