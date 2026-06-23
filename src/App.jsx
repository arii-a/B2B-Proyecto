import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

import Login from './Pages/Login'
import Registro from './Pages/RegistroEmpresa'

import Layout from './components/Layout'
import Dashboard from './Pages/Dashboard'
import MisOrdenes from './Pages/MisOrdenes'
import Procedures from './Pages/Procedures'
import VistaPage from './Pages/VistaPage'
import Facturas from './Pages/Facturas'
import Contratos from './Pages/Contratos'
import TarifasProducto from './Pages/TarifasProducto'
import Productos from './Pages/Productos'
import Stock from './Pages/Stock'
import PreciosBase from './Pages/PreciosBase'
import Proveedores from './Pages/Proveedores'
import Catalogo from './Pages/Catalogo'
import MisProductos from './Pages/MisProductos'
import Almacenes from './Pages/Almacenes'
import MiCuenta from './Pages/MiCuenta'
import Admin from './Pages/Admin'
import AdminProductos from './Pages/admin/AdminProductos'
import AdminUsuarios from './Pages/admin/AdminUsuarios'
import AdminLogs from './Pages/admin/AdminLogs'
import AdminEmpresas from './Pages/admin/AdminEmpresas'
import AdminProveedores from './Pages/admin/AdminProveedores'

function ProtectedRoutes() {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mis-ordenes" element={<MisOrdenes />} />
        <Route path="/procedures" element={<Procedures />} />


        <Route path="/contratos" element={<Contratos />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/tarifas-producto" element={<TarifasProducto />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/precios" element={<PreciosBase />} />
        <Route path="/comisiones" element={<VistaPage tipo="comisiones" />} />
        <Route path="/resumen" element={<VistaPage tipo="resumen" />} />
        <Route path="/proveedores"    element={<Proveedores />} />
        <Route path="/catalogo"       element={<Catalogo />} />
        <Route path="/mis-productos"  element={<MisProductos />} />
        <Route path="/almacenes"      element={<Almacenes />} />
        <Route path="/mi-cuenta"   element={<MiCuenta />} />

        <Route path="/admin/empresas"    element={<AdminEmpresas />} />
        <Route path="/admin/proveedores" element={<AdminProveedores />} />
        <Route path="/admin/productos"   element={<AdminProductos />} />
        <Route path="/admin/usuarios"    element={<AdminUsuarios />} />
        <Route path="/admin/logs"        element={<AdminLogs />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/registro"
        element={session ? <Navigate to="/dashboard" replace /> : <Registro />}
      />

      <Route
        path="/admin"
        element={session?.rol === 'admin' ? <Admin /> : <Navigate to="/login" replace />}
      />

      <Route path="/tarifas-producto" element={<TarifasProducto />} />

      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}