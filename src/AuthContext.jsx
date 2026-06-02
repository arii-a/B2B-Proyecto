import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, decodeJwt } from './api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('b2b_token')
    const stored = localStorage.getItem('b2b_user')
    if (token && stored) {
      try {
        const payload = decodeJwt(token)
        if (payload && payload.exp * 1000 > Date.now()) {
          setSession(JSON.parse(stored))
        } else {
          setToken(null)
          localStorage.removeItem('b2b_user')
        }
      } catch {
        setToken(null)
        localStorage.removeItem('b2b_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    localStorage.setItem('b2b_user', JSON.stringify(userData))
    setSession(userData)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('b2b_user')
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export async function buildSession(token) {
  const payload = decodeJwt(token)
  const userId = payload?.id

  const [usuarios, proveedores] = await Promise.all([
    api.get('/api/v1/usuarios'),
    api.get('/api/v1/proveedores'),
  ])

  const usuario = usuarios.find(u => u.id === userId || u.email === payload?.sub)
  if (!usuario) throw new Error('Usuario no encontrado en el sistema.')

  const esProveedor = proveedores.find(p => p.idEmpresa?.id === usuario.idEmpresa?.id && p.activo)

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    activo: usuario.activo,
    rol: esProveedor ? 'proveedor' : 'empresa',
    id_empresa: usuario.idEmpresa?.id,
    id_sucursal: usuario.idSucursal?.id,
    idEmpresa: usuario.idEmpresa,
    idSucursal: usuario.idSucursal,
    nombreEmpresa: usuario.idEmpresa?.nombre,
    idProveedor: esProveedor?.id || null,
  }
}

export const useAuth = () => useContext(AuthContext)
