import { useState, useEffect } from 'react'
import { Plus, Smartphone } from 'lucide-react'
import { getDispositivos, registrarDispositivo, getFuncionarios } from '../../api'

export default function AdminDispositivos() {
  const [dispositivos, setDispositivos] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [form, setForm] = useState({ identificadorFisico: '', idFuncionario: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const cargar = async () => {
    try {
      const [d, f] = await Promise.all([getDispositivos(), getFuncionarios()])
      setDispositivos(d.data)
      setFuncionarios(f.data)
    } catch {
      setError('Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const registrar = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      await registrarDispositivo({
        identificadorFisico: form.identificadorFisico,
        idFuncionario: Number(form.idFuncionario)
      })
      setSuccess('Dispositivo registrado')
      setForm({ identificadorFisico: '', idFuncionario: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al registrar')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-1">Dispositivos autorizados</h1>
      <p className="text-zinc-400 text-sm mb-6">Dispositivos de escaneo vinculados a funcionarios</p>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-800 text-green-400 rounded-lg p-3 mb-4 text-sm">{success}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Plus size={16} /> Registrar dispositivo
          </h2>
          <form onSubmit={registrar} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">ID del dispositivo</label>
              <input
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                placeholder="ej: SCANNER-001"
                value={form.identificadorFisico}
                onChange={e => setForm(f => ({ ...f, identificadorFisico: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Funcionario asignado</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
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
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-all text-sm"
            >
              Registrar
            </button>
          </form>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone size={16} /> Dispositivos registrados
          </h2>
          {loading ? (
            <div className="text-zinc-500 text-sm">Cargando...</div>
          ) : dispositivos.length === 0 ? (
            <div className="text-zinc-500 text-sm">No hay dispositivos registrados</div>
          ) : (
            <div className="space-y-2">
              {dispositivos.map(d => (
                <div
                  key={d.id_dispositivo ?? d.idDispositivo}
                  className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="text-white text-sm font-medium">
                      {d.identificador_fisico ?? d.identificadorFisico}
                    </div>
                    <div className="text-zinc-400 text-xs">
                      {d.funcionario_nombre ?? d.funcionarioNombre} {d.funcionario_apellido ?? d.funcionarioApellido}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.estado === 'ACTIVO'
                      ? 'bg-green-900/40 text-green-400 border border-green-800/50'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
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
