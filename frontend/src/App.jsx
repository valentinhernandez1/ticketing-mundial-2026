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

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const roleLabel = {
    USUARIO_GENERAL:       'Usuario general',
    ADMINISTRADOR_PAIS:    'Administrador de país',
    FUNCIONARIO_VALIDACION:'Funcionario de validación',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 hover:bg-zinc-800/70 px-2 py-1.5 rounded-lg transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {initial}
        </div>
        <span className="text-sm text-zinc-400 hidden md:block max-w-[160px] truncate">{user.email}</span>
        <ChevronDown
          size={13}
          className={`text-zinc-600 hidden md:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-900 border border-zinc-800/80 rounded-xl shadow-xl shadow-black/50 py-1 z-50">
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{roleLabel[user.rol] || user.rol}</p>
              </div>
            </div>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 transition-colors"
            >
              <LogOut size={14} />
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
      { path: '/comprar',        label: 'Comprar entradas', shortLabel: 'Comprar',    icon: ShoppingBag   },
      { path: '/mis-entradas',   label: 'Mis entradas',     shortLabel: 'Entradas',   icon: Ticket        },
      { path: '/mis-compras',    label: 'Mis compras',      shortLabel: 'Compras',    icon: Receipt       },
      { path: '/transferencias', label: 'Transferencias',   shortLabel: 'Transferir', icon: ArrowLeftRight},
    ],
    ADMINISTRADOR_PAIS: [
      { path: '/admin/estadios',    label: 'Estadios',    shortLabel: 'Estadios',    icon: Building2  },
      { path: '/admin/eventos',     label: 'Eventos',     shortLabel: 'Eventos',     icon: Calendar   },
      { path: '/admin/usuarios',    label: 'Usuarios',    shortLabel: 'Usuarios',    icon: Users      },
      { path: '/admin/dispositivos',label: 'Dispositivos',shortLabel: 'Dispositivos',icon: Smartphone },
      { path: '/admin/asignaciones',label: 'Asignaciones',shortLabel: 'Asign.',     icon: UserCheck  },
      { path: '/admin/reportes',    label: 'Reportes',    shortLabel: 'Reportes',    icon: BarChart3  },
    ],
    FUNCIONARIO_VALIDACION: [
      { path: '/validador', label: 'Validar acceso', shortLabel: 'Validar', icon: ScanLine },
    ],
  }

  const nav = navByRole[user.rol] || []

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50 flex items-center px-4 md:px-6 gap-4 md:gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sm">
            ⚽
          </div>
          <span className="font-bold text-sm hidden sm:inline tracking-tight">
            <span className="text-emerald-400">Mundial</span>
            <span className="text-zinc-200"> 2026</span>
          </span>
        </div>

        {/* Nav — desktop */}
        <nav className="hidden md:flex gap-0.5 flex-1">
          {nav.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 md:hidden" />
        <UserMenu user={user} logout={logout} />
      </header>

      <main className="pt-20 pb-20 md:pb-10 max-w-5xl mx-auto px-4 md:px-6">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/50 flex md:hidden">
        {nav.map(n => (
          <NavLink
            key={n.path}
            to={n.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
              }`
            }
          >
            <n.icon size={19} strokeWidth={1.5} />
            <span className="text-[9px] font-medium leading-tight text-center tracking-wide uppercase">
              {n.shortLabel || n.label}
            </span>
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
      <div className="w-6 h-6 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <Routes>
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<RootRedirect />} />
      <Route element={<Layout />}>
        <Route path="/comprar"        element={<Comprar />}        />
        <Route path="/mis-entradas"   element={<MisEntradas />}    />
        <Route path="/mis-compras"    element={<MisCompras />}     />
        <Route path="/transferencias" element={<Transferencias />} />
        <Route element={<RequireRole roles={['ADMINISTRADOR_PAIS']} />}>
          <Route path="/admin/estadios"     element={<AdminEstadios />}     />
          <Route path="/admin/eventos"      element={<AdminEventos />}      />
          <Route path="/admin/usuarios"     element={<AdminUsuarios />}     />
          <Route path="/admin/dispositivos" element={<AdminDispositivos />} />
          <Route path="/admin/asignaciones" element={<AdminAsignaciones />} />
          <Route path="/admin/reportes"     element={<AdminReportes />}     />
        </Route>
        <Route element={<RequireRole roles={['FUNCIONARIO_VALIDACION']} />}>
          <Route path="/validador" element={<Validador />} />
        </Route>
      </Route>
    </Routes>
  )
}
