import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle } from 'lucide-react'

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
      {/* Glow sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-900/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-5 select-none">⚽</div>
          <h1 className="text-2xl font-black tracking-tight mb-1">
            <span className="text-emerald-400">Mundial</span>
            <span className="text-white"> 2026</span>
          </h1>
          <p className="text-zinc-600 text-xs tracking-widest uppercase font-medium mt-1">
            Sistema de Ticketing
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl shadow-black/40">
          <h2 className="text-base font-semibold text-white mb-5">Iniciar sesión</h2>

          {error && (
            <div className="flex items-center gap-2 alert-error mb-4">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
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
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
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
              className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 mt-5">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Crear cuenta
            </Link>
          </p>

          {/* Demo */}
          <div className="mt-5 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/40">
            <p className="text-[11px] font-medium text-zinc-500 mb-2 uppercase tracking-wider">
              Cuentas de demo · test1234
            </p>
            <div className="space-y-1 text-[11px] text-zinc-600 font-mono">
              <p>valentin@ucu.edu.uy</p>
              <p>admin.mex@fifa.org</p>
              <p>func@fifa.org</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-800 mt-6">
          UCU · BDII 2026
        </p>
      </div>
    </div>
  )
}
