import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom'
import {
  ShoppingBag, Ticket, Receipt, ArrowLeftRight,
  Building2, Calendar, Smartphone, UserCheck, BarChart3,
  ScanLine, Users, LogOut, ChevronDown,
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
import AdminUsuarios from './pages/admin/AdminUsuarios'
import Validador from './pages/validador/Validador'

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initial = user.email?.[0]?.toUpperCase() || '?'

  // cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 hover:bg-zinc-800 px-2 py-1.5 rounded-lg transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {initial}
        </div>
        <span className="text-sm text-zinc-400 hidden md:block max-w-[160px] truncate">{user.email}</span>
        <ChevronDown
          size={14}
          className={`text-zinc-500 hidden md:block transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 py-1 z-50">
          {/* Info del usuario */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {user.rol === 'USUARIO_GENERAL' && 'Usuario general'}
                  {user.rol === 'ADMINISTRADOR_PAIS' && 'Administrador de país'}
                  {user.rol === 'FUNCIONARIO_VALIDACION' && 'Funcionario de validación'}
                </p>
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
      { path: '/admin/usuarios', label: 'Usuarios', shortLabel: 'Usuarios', icon: Users },
      { path: '/admin/dispositivos', label: 'Dispositivos', shortLabel: 'Dispositivos', icon: Smartphone },
      { path: '/admin/asignaciones', label: 'Asignaciones', shortLabel: 'Asign.', icon: UserCheck },
      { path: '/admin/reportes', label: 'Reportes', shortLabel: 'Reportes', icon: BarChart3 },
    ],
    FUNCIONARIO_VALIDACION: [
      { path: '/validador', label: 'Validar acceso', shortLabel: 'Validar', icon: ScanLine },
    ],
  }

  const nav = navByRole[user.rol] || []

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center px-4 md:px-6 gap-4 md:gap-6">
        <div className="flex items-center gap-2.5 mr-2 md:mr-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-yellow-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
            ⚽
          </div>
          <span className="font-black text-base hidden sm:inline">
            <span className="bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">Mundial</span>
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
        {/* Spacer en mobile */}
        <div className="flex-1 md:hidden" />
        <UserMenu user={user} logout={logout} />
      </header>

      <main className="pt-20 pb-20 md:pb-8 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Bottom nav — solo mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 flex md:hidden">
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

function RequireRole({ roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (!roles.includes(user.rol)) return <Navigate to="/" />
  return <Outlet />
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
        <Route element={<RequireRole roles={['ADMINISTRADOR_PAIS']} />}>
          <Route path="/admin/estadios" element={<AdminEstadios />} />
          <Route path="/admin/eventos" element={<AdminEventos />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/dispositivos" element={<AdminDispositivos />} />
          <Route path="/admin/asignaciones" element={<AdminAsignaciones />} />
          <Route path="/admin/reportes" element={<AdminReportes />} />
        </Route>
        <Route element={<RequireRole roles={['FUNCIONARIO_VALIDACION']} />}>
          <Route path="/validador" element={<Validador />} />
        </Route>
      </Route>
    </Routes>
  )
}
