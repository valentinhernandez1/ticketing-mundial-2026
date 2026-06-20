import { Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom'
import {
  ShoppingBag, Ticket, Receipt, ArrowLeftRight,
  Building2, Calendar, Smartphone, UserCheck, BarChart3,
  ScanLine,
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Comprar from './pages/Comprar'
import MisEntradas from './pages/MisEntradas'
import MisCompras from './pages/MisCompras'
import Transferencias from './pages/Transferencias'
import AdminEstadios from './pages/admin/AdminEstadios'
import AdminEventos from './pages/admin/AdminEventos'
import AdminReportes from './pages/admin/AdminReportes'
import AdminDispositivos from './pages/admin/AdminDispositivos'
import AdminAsignaciones from './pages/admin/AdminAsignaciones'
import Validador from './pages/validador/Validador'

function Layout() {
  const { user, logout } = useAuth()
  if (!user) return <Navigate to="/login" />

  const navByRole = {
    USUARIO_GENERAL: [
      { path: '/comprar', label: 'Comprar entradas', shortLabel: 'Comprar', icon: ShoppingBag },
      { path: '/mis-entradas', label: 'Mis entradas', shortLabel: 'Entradas', icon: Ticket },
      { path: '/mis-compras', label: 'Mis compras', shortLabel: 'Compras', icon: Receipt },
      { path: '/transferencias', label: 'Transferencias', shortLabel: 'Transferir', icon: ArrowLeftRight },
    ],
    ADMINISTRADOR_PAIS: [
      { path: '/admin/estadios', label: 'Estadios', shortLabel: 'Estadios', icon: Building2 },
      { path: '/admin/eventos', label: 'Eventos', shortLabel: 'Eventos', icon: Calendar },
      { path: '/admin/dispositivos', label: 'Dispositivos', shortLabel: 'Dispositivos', icon: Smartphone },
      { path: '/admin/asignaciones', label: 'Asignaciones', shortLabel: 'Asign.', icon: UserCheck },
      { path: '/admin/reportes', label: 'Reportes', shortLabel: 'Reportes', icon: BarChart3 },
    ],
    FUNCIONARIO_VALIDACION: [
      { path: '/validador', label: 'Validar acceso', shortLabel: 'Validar', icon: ScanLine },
    ],
  }

  const nav = navByRole[user.rol] || []
  const initial = user.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 flex items-center px-6 gap-6">
        <div className="flex items-center gap-2 mr-4">
          <span className="text-xl">⚽</span>
          <span className="font-black text-base">
            <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">Mundial</span>
            <span className="text-white"> 2026</span>
          </span>
        </div>
        {/* Nav links — solo visible en desktop */}
        <nav className="hidden md:flex gap-1 flex-1">
          {nav.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        {/* Spacer en mobile para empujar el avatar a la derecha */}
        <div className="flex-1 md:hidden" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
            {initial}
          </div>
          <span className="text-sm text-zinc-400 hidden md:block">{user.email}</span>
          <button onClick={logout} className="btn-ghost text-xs">Salir</button>
        </div>
      </header>

      <main className="pt-16 pb-20 md:pb-0 max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Bottom nav — solo mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-900 border-t border-zinc-800 flex md:hidden">
        {nav.map(n => (
          <NavLink
            key={n.path}
            to={n.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            <n.icon size={20} strokeWidth={1.5} />
            <span className="text-[10px] leading-tight text-center">{n.shortLabel || n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.rol === 'ADMINISTRADOR_PAIS') return <Navigate to="/admin/estadios" />
  if (user.rol === 'FUNCIONARIO_VALIDACION') return <Navigate to="/validador" />
  return <Navigate to="/comprar" />
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RootRedirect />} />
      <Route element={<Layout />}>
        <Route path="/comprar" element={<Comprar />} />
        <Route path="/mis-entradas" element={<MisEntradas />} />
        <Route path="/mis-compras" element={<MisCompras />} />
        <Route path="/transferencias" element={<Transferencias />} />
        <Route path="/admin/estadios" element={<AdminEstadios />} />
        <Route path="/admin/eventos" element={<AdminEventos />} />
        <Route path="/admin/dispositivos" element={<AdminDispositivos />} />
        <Route path="/admin/asignaciones" element={<AdminAsignaciones />} />
        <Route path="/admin/reportes" element={<AdminReportes />} />
        <Route path="/validador" element={<Validador />} />
      </Route>
    </Routes>
  )
}
