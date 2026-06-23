import { useState, useEffect } from 'react'
import { Plus, Smartphone } from 'lucide-react'
import api from '../../api/client'
import Alert from '../../components/ui/Alert'
import PageHeader from '../../components/ui/PageHeader'

export default function AdminDispositivos() {
  const [dispositivos, setDispositivos] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [form, setForm] = useState({ identificadorFisico: '', idFuncionario: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargar = async () => {
    try {
      const [d, f] = await Promise.all([
        api.get('/dispositivos'),
        api.get('/consulta/funcionarios'),
      ])
      setDispositivos(d.data)
      setFuncionarios(f.data)
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const registrar = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/dispositivos', {
        identificadorFisico: form.identificadorFisico,
        idFuncionario: Number(form.idFuncionario),
      })
      setSuccess('Dispositivo registrado correctamente')
      setForm({ identificadorFisico: '', idFuncionario: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al registrar')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Smartphone}
        title="Dispositivos autorizados"
        subtitle="Dispositivos de escaneo vinculados a funcionarios"
      />

      <Alert type="error"   message={error}   />
      <Alert type="success" message={success} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Registrar */}
        <div className="card">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={15} className="text-emerald-400" />
            Registrar dispositivo
          </h2>
          <form onSubmit={registrar} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                ID físico del dispositivo
              </label>
              <input
                className="input-field"
                placeholder="ej: SCANNER-001"
                value={form.identificadorFisico}
                onChange={e => setForm(f => ({ ...f, identificadorFisico: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Funcionario asignado
              </label>
              <select
                className="input-field"
                value={form.idFuncionario}
                onChange={e => setForm(f => ({ ...f, idFuncionario: e.target.value }))}
                required
              >
                <option value="">Seleccionar funcionario...</option>
                {funcionarios.map(f => (
                  <option key={f.id_usuario ?? f.idUsuario} value={f.id_usuario ?? f.idUsuario}>
                    {f.nombre} {f.apellido} — Legajo {f.numero_legajo ?? f.numeroLegajo}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary self-start">
              <Plus size={14} />
              Registrar
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="card">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone size={15} className="text-zinc-400" />
            Dispositivos registrados
          </h2>
          {loading ? (
            <p className="text-zinc-600 text-sm">Cargando...</p>
          ) : dispositivos.length === 0 ? (
            <p className="text-zinc-600 text-sm">No hay dispositivos registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dispositivos.map(d => (
                <div
                  key={d.id_dispositivo ?? d.idDispositivo}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {d.identificador_fisico ?? d.identificadorFisico}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {d.funcionario_nombre ?? d.funcionarioNombre} {d.funcionario_apellido ?? d.funcionarioApellido}
                    </p>
                  </div>
                  <span className={d.estado === 'ACTIVO' ? 'badge-green' : 'badge-zinc'}>
                    {d.estado}
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
