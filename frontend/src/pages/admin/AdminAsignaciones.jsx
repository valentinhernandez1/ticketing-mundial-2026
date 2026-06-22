import { useState, useEffect } from 'react'
import { UserCheck, Plus, Trash2 } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/ui/Alert'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminAsignaciones() {
  const [eventos, setEventos] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [form, setForm] = useState({ idEvento: '', idFuncionario: '', idSector: '' })
  const [sectores, setSectores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [eliminando, setEliminando] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/consulta/eventos'),
      api.get('/consulta/funcionarios'),
    ]).then(([ev, fn]) => {
      setEventos(ev.data)
      setFuncionarios(fn.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.idEvento) return setSectores([])
    const ev = eventos.find(e => String(e.idEvento) === String(form.idEvento))
    if (!ev?.idEstadio) return setSectores([])
    api.get(`/consulta/estadios/${ev.idEstadio}/sectores`)
      .then(r => setSectores(r.data))
      .catch(() => setSectores([]))
  }, [form.idEvento, eventos])

  const cargarAsignaciones = async (idEvento) => {
    if (!idEvento) return setAsignaciones([])
    const r = await api.get(`/asignaciones/evento/${idEvento}`)
    setAsignaciones(r.data)
  }

  useEffect(() => {
    cargarAsignaciones(form.idEvento).catch(() => setAsignaciones([]))
  }, [form.idEvento])

  const asignar = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/asignaciones', {
        idFuncionario: Number(form.idFuncionario),
        idEvento: Number(form.idEvento),
        idSector: Number(form.idSector),
      })
      setSuccess('Funcionario asignado al sector')
      setForm(f => ({ ...f, idFuncionario: '', idSector: '' }))
      await cargarAsignaciones(form.idEvento)
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al asignar')
    }
  }

  const eliminar = async (idAsignacion, nombre, sector) => {
    if (!window.confirm(`¿Eliminar la asignación de ${nombre} en el Sector ${sector}?`)) return
    setError('')
    setSuccess('')
    setEliminando(idAsignacion)
    try {
      await api.delete(`/asignaciones/${idAsignacion}`)
      setSuccess('Asignación eliminada')
      await cargarAsignaciones(form.idEvento)
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al eliminar la asignación')
    } finally {
      setEliminando(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={UserCheck}
        title="Asignación de funcionarios"
        subtitle="Asigná funcionarios a los sectores de cada evento"
      />

      <Alert type="error"   message={error}   />
      <Alert type="success" message={success} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="card">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={15} className="text-emerald-400" />
            Nueva asignación
          </h2>
          <form onSubmit={asignar} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Evento</label>
              <select
                className="input-field"
                value={form.idEvento}
                onChange={e => setForm(f => ({ ...f, idEvento: e.target.value, idSector: '' }))}
                required
              >
                <option value="">Seleccionar evento...</option>
                {eventos.map(ev => (
                  <option key={ev.idEvento} value={ev.idEvento}>
                    {ev.local} vs {ev.visitante} — {ev.fecha}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Sector</label>
              <select
                className="input-field"
                value={form.idSector}
                onChange={e => setForm(f => ({ ...f, idSector: e.target.value }))}
                required
                disabled={!form.idEvento}
              >
                <option value="">Seleccionar sector...</option>
                {sectores.map(s => (
                  <option key={s.id} value={s.id}>Sector {s.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Funcionario</label>
              <select
                className="input-field"
                value={form.idFuncionario}
                onChange={e => setForm(f => ({ ...f, idFuncionario: e.target.value }))}
                required
              >
                <option value="">Seleccionar funcionario...</option>
                {funcionarios.map(f => (
                  <option key={f.id_usuario} value={f.id_usuario}>
                    {f.nombre} {f.apellido} — Legajo {f.numero_legajo}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary self-start">
              <Plus size={14} />
              Asignar
            </button>
          </form>
        </div>

        {/* Asignaciones del evento */}
        <div className="card">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck size={15} className="text-zinc-400" />
            Asignaciones del evento
          </h2>
          {!form.idEvento ? (
            <p className="text-zinc-600 text-sm">Seleccioná un evento para ver sus asignaciones</p>
          ) : asignaciones.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sin funcionarios asignados todavía</p>
          ) : (
            <div className="flex flex-col gap-2">
              {asignaciones.map(a => (
                <div
                  key={a.id_asignacion}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {a.funcionario_nombre} {a.funcionario_apellido}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">Legajo: {a.numero_legajo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge-blue">Sector {a.sector}</span>
                    <button
                      onClick={() => eliminar(
                        a.id_asignacion,
                        `${a.funcionario_nombre} ${a.funcionario_apellido}`,
                        a.sector
                      )}
                      disabled={eliminando === a.id_asignacion}
                      className="btn-danger text-xs px-2 py-1.5 disabled:opacity-50"
                      title="Eliminar asignación"
                    >
                      {eliminando === a.id_asignacion
                        ? <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
