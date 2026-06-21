import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { ArrowRight, ArrowLeft, Send, CheckCircle, AlertCircle, ArrowLeftRight } from 'lucide-react'

const ESTADO_BADGE = {
  PENDIENTE: <span className="badge-yellow">PENDIENTE</span>,
  ACEPTADA: <span className="badge-green">ACEPTADA</span>,
  RECHAZADA: <span className="badge-red">RECHAZADA</span>,
  CANCELADA: <span className="badge-zinc">CANCELADA</span>,
}

export default function Transferencias() {
  const { user } = useAuth()
  const [transferencias, setTransferencias] = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({ idEntrada: '', emailDestino: '' })
  const [enviando, setEnviando] = useState(false)
  const [aceptando, setAceptando] = useState(null)
  const [rechazando, setRechazando] = useState(null)

  const cargar = async () => {
    try {
      const [tRes, eRes] = await Promise.all([
        api.get(`/usuarios/${user.id}/transferencias`),
        api.get(`/usuarios/${user.id}/entradas`),
      ])
      setTransferencias(tRes.data)
      setEntradas(eRes.data.filter(e => e.estado === 'EMITIDA' || e.estado === 'TRANSFERIDA'))
    } catch {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [user.id])

  const enviar = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setEnviando(true)
    try {
      await api.post('/transferencias', {
        idEntrada: parseInt(form.idEntrada),
        emailDestino: form.emailDestino.trim(),
      })
      setSuccess('Transferencia enviada con éxito')
      setForm({ idEntrada: '', emailDestino: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al transferir')
    } finally {
      setEnviando(false)
    }
  }

  const aceptar = async (id) => {
    setAceptando(id); setError(''); setSuccess('')
    try {
      await api.post(`/transferencias/${id}/aceptar`)
      setSuccess('Transferencia aceptada')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al aceptar')
    } finally {
      setAceptando(null)
    }
  }

  const rechazar = async (id) => {
    setRechazando(id); setError(''); setSuccess('')
    try {
      await api.post(`/transferencias/${id}/rechazar`)
      setSuccess('Transferencia rechazada')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al rechazar')
    } finally {
      setRechazando(null)
    }
  }

  // el backend retorna idDestino (camelCase) — fallback a snake_case por si acaso
  const esDestinatario = (t) => (t.idDestino ?? t.id_usuario_destino) === user.id
  const recibidas = transferencias.filter(t => esDestinatario(t) && t.estado === 'PENDIENTE')
  const historial = transferencias.filter(t => !(esDestinatario(t) && t.estado === 'PENDIENTE'))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-white">Transferencias</h1>
        <p className="text-zinc-500 text-sm mt-1">Enviá o recibí entradas de otros usuarios</p>
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

      {/* Formulario transferir */}
      <div className="card">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Send size={16} className="text-green-400" />
          Transferir una entrada
        </h2>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Entrada a transferir</label>
            <select
              className="input-field"
              value={form.idEntrada}
              onChange={e => setForm(f => ({ ...f, idEntrada: e.target.value }))}
              required
            >
              <option value="">Seleccioná una entrada...</option>
              {entradas.map(en => (
                <option key={en.idEntrada} value={en.idEntrada}>
                  #{en.idEntrada} — {en.seleccionLocal || 'Local'} vs {en.seleccionVisitante || 'Visitante'} · Sector {en.nombreSector || en.sector}
                </option>
              ))}
            </select>
            {entradas.length === 0 && (
              <p className="text-xs text-zinc-600 mt-1">No tenés entradas disponibles para transferir</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Email del destinatario</label>
            <input
              type="email"
              className="input-field"
              value={form.emailDestino}
              onChange={e => setForm(f => ({ ...f, emailDestino: e.target.value }))}
              placeholder="ejemplo@ucu.edu.uy"
              required
            />
          </div>
          <button
            type="submit"
            disabled={enviando || entradas.length === 0}
            className="btn-primary self-start flex items-center gap-2 disabled:opacity-60"
          >
            {enviando ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
            Enviar transferencia
          </button>
        </form>
      </div>

      {/* Pendientes recibidas */}
      {recibidas.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <ArrowLeft size={16} className="text-green-400" />
            Transferencias recibidas pendientes
            <span className="badge-yellow ml-1">{recibidas.length}</span>
          </h2>
          <div className="flex flex-col gap-2">
            {recibidas.map(t => (
              <div key={t.idTransferencia} className="bg-zinc-900 border border-yellow-800/30 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Entrada #{t.idEntrada} de usuario #{t.idOrigen ?? t.id_usuario_origen}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t.fecha ? new Date(t.fecha).toLocaleString('es-UY') : '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => aceptar(t.idTransferencia)}
                    disabled={aceptando === t.idTransferencia || rechazando === t.idTransferencia}
                    className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                  >
                    {aceptando === t.idTransferencia
                      ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <CheckCircle size={12} />}
                    Aceptar
                  </button>
                  <button
                    onClick={() => rechazar(t.idTransferencia)}
                    disabled={rechazando === t.idTransferencia || aceptando === t.idTransferencia}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                  >
                    {rechazando === t.idTransferencia
                      ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : null}
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <ArrowLeftRight size={16} className="text-zinc-400" />
          Historial
        </h2>
        {historial.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-zinc-500 text-sm">No hay transferencias en el historial</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">ID</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Entrada</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Dirección</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((t, i) => {
                  const esEnviada = (t.idOrigen ?? t.id_usuario_origen) === user.id
                  return (
                    <tr key={t.idTransferencia ?? i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-zinc-500 text-xs">#{t.idTransferencia}</td>
                      <td className="px-4 py-3 text-zinc-300">#{t.idEntrada}</td>
                      <td className="px-4 py-3">
                        {esEnviada ? (
                          <span className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                            <ArrowRight size={12} /> Enviada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-400 text-xs font-medium">
                            <ArrowLeft size={12} /> Recibida
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ESTADO_BADGE[t.estado] || <span className="badge-zinc">{t.estado}</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {t.fecha ? new Date(t.fecha).toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
