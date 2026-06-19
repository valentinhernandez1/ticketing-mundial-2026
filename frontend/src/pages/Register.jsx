import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, AlertCircle, ChevronLeft } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    // Dirección
    paisDireccion: '4',
    localidad: '',
    calle: '',
    numeroDireccion: '',
    codigoPostal: '',
    // Documento
    paisDocumento: '4',
    tipoDocumento: 'CI',
    numeroDocumento: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        idPaisDireccion: parseInt(form.paisDireccion),
        localidad: form.localidad,
        calle: form.calle,
        numeroDireccion: parseInt(form.numeroDireccion),
        codigoPostal: form.codigoPostal,
        idPaisDocumento: parseInt(form.paisDocumento),
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
      }
      await register(payload)
      navigate('/comprar')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, children }) => (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-900/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-black">
            <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">Mundial</span>
            <span className="text-white"> 2026</span>
          </h1>
        </div>

        <div className="card shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/login" className="btn-ghost p-1.5">
              <ChevronLeft size={18} />
            </Link>
            <h2 className="text-lg font-bold text-white">Crear cuenta</h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2.5 mb-5">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Datos personales */}
            <div className="pb-2 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Datos personales</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Juan" />
                </Field>
                <Field label="Apellido">
                  <input className="input-field" value={form.apellido} onChange={e => set('apellido', e.target.value)} required placeholder="Pérez" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Email">
                  <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="juan@email.com" />
                </Field>
                <Field label="Contraseña">
                  <input type="password" className="input-field" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="••••••••" minLength={6} />
                </Field>
              </div>
            </div>

            {/* Dirección */}
            <div className="pb-2 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Dirección</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="País (ID)">
                  <input type="number" className="input-field" value={form.paisDireccion} onChange={e => set('paisDireccion', e.target.value)} required placeholder="4" />
                </Field>
                <Field label="Localidad">
                  <input className="input-field" value={form.localidad} onChange={e => set('localidad', e.target.value)} required placeholder="Montevideo" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="Calle">
                  <input className="input-field" value={form.calle} onChange={e => set('calle', e.target.value)} required placeholder="18 de Julio" />
                </Field>
                <Field label="Número">
                  <input type="number" className="input-field" value={form.numeroDireccion} onChange={e => set('numeroDireccion', e.target.value)} required placeholder="1234" />
                </Field>
                <Field label="Cód. Postal">
                  <input className="input-field" value={form.codigoPostal} onChange={e => set('codigoPostal', e.target.value)} placeholder="11200" />
                </Field>
              </div>
            </div>

            {/* Documento */}
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Documento de identidad</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="País (ID)">
                  <input type="number" className="input-field" value={form.paisDocumento} onChange={e => set('paisDocumento', e.target.value)} required placeholder="4" />
                </Field>
                <Field label="Tipo">
                  <select className="input-field" value={form.tipoDocumento} onChange={e => set('tipoDocumento', e.target.value)}>
                    <option value="CI">CI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="DNI">DNI</option>
                  </select>
                </Field>
                <Field label="Número">
                  <input className="input-field" value={form.numeroDocumento} onChange={e => set('numeroDocumento', e.target.value)} required placeholder="12345678" />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Crear cuenta
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
