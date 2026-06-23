const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function getToken() {
  return localStorage.getItem('b2b_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 204) return null
  if (res.status === 401) {
    localStorage.removeItem('b2b_token')
    window.location.href = '/login'
    return
  }
  const text = await res.text()
  if (!res.ok) {
    let msg = text
    try { msg = JSON.parse(text)?.message || text } catch {}
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (!text) return null
  return JSON.parse(text)
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
}

export function setToken(token) {
  if (token) localStorage.setItem('b2b_token', token)
  else localStorage.removeItem('b2b_token')
}

export function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}
