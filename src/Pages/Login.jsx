import { useState } from 'react'
import { api, setToken } from '../api/client'
import { useAuth, buildSession } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

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
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleCargarQr = async () => {
    setQrError('')
    setQrData(null)
    setQrLoading(true)
    try {
      const res = await api.post('/api/pagos/crear-cobro', {
        country: 'BO',
        amount: '10',
        currency: 'USDT',
        network: 'POLYGON',
        charge_reason: 'Pago de prueba B2B',
        reservation_validity_time: '10',
        customer: {
          name: 'Test',
          lastname: 'Usuario',
          document_number: '00000000',
        },
      })
      setQrData(res)
    } catch (err) {
      setQrError(err.message || 'Error al cargar QR desde Stereum.')
    } finally {
      setQrLoading(false)
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.sidePanel}>
        <div style={styles.sidePanelInner}>
          <p style={styles.sidePanelTitle}>Pago de prueba</p>
          <p style={styles.sidePanelSub}>Genera un QR de pago cripto vía Stereum</p>
          <button
            style={{ ...styles.qrBtn, ...(qrLoading ? styles.qrBtnDisabled : {}) }}
            type="button"
            onClick={handleCargarQr}
            disabled={qrLoading}
          >
            {qrLoading ? 'Cargando...' : 'Cargar QR de prueba desde Stereum'}
          </button>
          {qrError && <p style={styles.qrError}>{qrError}</p>}
          {qrData && (
            <div style={styles.qrResult}>
              {qrData.qr_base64 && (
                <img
                  src={`data:image/png;base64,${qrData.qr_base64}`}
                  alt="QR de pago"
                  style={styles.qrImage}
                />
              )}
              <div style={styles.qrMeta}>
                <p style={styles.qrMetaRow}><span style={styles.qrMetaLabel}>Monto:</span> {qrData.amount} {qrData.currency}</p>
                <p style={styles.qrMetaRow}><span style={styles.qrMetaLabel}>Red:</span> {qrData.network}</p>
                <p style={styles.qrMetaRow}><span style={styles.qrMetaLabel}>Estado:</span> {qrData.transaction_status}</p>
                {qrData.payment_link && (
                  <a href={qrData.payment_link} target="_blank" rel="noopener noreferrer" style={styles.qrLink}>
                    Abrir enlace de pago →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoCircle}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#1e293b" />
              <path d="M7 20L14 8L21 20H7Z" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div>
            <p style={styles.logoTitle}>Marketplace B2B</p>
            <p style={styles.logoSub}>Panel de gestión</p>
          </div>
        </div>

        <p style={styles.heading}>Iniciá sesión</p>

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar →'}
          </button>
        </form>

        <div style={styles.registerBox}>
          <p style={styles.registerText}>¿Tu empresa todavía no tiene cuenta?</p>
          <button
            style={styles.registerBtn}
            type="button"
            onClick={() => navigate('/registro')}
          >
            Registrar empresa →
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  bg: { minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '2rem', flexWrap: 'wrap' },
  sidePanel: { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '320px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', alignSelf: 'flex-start' },
  sidePanelInner: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sidePanelTitle: { margin: 0, fontWeight: '700', fontSize: '15px', color: '#0f172a' },
  sidePanelSub: { margin: 0, fontSize: '13px', color: '#64748b' },
  qrBtn: { width: '100%', padding: '11px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  qrBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  qrError: { color: '#dc2626', fontSize: '13px', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', margin: 0 },
  qrResult: { display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' },
  qrImage: { width: '100%', maxWidth: '220px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  qrMeta: { width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' },
  qrMetaRow: { margin: 0, fontSize: '13px', color: '#334155' },
  qrMetaLabel: { fontWeight: '600', color: '#0f172a' },
  qrLink: { fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' },
  card: { background: '#fff', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' },
  logoCircle: { width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 },
  logoTitle: { margin: 0, fontWeight: '700', fontSize: '15px', color: '#0f172a' },
  logoSub: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  heading: { fontSize: '22px', fontWeight: '600', color: '#0f172a', margin: '0 0 1.5rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  error: { color: '#dc2626', fontSize: '13px', marginBottom: '0.75rem', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px' },
  submit: { width: '100%', padding: '11px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
  registerBox: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' },
  registerText: { margin: '0 0 0.75rem', fontSize: '13px', color: '#64748b' },
  registerBtn: { width: '100%', padding: '10px', background: '#fff', color: '#1e293b', border: '1.5px solid #1e293b', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}
