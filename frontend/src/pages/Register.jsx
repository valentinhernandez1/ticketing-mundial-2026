import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { UserPlus, AlertCircle, ChevronLeft, Plus, X, CheckCircle } from 'lucide-react'
import { paisId } from '../utils/pais'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Field({ label, required: req, error, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
        {label}
        {req && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  const len = password.length
  const strength = len < 4 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3
  const labels = ['Muy corta', 'Débil', 'Aceptable', 'Fuerte']
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const textColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-200 ${i <= strength ? colors[strength] : 'bg-zinc-700'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [telefonos, setTelefonos] = useState([''])
  const [paises, setPaises] = useState([])
  const [touched, setTouched] = useState({})

  useEffect(() => {
    api.get('/paises')
      .then(r => setPaises(r.data))
      .catch(() => setPaises([
        { id: 1, nombre: 'Estados Unidos' },
        { id: 2, nombre: 'Canadá' },
        { id: 3, nombre: 'México' },
        { id: 4, nombre: 'Uruguay' },
      ]))
  }, [])

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    dirIdPais: '4',
    localidad: '',
    calle: '',
    numero: '',
    codigoPostal: '',
    docIdPais: '4',
    tipoDocumento: 'CI',
    docNumero: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const touch = (k) => setTouched(t => ({ ...t, [k]: true }))

  const agregarTelefono = () => setTelefonos(t => [...t, ''])
  const quitarTelefono = (i) => setTelefonos(t => t.filter((_, idx) => idx !== i))
  const setTelefono = (i, v) => setTelefonos(t => t.map((tel, idx) => idx === i ? v : tel))

  // validaciones inline
  const fieldErrors = {
    email: touched.email && form.email && !emailRegex.test(form.email)
      ? 'El formato del email no es válido'
      : null,
    password: touched.password && form.password && form.password.length < 6
      ? 'La contraseña debe tener al menos 6 caracteres'
      : null,
    nombre: touched.nombre && !form.nombre.trim() ? 'El nombre es requerido' : null,
    apellido: touched.apellido && !form.apellido.trim() ? 'El apellido es requerido' : null,
  }

  const isValid =
    form.nombre.trim() &&
    form.apellido.trim() &&
    emailRegex.test(form.email) &&
    form.password.length >= 6 &&
    form.localidad.trim() &&
    form.calle.trim() &&
    form.numero.trim() &&
    form.docNumero.trim()

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
        dirIdPais: parseInt(form.dirIdPais),
        localidad: form.localidad,
        calle: form.calle,
        numero: form.numero,
        codigoPostal: form.codigoPostal,
        docIdPais: parseInt(form.docIdPais),
        tipoDocumento: form.tipoDocumento,
        docNumero: form.docNumero,
        telefonos: telefonos
          .filter(t => t.trim())
          .map(t => ({ numero: t.trim(), tipo: 'MOVIL' })),
      }
      await register(payload)
      navigate('/comprar')
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Datos personales</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" required error={fieldErrors.nombre}>
                  <input
                    className={`input-field ${fieldErrors.nombre ? 'border-red-600 focus:border-red-500' : ''}`}
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    onBlur={() => touch('nombre')}
                    required
                    placeholder="Juan"
                  />
                </Field>
                <Field label="Apellido" required error={fieldErrors.apellido}>
                  <input
                    className={`input-field ${fieldErrors.apellido ? 'border-red-600 focus:border-red-500' : ''}`}
                    value={form.apellido}
                    onChange={e => set('apellido', e.target.value)}
                    onBlur={() => touch('apellido')}
                    required
                    placeholder="Pérez"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Email" required error={fieldErrors.email}>
                  <div className="relative">
                    <input
                      type="email"
                      className={`input-field pr-8 ${fieldErrors.email ? 'border-red-600 focus:border-red-500' : touched.email && form.email && emailRegex.test(form.email) ? 'border-green-700' : ''}`}
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      onBlur={() => touch('email')}
                      required
                      placeholder="juan@email.com"
                    />
                    {touched.email && form.email && emailRegex.test(form.email) && (
                      <CheckCircle size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none" />
                    )}
                  </div>
                </Field>
                <Field label="Contraseña" required error={fieldErrors.password}>
                  <input
                    type="password"
                    className={`input-field ${fieldErrors.password ? 'border-red-600 focus:border-red-500' : ''}`}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    onBlur={() => touch('password')}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                  {touched.password && form.password && (
                    <PasswordStrength password={form.password} />
                  )}
                </Field>
              </div>
            </div>

            {/* Teléfonos */}
            <div className="pb-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Teléfonos de contacto</p>
                <button type="button" onClick={agregarTelefono} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                  <Plus size={12} /> Agregar
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {telefonos.map((tel, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="tel"
                      className="input-field flex-1"
                      value={tel}
                      onChange={e => setTelefono(i, e.target.value)}
                      placeholder="+598 99 123 456"
                    />
                    {telefonos.length > 1 && (
                      <button type="button" onClick={() => quitarTelefono(i)} className="text-zinc-600 hover:text-red-400 transition-colors px-1">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dirección */}
            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Dirección</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="País" required>
                  <select className="input-field" value={form.dirIdPais} onChange={e => set('dirIdPais', e.target.value)} required>
                    {paises.map(p => <option key={paisId(p)} value={paisId(p)}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Localidad" required>
                  <input className="input-field" value={form.localidad} onChange={e => set('localidad', e.target.value)} required placeholder="Montevideo" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="Calle" required>
                  <input className="input-field" value={form.calle} onChange={e => set('calle', e.target.value)} required placeholder="18 de Julio" />
                </Field>
                <Field label="Número" required>
                  <input className="input-field" value={form.numero} onChange={e => set('numero', e.target.value)} required placeholder="1234" />
                </Field>
                <Field label="Cód. Postal">
                  <input className="input-field" value={form.codigoPostal} onChange={e => set('codigoPostal', e.target.value)} placeholder="11200" required />
                </Field>
              </div>
            </div>

            {/* Documento */}
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Documento de identidad</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="País" required>
                  <select className="input-field" value={form.docIdPais} onChange={e => set('docIdPais', e.target.value)} required>
                    {paises.map(p => <option key={paisId(p)} value={paisId(p)}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select className="input-field" value={form.tipoDocumento} onChange={e => set('tipoDocumento', e.target.value)}>
                    <option value="CI">CI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="DNI">DNI</option>
                  </select>
                </Field>
                <Field label="Número" required>
                  <input className="input-field" value={form.docNumero} onChange={e => set('docNumero', e.target.value)} required placeholder="12345678" />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
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

            {!isValid && (
              <p className="text-xs text-zinc-600 text-center -mt-1">
                Completá todos los campos requeridos (<span className="text-red-400">*</span>) para continuar
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
