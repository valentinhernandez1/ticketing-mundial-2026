import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Building2, Plus, AlertCircle, CheckCircle, Layers } from 'lucide-react'

export default function AdminEstadios() {
  const [catalogos, setCatalogos] = useState({ paises: [], estadios: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [estadioForm, setEstadioForm] = useState({
    nombre: '', idPais: '', ciudad: '', direccion: ''
  })
  const [sectorForm, setSectorForm] = useState({
    idEstadio: '', nombreSector: 'A', capacidad: '', precio: ''
  })
  const [creandoEstadio, setCreandoEstadio] = useState(false)
  const [creandoSector, setCreandoSector] = useState(false)

  useEffect(() => {
    api.get('/consulta/catalogos')
      .then(r => setCatalogos(r.data))
      .catch(() => setError('No se pudieron cargar los catálogos'))
      .finally(() => setLoading(false))
  }, [])

  const crearEstadio = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setCreandoEstadio(true)
    try {
      await api.post('/estadios', {
        nombre: estadioForm.nombre,
        idPais: parseInt(estadioForm.idPais),
        ciudad: estadioForm.ciudad,
        direccion: estadioForm.direccion,
      })
      setSuccess('Estadio creado exitosamente')
      setEstadioForm({ nombre: '', idPais: '', ciudad: '', direccion: '' })
      const r = await api.get('/consulta/catalogos')
      setCatalogos(r.data)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Error al crear estadio')
    } finally {
      setCreandoEstadio(false)
    }
  }

  const crearSector = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setCreandoSector(true)
    try {
      await api.post(`/estadios/${sectorForm.idEstadio}/sectores`, {
        nombreSector: sectorForm.nombreSector,
        capacidad: parseInt(sectorForm.capacidad),
        precio: parseFloat(sectorForm.precio),
      })
      setSuccess('Sector agregado exitosamente')
      setSectorForm({ idEstadio: '', nombreSector: 'A', capacidad: '', precio: '' })
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Error al crear sector')
    } finally {
      setCreandoSector(false)
    }
  }

  const Field = ({ label, children }) => (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white">Gestión de Estadios</h1>
        <p className="text-zinc-500 text-sm mt-1">Crear estadios y configurar sus sectores</p>
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Crear estadio */}
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-green-400" />
            Crear estadio
          </h2>
          <form onSubmit={crearEstadio} className="flex flex-col gap-3">
            <Field label="Nombre del estadio">
              <input
                className="input-field"
                value={estadioForm.nombre}
                onChange={e => setEstadioForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Estadio Azteca"
                required
              />
            </Field>
            <Field label="País sede">
              <select
                className="input-field"
                value={estadioForm.idPais}
                onChange={e => setEstadioForm(f => ({ ...f, idPais: e.target.value }))}
                required
              >
                <option value="">Seleccioná un país...</option>
                {(catalogos.paises || []).map(p => (
                  <option key={p.id ?? p.idPais} value={p.id ?? p.idPais}>{p.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Ciudad">
              <input
                className="input-field"
                value={estadioForm.ciudad}
                onChange={e => setEstadioForm(f => ({ ...f, ciudad: e.target.value }))}
                placeholder="Ciudad de México"
                required
              />
            </Field>
            <Field label="Dirección">
              <input
                className="input-field"
                value={estadioForm.direccion}
                onChange={e => setEstadioForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. Insurgentes Sur 3695"
                required
              />
            </Field>
            <button
              type="submit"
              disabled={creandoEstadio}
              className="btn-primary flex items-center gap-2 self-start disabled:opacity-60"
            >
              {creandoEstadio
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Crear estadio
            </button>
          </form>
        </div>

        {/* Agregar sector */}
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            Agregar sector a estadio
          </h2>
          <form onSubmit={crearSector} className="flex flex-col gap-3">
            <Field label="Estadio">
              <select
                className="input-field"
                value={sectorForm.idEstadio}
                onChange={e => setSectorForm(f => ({ ...f, idEstadio: e.target.value }))}
                required
              >
                <option value="">Seleccioná un estadio...</option>
                {(catalogos.estadios || []).map(es => (
                  <option key={es.id ?? es.idEstadio} value={es.id ?? es.idEstadio}>{es.nombre}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sector">
                <select
                  className="input-field"
                  value={sectorForm.nombreSector}
                  onChange={e => setSectorForm(f => ({ ...f, nombreSector: e.target.value }))}
                >
                  <option value="A">A — VIP</option>
                  <option value="B">B — Platea</option>
                  <option value="C">C — Popular</option>
                  <option value="D">D — General</option>
                </select>
              </Field>
              <Field label="Capacidad">
                <input
                  type="number"
                  className="input-field"
                  value={sectorForm.capacidad}
                  onChange={e => setSectorForm(f => ({ ...f, capacidad: e.target.value }))}
                  placeholder="5000"
                  min="1"
                  required
                />
              </Field>
            </div>
            <Field label="Precio base (USD)">
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={sectorForm.precio}
                onChange={e => setSectorForm(f => ({ ...f, precio: e.target.value }))}
                placeholder="150.00"
                min="0"
                required
              />
            </Field>
            <button
              type="submit"
              disabled={creandoSector}
              className="btn-primary flex items-center gap-2 self-start disabled:opacity-60"
            >
              {creandoSector
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Agregar sector
            </button>
          </form>
        </div>
      </div>

      {/* Lista estadios */}
      {(catalogos.estadios || []).length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Estadios registrados</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {(catalogos.estadios || []).map(es => (
              <div key={es.id ?? es.idEstadio} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-zinc-500" />
                  <span className="font-semibold text-white text-sm">{es.nombre}</span>
                </div>
                {es.ciudad && <p className="text-xs text-zinc-500 mt-1 ml-5">{es.ciudad}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
