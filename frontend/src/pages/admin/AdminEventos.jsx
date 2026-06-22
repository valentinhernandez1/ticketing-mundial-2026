import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Calendar, Plus, XCircle, Layers, X } from 'lucide-react'
import Alert from '../../components/ui/Alert'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-300 ml-3 shrink-0">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-zinc-400 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Volver</button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
          >
            Sí, cancelar evento
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [confirmCancelar, setConfirmCancelar] = useState(null) // { id, nombre }

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
    setConfirmCancelar(null)
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

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Calendar}
        title="Gestión de Eventos"
        subtitle="Crear partidos y habilitar sectores"
      />

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

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
                    {ev.local} vs {ev.visitante} — {ev.estadio}
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
                    {ev.local} vs {ev.visitante}
                  </span>
                  {ev.estado === 'CANCELADO'
                    ? <span className="badge-red">CANCELADO</span>
                    : ev.estado === 'FINALIZADO'
                    ? <span className="badge-zinc">FINALIZADO</span>
                    : ev.estado === 'EN_CURSO'
                    ? <span className="badge-blue">EN CURSO</span>
                    : <span className="badge-green">PROGRAMADO</span>}
                </div>
                <p className="text-xs text-zinc-500">
                  🏟️ {ev.estadio} · {ev.fecha ? new Date(ev.fecha).toLocaleString('es-UY') : '—'}
                </p>
              </div>
              {ev.estado !== 'CANCELADO' && (
                <button
                  onClick={() => setConfirmCancelar({ id: ev.idEvento, nombre: `${ev.local} vs ${ev.visitante}` })}
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

      {confirmCancelar && (
        <ConfirmDialog
          title="Cancelar evento"
          message={`¿Estás seguro de cancelar "${confirmCancelar.nombre}"? Esta acción no se puede deshacer y las entradas vendidas quedarán inactivas.`}
          onConfirm={() => cancelar(confirmCancelar.id)}
          onCancel={() => setConfirmCancelar(null)}
        />
      )}
    </div>
  )
}
