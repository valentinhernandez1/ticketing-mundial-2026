import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Users, UserCog, Plus, AlertCircle, CheckCircle, Shield, Briefcase } from 'lucide-react'

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    {children}
  </div>
)

const EMPTY_FORM = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  dirIdPais: '',
  localidad: '',
  calle: '',
  numero: '',
  codigoPostal: '',
  docIdPais: '',
  tipoDocumento: 'CI',
  docNumero: '',
}

export default function AdminUsuarios() {
  const [tab, setTab] = useState('admin')
  const [catalogos, setCatalogos] = useState({ paisesSede: [] })
  const [paises, setPaises] = useState([])
  const [admins, setAdmins] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [adminForm, setAdminForm] = useState({ ...EMPTY_FORM, idPaisSede: '' })
  const [funcForm, setFuncForm] = useState({ ...EMPTY_FORM, numeroLegajo: '' })
  const [enviandoAdmin, setEnviandoAdmin] = useState(false)
  const [enviandoFunc, setEnviandoFunc] = useState(false)

  const setAdmin = (k, v) => setAdminForm(f => ({ ...f, [k]: v }))
  const setFunc = (k, v) => setFuncForm(f => ({ ...f, [k]: v }))

  const cargarDatos = async () => {
    try {
      const [catRes, paisesRes, adminsRes, funcRes] = await Promise.all([
        api.get('/consulta/catalogos'),
        api.get('/paises'),
        api.get('/usuarios/admins'),
        api.get('/usuarios/funcionarios'),
      ])
      setCatalogos(catRes.data)
      setPaises(paisesRes.data)
      setAdmins(adminsRes.data)
      setFuncionarios(funcRes.data)
    } catch {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const buildPayload = (form) => ({
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
  })

  const crearAdmin = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setEnviandoAdmin(true)
    try {
      await api.post('/usuarios/admins', {
        ...buildPayload(adminForm),
        idPaisSede: parseInt(adminForm.idPaisSede),
      })
      setSuccess('Administrador creado exitosamente')
      setAdminForm({ ...EMPTY_FORM, idPaisSede: '' })
      const res = await api.get('/usuarios/admins')
      setAdmins(res.data)
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al crear administrador')
    } finally {
      setEnviandoAdmin(false)
    }
  }

  const crearFuncionario = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setEnviandoFunc(true)
    try {
      await api.post('/usuarios/funcionarios', {
        ...buildPayload(funcForm),
        numeroLegajo: funcForm.numeroLegajo,
      })
      setSuccess('Funcionario creado exitosamente')
      setFuncForm({ ...EMPTY_FORM, numeroLegajo: '' })
      const res = await api.get('/usuarios/funcionarios')
      setFuncionarios(res.data)
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al crear funcionario')
    } finally {
      setEnviandoFunc(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  const paisesSede = catalogos.paisesSede || []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white">Gestión de usuarios staff</h1>
        <p className="text-zinc-500 text-sm mt-1">Crear administradores y funcionarios de validación</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-lg px-4 py-3">
          <CheckCircle size={16} className="text-green-400 shrink-0" />
          <span className="text-green-400 text-sm">{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'admin'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Shield size={14} />
          Nuevo Administrador
        </button>
        <button
          onClick={() => setTab('func')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'func'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Briefcase size={14} />
          Nuevo Funcionario
        </button>
      </div>

      {/* Formulario Admin */}
      {tab === 'admin' && (
        <div className="card">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Shield size={16} className="text-green-400" />
            Nuevo Administrador de País
          </h2>
          <form onSubmit={crearAdmin} className="flex flex-col gap-4">
            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Datos personales</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <input className="input-field" value={adminForm.nombre} onChange={e => setAdmin('nombre', e.target.value)} required placeholder="Juan" />
                </Field>
                <Field label="Apellido">
                  <input className="input-field" value={adminForm.apellido} onChange={e => setAdmin('apellido', e.target.value)} required placeholder="Pérez" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Email">
                  <input type="email" className="input-field" value={adminForm.email} onChange={e => setAdmin('email', e.target.value)} required placeholder="admin@mundial.com" />
                </Field>
                <Field label="Contraseña">
                  <input type="password" className="input-field" value={adminForm.password} onChange={e => setAdmin('password', e.target.value)} required placeholder="••••••••" minLength={6} />
                </Field>
              </div>
            </div>

            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">País sede</p>
              <Field label="País sede asignado">
                <select className="input-field" value={adminForm.idPaisSede} onChange={e => setAdmin('idPaisSede', e.target.value)} required>
                  <option value="">Seleccioná un país sede...</option>
                  {paisesSede.map(p => (
                    <option key={p.id ?? p.idPais} value={p.id ?? p.idPais}>{p.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Dirección</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="País">
                  <select className="input-field" value={adminForm.dirIdPais} onChange={e => setAdmin('dirIdPais', e.target.value)} required>
                    <option value="">Seleccioná...</option>
                    {paises.map(p => <option key={p.id_pais} value={p.id_pais}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Localidad">
                  <input className="input-field" value={adminForm.localidad} onChange={e => setAdmin('localidad', e.target.value)} required placeholder="Ciudad de México" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="Calle">
                  <input className="input-field" value={adminForm.calle} onChange={e => setAdmin('calle', e.target.value)} required placeholder="Av. Principal" />
                </Field>
                <Field label="Número">
                  <input className="input-field" value={adminForm.numero} onChange={e => setAdmin('numero', e.target.value)} required placeholder="123" />
                </Field>
                <Field label="Cód. Postal">
                  <input className="input-field" value={adminForm.codigoPostal} onChange={e => setAdmin('codigoPostal', e.target.value)} placeholder="01000" />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Documento de identidad</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="País">
                  <select className="input-field" value={adminForm.docIdPais} onChange={e => setAdmin('docIdPais', e.target.value)} required>
                    <option value="">Seleccioná...</option>
                    {paises.map(p => <option key={p.id_pais} value={p.id_pais}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select className="input-field" value={adminForm.tipoDocumento} onChange={e => setAdmin('tipoDocumento', e.target.value)}>
                    <option value="CI">CI</option>
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </Field>
                <Field label="Número">
                  <input className="input-field" value={adminForm.docNumero} onChange={e => setAdmin('docNumero', e.target.value)} required placeholder="12345678" />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviandoAdmin}
              className="btn-primary flex items-center gap-2 self-start disabled:opacity-60"
            >
              {enviandoAdmin
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Crear administrador
            </button>
          </form>
        </div>
      )}

      {/* Formulario Funcionario */}
      {tab === 'func' && (
        <div className="card">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-400" />
            Nuevo Funcionario de Validación
          </h2>
          <form onSubmit={crearFuncionario} className="flex flex-col gap-4">
            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Datos personales</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <input className="input-field" value={funcForm.nombre} onChange={e => setFunc('nombre', e.target.value)} required placeholder="Ana" />
                </Field>
                <Field label="Apellido">
                  <input className="input-field" value={funcForm.apellido} onChange={e => setFunc('apellido', e.target.value)} required placeholder="García" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Email">
                  <input type="email" className="input-field" value={funcForm.email} onChange={e => setFunc('email', e.target.value)} required placeholder="funcionario@mundial.com" />
                </Field>
                <Field label="Contraseña">
                  <input type="password" className="input-field" value={funcForm.password} onChange={e => setFunc('password', e.target.value)} required placeholder="••••••••" minLength={6} />
                </Field>
              </div>
            </div>

            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Legajo</p>
              <Field label="Número de legajo">
                <input className="input-field" value={funcForm.numeroLegajo} onChange={e => setFunc('numeroLegajo', e.target.value)} required placeholder="LEG-001" />
              </Field>
            </div>

            <div className="pb-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Dirección</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="País">
                  <select className="input-field" value={funcForm.dirIdPais} onChange={e => setFunc('dirIdPais', e.target.value)} required>
                    <option value="">Seleccioná...</option>
                    {paises.map(p => <option key={p.id_pais} value={p.id_pais}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Localidad">
                  <input className="input-field" value={funcForm.localidad} onChange={e => setFunc('localidad', e.target.value)} required placeholder="Guadalajara" />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="Calle">
                  <input className="input-field" value={funcForm.calle} onChange={e => setFunc('calle', e.target.value)} required placeholder="Calle 5" />
                </Field>
                <Field label="Número">
                  <input className="input-field" value={funcForm.numero} onChange={e => setFunc('numero', e.target.value)} required placeholder="456" />
                </Field>
                <Field label="Cód. Postal">
                  <input className="input-field" value={funcForm.codigoPostal} onChange={e => setFunc('codigoPostal', e.target.value)} placeholder="44100" />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Documento de identidad</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="País">
                  <select className="input-field" value={funcForm.docIdPais} onChange={e => setFunc('docIdPais', e.target.value)} required>
                    <option value="">Seleccioná...</option>
                    {paises.map(p => <option key={p.id_pais} value={p.id_pais}>{p.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select className="input-field" value={funcForm.tipoDocumento} onChange={e => setFunc('tipoDocumento', e.target.value)}>
                    <option value="CI">CI</option>
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </Field>
                <Field label="Número">
                  <input className="input-field" value={funcForm.docNumero} onChange={e => setFunc('docNumero', e.target.value)} required placeholder="87654321" />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviandoFunc}
              className="btn-primary flex items-center gap-2 self-start disabled:opacity-60"
            >
              {enviandoFunc
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Crear funcionario
            </button>
          </form>
        </div>
      )}

      {/* Listas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lista admins */}
        <div>
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Shield size={13} className="text-green-400" />
            Administradores ({admins.length})
          </h2>
          {admins.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-600 text-sm">Sin administradores registrados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {admins.map((a, i) => (
                <div key={a.id ?? a.idUsuario ?? i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserCog size={14} className="text-zinc-500 shrink-0" />
                    <span className="font-semibold text-white text-sm">{a.nombre} {a.apellido}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 ml-5">{a.email}</p>
                  {(a.paisSede || a.nombrePaisSede) && (
                    <p className="text-xs text-green-500 mt-0.5 ml-5">Sede: {a.paisSede || a.nombrePaisSede}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista funcionarios */}
        <div>
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Briefcase size={13} className="text-blue-400" />
            Funcionarios ({funcionarios.length})
          </h2>
          {funcionarios.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-600 text-sm">Sin funcionarios registrados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {funcionarios.map((f, i) => (
                <div key={f.id ?? f.idUsuario ?? i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-zinc-500 shrink-0" />
                    <span className="font-semibold text-white text-sm">{f.nombre} {f.apellido}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 ml-5">{f.email}</p>
                  {(f.legajo || f.numeroLegajo) && (
                    <p className="text-xs text-blue-400 mt-0.5 ml-5">Legajo: {f.legajo || f.numeroLegajo}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
