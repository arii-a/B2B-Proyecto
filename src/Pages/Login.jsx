import { useState } from 'react'
import { api, setToken } from '../api/client'
import { useAuth, buildSession } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../ThemeContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const [showReset, setShowReset]       = useState(false)
  const [resetStep, setResetStep]       = useState('email') // 'email' | 'code'
  const [resetEmail, setResetEmail]     = useState('')
  const [resetCode, setResetCode]       = useState('')
  const [resetNewPwd, setResetNewPwd]   = useState('')
  const [resetMsg, setResetMsg]         = useState('')
  const [resetErr, setResetErr]         = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  const handleResetRequest = async (e) => {
    e.preventDefault()
    setResetErr('')
    setResetLoading(true)
    try {
      const res = await fetch(`${BASE}/api/v1/auth/password-reset/request?email=${encodeURIComponent(resetEmail.trim())}`, { method: 'POST' })
      const text = await res.text()
      if (!res.ok) throw new Error(text || 'Error al enviar')
      setResetStep('code')
    } catch (err) {
      setResetErr(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetConfirm = async (e) => {
    e.preventDefault()
    setResetErr('')
    setResetLoading(true)
    try {
      const params = new URLSearchParams({ email: resetEmail.trim(), code: resetCode.trim(), newPassword: resetNewPwd })
      const res = await fetch(`${BASE}/api/v1/auth/password-reset/confirm?${params}`, { method: 'POST' })
      const text = await res.text()
      if (!res.ok) throw new Error(text || 'Código inválido o expirado')
      setResetMsg(text)
    } catch (err) {
      setResetErr(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authRes = await api.post('/api/v1/auth/login', {
        email: email.trim(),
        passwordHash: password,
      })
      const token = authRes?.access_token
      if (!token) throw new Error('No se recibió token del servidor.')
      setToken(token)
      const sesion = await buildSession(token)
      login(sesion)
      navigate('/dashboard')
    } catch (err) {
      setToken(null)
      setError(err.message || 'Credenciales incorrectas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <button onClick={toggle} style={s.themeBtn} title={dark ? 'Modo claro' : 'Modo oscuro'}>
        {dark ? '☀' : '☾'}
      </button>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.logoRow}>
            <div style={s.logoBox}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="white" fillOpacity=".15"/>
                <path d="M7 21L14 7L21 21H7Z" fill="white"/>
              </svg>
            </div>
            <span style={s.logoText}>Marketplace B2B</span>
          </div>

          <h2 style={s.heroTitle}>La plataforma para tu negocio</h2>
          <p style={s.heroSub}>Conecta con proveedores, gestiona órdenes y controla tu cadena de suministro desde un solo lugar.</p>

          <div style={s.featureList}>
            {['Gestión de órdenes en tiempo real', 'Panel de proveedores y contratos', 'Reportes y auditoría de actividad'].map(f => (
              <div key={f} style={s.feature}>
                <div style={s.featureDot} />
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.card}>
          {!showReset ? (<>
            <h1 style={s.cardTitle}>Iniciar sesión</h1>
            <p style={s.cardSub}>Ingresa tus credenciales para acceder al panel</p>

            <form onSubmit={handleLogin} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Correo electrónico</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Contraseña</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={s.errorBox}>
                  <span style={s.errorIcon}>!</span>
                  {error}
                </div>
              )}

              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Ingresar →'}
              </button>
            </form>

            <button style={s.forgotBtn} onClick={() => { setShowReset(true); setResetStep('email'); setResetMsg(''); setResetErr('') }}>
              ¿Olvidaste tu contraseña?
            </button>

            <div style={s.divider}>
              <span style={s.dividerLine} />
              <span style={s.dividerText}>¿No tienes cuenta?</span>
              <span style={s.dividerLine} />
            </div>

            <button style={s.btnOutline} onClick={() => navigate('/registro')}>
              Registrar empresa
            </button>
          </>) : (<>
            <button style={s.backBtn} onClick={() => { setShowReset(false); setResetStep('email'); setResetEmail(''); setResetCode(''); setResetNewPwd(''); setResetMsg(''); setResetErr('') }}>← Volver</button>

            {resetStep === 'email' ? (<>
              <h1 style={s.cardTitle}>Recuperar contraseña</h1>
              <p style={s.cardSub}>Te enviaremos un código de 6 dígitos a tu correo</p>
              <form onSubmit={handleResetRequest} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Correo electrónico</label>
                  <input style={s.input} type="email" placeholder="usuario@empresa.com"
                    value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
                {resetErr && <div style={s.errorBox}><span style={s.errorIcon}>!</span>{resetErr}</div>}
                <button style={s.btn} type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>) : resetMsg ? (<>
              <h1 style={s.cardTitle}>¡Listo!</h1>
              <div style={s.successBox}>{resetMsg}</div>
              <button style={{...s.btn, marginTop: '1.5rem'}} onClick={() => { setShowReset(false); setResetStep('email'); setResetMsg('') }}>
                Iniciar sesión →
              </button>
            </>) : (<>
              <h1 style={s.cardTitle}>Ingresa el código</h1>
              <p style={s.cardSub}>Revisa tu correo <strong>{resetEmail}</strong> y escribe el código de 6 dígitos</p>
              <form onSubmit={handleResetConfirm} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Código de verificación</label>
                  <input style={{...s.input, letterSpacing: '4px', fontSize: '20px', textAlign: 'center'}}
                    type="text" placeholder="000000" maxLength={6}
                    value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Nueva contraseña</label>
                  <input style={s.input} type="password" placeholder="••••••••"
                    value={resetNewPwd} onChange={e => setResetNewPwd(e.target.value)} required minLength={6} />
                </div>
                {resetErr && <div style={s.errorBox}><span style={s.errorIcon}>!</span>{resetErr}</div>}
                <button style={s.btn} type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Verificando...' : 'Cambiar contraseña'}
                </button>
                <button type="button" style={s.forgotBtn} onClick={() => { setResetStep('email'); setResetErr('') }}>
                  ¿No recibiste el código? Reenviar
                </button>
              </form>
            </>)}
          </>)}
        </div>
      </div>
    </div>
  )
}

const s = {
  page:        { display: 'flex', minHeight: '100vh' },

  left:        { flex: '1', background: '#06175D', display: 'flex', alignItems: 'center',
                 justifyContent: 'center', padding: '3rem 2.5rem' },
  leftInner:   { maxWidth: '400px' },
  logoRow:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem' },
  logoBox:     { width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText:    { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '.3px' },
  heroTitle:   { fontSize: '32px', fontWeight: '800', color: '#fff', lineHeight: 1.2, marginBottom: '1rem' },
  heroSub:     { fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '2rem' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feature:     { display: 'flex', alignItems: 'center', gap: '12px' },
  featureDot:  { width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', flexShrink: 0 },
  featureText: { fontSize: '13px', color: 'rgba(255,255,255,0.65)' },

  right:       { width: '440px', flexShrink: 0, background: 'var(--c-bg-page)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card:        { background: 'var(--c-bg)', borderRadius: '16px', padding: '2.25rem',
                 width: '100%', boxShadow: 'var(--c-shadow-md)' },
  cardTitle:   { fontSize: '22px', fontWeight: '800', color: 'var(--c-primary)', marginBottom: '4px' },
  cardSub:     { fontSize: '13px', color: 'var(--c-muted)', marginBottom: '1.75rem' },

  form:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field:       { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:       { fontSize: '12px', fontWeight: '700', color: 'var(--c-text)', textTransform: 'uppercase', letterSpacing: '.5px' },
  input:       { padding: '10px 14px', border: '1.5px solid var(--c-border)', borderRadius: '8px',
                 fontSize: '14px', color: 'var(--c-text)', background: 'var(--c-input-bg)', outline: 'none',
                 transition: 'border-color .15s' },

  errorBox:    { display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2',
                 border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px',
                 fontSize: '13px', color: '#B91C1C' },
  errorIcon:   { width: '18px', height: '18px', borderRadius: '50%', background: '#FEE2E2',
                 color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                 fontWeight: '700', fontSize: '11px', flexShrink: 0 },

  btn:         { padding: '12px', background: 'var(--c-primary)', color: '#fff', border: 'none',
                 borderRadius: '9px', fontSize: '14px', fontWeight: '700',
                 cursor: 'pointer', marginTop: '0.25rem', letterSpacing: '.3px' },

  forgotBtn:   { background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '12px',
                 cursor: 'pointer', padding: '8px 0 0', textAlign: 'left' },

  backBtn:     { background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: '13px',
                 fontWeight: '700', cursor: 'pointer', padding: '0 0 12px', textAlign: 'left' },

  successBox:  { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
                 padding: '10px 14px', fontSize: '13px', color: '#166534' },

  divider:     { display: 'flex', alignItems: 'center', gap: '10px', margin: '1.5rem 0 1rem' },
  dividerLine: { flex: 1, height: '1px', background: 'var(--c-border)' },
  dividerText: { fontSize: '12px', color: 'var(--c-muted)', whiteSpace: 'nowrap' },

  btnOutline:  { width: '100%', padding: '11px', background: 'transparent',
                 color: 'var(--c-primary)', border: '1.5px solid var(--c-primary)',
                 borderRadius: '9px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },

  themeBtn:    { position: 'fixed', top: '1rem', right: '1rem', background: 'var(--c-bg)',
                 border: '1.5px solid var(--c-border)', borderRadius: '8px', padding: '6px 11px',
                 fontSize: '15px', cursor: 'pointer', color: 'var(--c-muted)', boxShadow: 'var(--c-shadow-sm)' },
}
