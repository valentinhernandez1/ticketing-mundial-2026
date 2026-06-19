import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('valentin@ucu.edu.uy')
  const [password, setPassword] = useState('test1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.rol === 'ADMINISTRADOR_PAIS') navigate('/admin/estadios')
      else if (data.rol === 'FUNCIONARIO_VALIDACION') navigate('/validador')
      else navigate('/comprar')
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-900/20 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-yellow-900/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>⚽</div>
          <h1 className="text-3xl font-black mb-1">
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-yellow-400 bg-clip-text text-transparent">
              Mundial
            </span>
            <span className="text-white"> 2026</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium tracking-wide">
            USA 🇺🇸 · Canadá 🇨🇦 · México 🇲🇽
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl shadow-black/50">
          <h2 className="text-lg font-bold text-white mb-5">Ingresar al sistema</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="usuario@email.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
              Crear cuenta
            </Link>
          </p>

          <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-400 mb-2">Cuentas de demo (contraseña: test1234)</p>
            <div className="space-y-1">
              <p>👤 valentin@ucu.edu.uy — Usuario general</p>
              <p>🔧 admin.mex@fifa.org — Administrador</p>
              <p>🔍 func@fifa.org — Funcionario</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          Sistema de Ticketing · UCU · BDII 2026
        </p>
      </div>
    </div>
  )
}
