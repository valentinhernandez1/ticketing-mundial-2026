import { useState, useEffect } from 'react'
import { UserCheck, Plus } from 'lucide-react'
import api from '../../api/client'

export default function AdminAsignaciones() {
  const [eventos, setEventos] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [form, setForm] = useState({ idEvento: '', idFuncionario: '', idSector: '' })
  const [sectores, setSectores] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ text: '', ok: true })

  useEffect(() => {
    Promise.all([
      api.get('/consulta/eventos'),
      api.get('/consulta/funcionarios'),
    ]).then(([ev, fn]) => {
      setEventos(ev.data)
      setFuncionarios(fn.data)
    }).finally(() => setLoading(false))
  }, [])

  // cuando cambia el evento cargo los sectores del estadio (necesito id_sector, no id_evento_sector)
  useEffect(() => {
    if (!form.idEvento) return setSectores([])
    const ev = eventos.find(e => String(e.idEvento) === String(form.idEvento))
    if (!ev?.idEstadio) return setSectores([])
    api.get(`/consulta/estadios/${ev.idEstadio}/sectores`)
      .then(r => setSectores(r.data))
      .catch(() => setSectores([]))
  }, [form.idEvento, eventos])

  // cargo las asignaciones del evento seleccionado
  useEffect(() => {
    if (!form.idEvento) return setAsignaciones([])
    api.get(`/asignaciones/evento/${form.idEvento}`)
      .then(r => setAsignaciones(r.data))
      .catch(() => setAsignaciones([]))
  }, [form.idEvento])

  const asignar = async (e) => {
    e.preventDefault()
    try {
      await api.post('/asignaciones', {
        idFuncionario: Number(form.idFuncionario),
        idEvento: Number(form.idEvento),
        idSector: Number(form.idSector),
      })
      setMsg({ text: 'Funcionario asignado al sector', ok: true })
      setForm(f => ({ ...f, idFuncionario: '', idSector: '' }))
      const r = await api.get(`/asignaciones/evento/${form.idEvento}`)
      setAsignaciones(r.data)
    } catch (err) {
      setMsg({ text: err.response?.data?.detalle || 'Error al asignar', ok: false })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Asignación de funcionarios</h1>
      <p className="text-zinc-500 text-sm mb-6">Asigná funcionarios a los sectores de cada evento</p>

      {msg.text && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${msg.ok
          ? 'bg-green-900/30 border border-green-800/50 text-green-400'
          : 'bg-red-900/30 border border-red-800/50 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={16} /> Nueva asignación
          </h2>
          <form onSubmit={asignar} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Evento</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
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
              <label className="block text-xs font-medium text-zinc-400 mb-1">Sector</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                value={form.idSector}
                onChange={e => setForm(f => ({ ...f, idSector: e.target.value }))}
                required
                disabled={!form.idEvento}
              >
                <option value="">Seleccionar sector...</option>
                {sectores.map(s => (
                  <option key={s.id} value={s.id}>
                    Sector {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Funcionario</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
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

            <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-all text-sm">
              Asignar
            </button>
          </form>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck size={16} /> Asignaciones del evento
          </h2>
          {!form.idEvento ? (
            <p className="text-zinc-500 text-sm">Seleccioná un evento para ver sus asignaciones</p>
          ) : asignaciones.length === 0 ? (
            <p className="text-zinc-500 text-sm">No hay funcionarios asignados todavía</p>
          ) : (
            <div className="space-y-2">
              {asignaciones.map(a => (
                <div key={a.id_asignacion} className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {a.funcionario_nombre} {a.funcionario_apellido}
                    </div>
                    <div className="text-zinc-400 text-xs">Legajo: {a.numero_legajo}</div>
                  </div>
                  <span className="bg-blue-900/40 text-blue-400 border border-blue-800/50 text-xs px-2 py-0.5 rounded-full font-medium">
                    Sector {a.sector}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
