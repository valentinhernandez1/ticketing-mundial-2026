import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Calendar, Plus, XCircle, AlertCircle, CheckCircle, Layers } from 'lucide-react'

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    {children}
  </div>
)

export default function AdminEventos() {
  const [catalogos, setCatalogos] = useState({ estadios: [], selecciones: [] })
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [eventoForm, setEventoForm] = useState({
    idEstadio: '', idLocal: '', idVisitante: '', fechaHora: '', duracion: '120'
  })
  const [sectorForm, setSectorForm] = useState({
    idEvento: '', idSector: '', cupo: '', precio: ''
  })
  const [sectoresEstadio, setSectoresEstadio] = useState([])
  const [creandoEvento, setCreandoEvento] = useState(false)
  const [creandoSector, setCreandoSector] = useState(false)
  const [cancelando, setCancelando] = useState(null)

  const cargar = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        api.get('/consulta/catalogos'),
        api.get('/consulta/eventos'),
      ])
      setCatalogos(cRes.data)
      setEventos(eRes.data)
    } catch {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // cuando cambia el evento cargo los sectores del estadio correspondiente
  useEffect(() => {
    if (!sectorForm.idEvento) { setSectoresEstadio([]); return }
    const ev = eventos.find(e => String(e.idEvento) === String(sectorForm.idEvento))
    if (!ev) return
    api.get(`/consulta/estadios/${ev.idEstadio}/sectores`)
      .then(r => setSectoresEstadio(r.data))
      .catch(() => setSectoresEstadio([]))
  }, [sectorForm.idEvento, eventos])

  const crearEvento = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setCreandoEvento(true)
    try {
      await api.post('/eventos', {
        idEstadio: parseInt(eventoForm.idEstadio),
        idSeleccionLocal: parseInt(eventoForm.idLocal),
        idSeleccionVisitante: parseInt(eventoForm.idVisitante),
        fechaHoraInicio: eventoForm.fechaHora ? new Date(eventoForm.fechaHora).toISOString() : null,
        duracionMinutos: parseInt(eventoForm.duracion),
      })
      setSuccess('Evento creado exitosamente')
      setEventoForm({ idEstadio: '', idLocal: '', idVisitante: '', fechaHora: '', duracion: '120' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al crear evento')
    } finally {
      setCreandoEvento(false)
    }
  }

  const habilitarSector = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setCreandoSector(true)
    try {
      await api.post(`/eventos/${sectorForm.idEvento}/sectores`, {
        idSector: parseInt(sectorForm.idSector),
        cupo: parseInt(sectorForm.cupo),
        precio: parseFloat(sectorForm.precio),
      })
      setSuccess('Sector habilitado para el evento')
      setSectorForm({ idEvento: '', idSector: '', cupo: '', precio: '' })
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al habilitar sector')
    } finally {
      setCreandoSector(false)
    }
  }

  const cancelar = async (id) => {
    if (!confirm('¿Estás seguro de cancelar este evento?')) return
    setCancelando(id); setError(''); setSuccess('')
    try {
      await api.post(`/eventos/${id}/cancelar`)
      setSuccess('Evento cancelado')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al cancelar')
    } finally {
      setCancelando(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white">Gestión de Eventos</h1>
        <p className="text-zinc-500 text-sm mt-1">Crear partidos y habilitar sectores</p>
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
        {/* Crear evento */}
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-green-400" />
            Crear evento
          </h2>
          <form onSubmit={crearEvento} className="flex flex-col gap-3">
            <Field label="Estadio">
              <select className="input-field" value={eventoForm.idEstadio}
                onChange={e => setEventoForm(f => ({ ...f, idEstadio: e.target.value }))} required>
                <option value="">Seleccioná estadio...</option>
                {(catalogos.estadios || []).map(es => (
                  <option key={es.id ?? es.idEstadio} value={es.id ?? es.idEstadio}>{es.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Selección local">
              <select className="input-field" value={eventoForm.idLocal}
                onChange={e => setEventoForm(f => ({ ...f, idLocal: e.target.value }))} required>
                <option value="">Seleccioná equipo local...</option>
                {(catalogos.selecciones || []).map(s => (
                  <option key={s.id ?? s.idSeleccion} value={s.id ?? s.idSeleccion}>{s.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Selección visitante">
              <select className="input-field" value={eventoForm.idVisitante}
                onChange={e => setEventoForm(f => ({ ...f, idVisitante: e.target.value }))} required>
                <option value="">Seleccioná equipo visitante...</option>
                {(catalogos.selecciones || []).map(s => (
                  <option key={s.id ?? s.idSeleccion} value={s.id ?? s.idSeleccion}>{s.nombre}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha y hora">
                <input type="datetime-local" className="input-field" value={eventoForm.fechaHora}
                  onChange={e => setEventoForm(f => ({ ...f, fechaHora: e.target.value }))} required />
              </Field>
              <Field label="Duración (min)">
                <input type="number" className="input-field" value={eventoForm.duracion}
                  onChange={e => setEventoForm(f => ({ ...f, duracion: e.target.value }))} min="1" />
              </Field>
            </div>
            <button type="submit" disabled={creandoEvento}
              className="btn-primary self-start flex items-center gap-2 disabled:opacity-60">
              {creandoEvento
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Crear evento
            </button>
          </form>
        </div>

        {/* Habilitar sector */}
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            Habilitar sector para evento
          </h2>
          <form onSubmit={habilitarSector} className="flex flex-col gap-3">
            <Field label="Evento">
              <select className="input-field" value={sectorForm.idEvento}
                onChange={e => setSectorForm(f => ({ ...f, idEvento: e.target.value }))} required>
                <option value="">Seleccioná evento...</option>
                {eventos.filter(ev => ev.estado !== 'CANCELADO').map(ev => (
                  <option key={ev.idEvento} value={ev.idEvento}>
                    {ev.seleccionLocal} vs {ev.seleccionVisitante} — {ev.estadio}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sector">
                <select className="input-field" value={sectorForm.idSector}
                  onChange={e => setSectorForm(f => ({ ...f, idSector: e.target.value }))}
                  required>
                  <option value="">Seleccioná un sector...</option>
                  {sectoresEstadio.map(s => (
                    <option key={s.id ?? s.id_sector} value={s.id ?? s.id_sector}>
                      Sector {s.nombre ?? s.nombre_sector}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cupo">
                <input type="number" className="input-field" value={sectorForm.cupo}
                  onChange={e => setSectorForm(f => ({ ...f, cupo: e.target.value }))} placeholder="1000" min="1" required />
              </Field>
            </div>
            <Field label="Precio (USD)">
              <input type="number" step="0.01" className="input-field" value={sectorForm.precio}
                onChange={e => setSectorForm(f => ({ ...f, precio: e.target.value }))} placeholder="200.00" min="0" required />
            </Field>
            <button type="submit" disabled={creandoSector}
              className="btn-primary self-start flex items-center gap-2 disabled:opacity-60">
              {creandoSector
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Plus size={14} />}
              Habilitar sector
            </button>
          </form>
        </div>
      </div>

      {/* Lista de eventos */}
      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Eventos registrados ({eventos.length})</h2>
        <div className="flex flex-col gap-2">
          {eventos.map(ev => (
            <div key={ev.idEvento} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">
                    {ev.seleccionLocal} vs {ev.seleccionVisitante}
                  </span>
                  {ev.estado === 'CANCELADO'
                    ? <span className="badge-red">CANCELADO</span>
                    : <span className="badge-green">ACTIVO</span>}
                </div>
                <p className="text-xs text-zinc-500">
                  🏟️ {ev.estadio} · {ev.fechaHora ? new Date(ev.fechaHora).toLocaleString('es-UY') : '—'}
                </p>
              </div>
              {ev.estado !== 'CANCELADO' && (
                <button
                  onClick={() => cancelar(ev.idEvento)}
                  disabled={cancelando === ev.idEvento}
                  className="btn-danger text-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {cancelando === ev.idEvento
                    ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <XCircle size={12} />}
                  Cancelar
                </button>
              )}
            </div>
          ))}
          {eventos.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-zinc-500 text-sm">No hay eventos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
