import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'

export default function MiCuenta() {
  const { session } = useAuth()

  const [fullUser,      setFullUser]      = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [userForm,      setUserForm]      = useState({ nombre: '', email: '' })
  const [passForm,      setPassForm]      = useState({ nueva: '', confirmar: '' })
  const [avatarUrl,     setAvatarUrl]     = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [saving,        setSaving]        = useState('')
  const [feedback,      setFeedback]      = useState({})

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/api/v1/usuarios?page=0&size=1000')
        const allUsers = res?.content ?? []
        const me = allUsers.find(u => u.id === session.id)
        setFullUser(me)
        setUserForm({ nombre: me?.nombre ?? '', email: me?.email ?? '' })
        const avatarInit = me?.avatarUrl ?? ''
        setAvatarUrl(avatarInit)
        setAvatarPreview(avatarInit)
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  const setFb = (section, ok, msg) => {
    setFeedback(f => ({ ...f, [section]: { ok, msg } }))
    setTimeout(() => setFeedback(f => ({ ...f, [section]: null })), 8000)
  }

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

  const buildPayload = (overrides = {}) => ({
    nombre:     fullUser?.nombre,
    email:      fullUser?.email,
    activo:     fullUser?.activo ?? true,
    avatarUrl:  fullUser?.avatarUrl ?? null,
    idEmpresa:  session.id_empresa,
    idSucursal: session.idSucursal?.id ?? session.id_sucursal,
    ...overrides,
  })

  const saveUser = async () => {
    setSaving('user')
    try {
      await api.put(`/api/v1/usuarios/${session.id}`, buildPayload({
        nombre: userForm.nombre,
        email:  userForm.email,
      }))
      setFb('user', true, 'Datos actualizados correctamente.')
    } catch (e) { setFb('user', false, e.message) }
    setSaving('')
  }

  const saveAvatar = async () => {
    setSaving('avatar')
    try {
      let url = avatarUrl
      if (avatarFile) url = await uploadFile(avatarFile)
      await api.put(`/api/v1/usuarios/${session.id}`, buildPayload({ avatarUrl: url || null }))
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
      await api.put(`/api/v1/usuarios/${session.id}`, buildPayload({ password: passForm.nueva }))
      setPassForm({ nueva: '', confirmar: '' })
      setFb('pass', true, 'Contraseña actualizada.')
    } catch (e) { setFb('pass', false, e.message) }
    setSaving('')
  }

  if (loading) return <p style={{ color: 'var(--c-muted)', padding: '2rem' }}>Cargando...</p>

  return (
    <div>
      <PageHeader title="Mi cuenta" subtitle="Perfil personal, foto y contraseña" />

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
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--c-border-mid)', background: 'var(--c-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--c-muted)' }}>{(fullUser?.nombre || session?.nombre || '?')[0].toUpperCase()}</span>
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
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--c-muted)' }}>JPG, PNG o WebP. Máx. 5 MB.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
              <SaveBtn onClick={saveAvatar} loading={saving === 'avatar'} label="Guardar foto" />
              {(avatarPreview || avatarUrl) && (
                <button style={{ padding: '9px 14px', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, background: 'var(--c-bg)', fontSize: 13, color: 'var(--c-muted)', cursor: 'pointer' }}
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
    </div>
  )
}

/* ─── Sub-components ─── */

function Section({ title, children, feedback }) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <p style={s.cardTitle}>{title}</p>
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

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
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
  card:       { background: 'var(--c-bg)', border: '1px solid var(--c-border-mid)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' },
  cardTitle:  { margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--c-text)' },
  grid2:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  label:      { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-muted)', marginBottom: 5 },
  input:      { width: '100%', padding: '9px 12px', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, fontSize: 14, color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-input-bg)' },
  saveBtn:    { padding: '9px 20px', background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  fileLabel:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  fileBtn:    { padding: '8px 14px', background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: '1.5px solid var(--c-border-mid)', borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0 },
  fileName:   { fontSize: 13, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
}
