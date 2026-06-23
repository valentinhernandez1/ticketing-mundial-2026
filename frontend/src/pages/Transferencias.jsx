import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { ArrowRight, ArrowLeft, Send, CheckCircle, ArrowLeftRight, X } from 'lucide-react'
import Alert from '../components/ui/Alert'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const ESTADO_BADGE = {
  PENDIENTE: <span className="badge-yellow">PENDIENTE</span>,
  ACEPTADA: <span className="badge-green">ACEPTADA</span>,
  RECHAZADA: <span className="badge-red">RECHAZADA</span>,
  CANCELADA: <span className="badge-zinc">CANCELADA</span>,
}

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) {
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
          <button onClick={onCancel} className="btn-secondary text-sm">Cancelar</button>
          <button
            onClick={onConfirm}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-all ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Transferencias() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transferencias, setTransferencias] = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({ idEntrada: '', emailDestino: '' })
  const [enviando, setEnviando] = useState(false)
  const [aceptando, setAceptando] = useState(null)
  const [rechazando, setRechazando] = useState(null)

  // dialogs
  const [confirmEnviar, setConfirmEnviar] = useState(false)
  const [confirmRechazar, setConfirmRechazar] = useState(null) // id de transferencia

  const cargar = async () => {
    try {
      const [tRes, eRes] = await Promise.all([
        api.get(`/usuarios/${user.id}/transferencias`),
        api.get(`/usuarios/${user.id}/entradas`),
      ])
      setTransferencias(tRes.data)
      setEntradas(eRes.data.filter(e => e.estado === 'EMITIDA' && (e.estadoVenta || 'PAGA') === 'PAGA'))
    } catch {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [user.id])

  const enviarTransferencia = async () => {
    setConfirmEnviar(false)
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
      setTimeout(() => navigate('/transferencias'), 1200)
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al transferir')
    } finally {
      setEnviando(false)
    }
  }

  const enviar = (e) => {
    e.preventDefault()
    if (!form.idEntrada || !form.emailDestino.trim()) return
    setConfirmEnviar(true)
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

  const rechazarTransferencia = async (id) => {
    setConfirmRechazar(null)
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

  const esDestinatario = (t) => (t.idDestino ?? t.id_usuario_destino) === user.id
  const recibidas = transferencias.filter(t => esDestinatario(t) && t.estado === 'PENDIENTE')
  const historial = transferencias.filter(t => !(esDestinatario(t) && t.estado === 'PENDIENTE'))

  // info de la entrada seleccionada en el formulario
  const entradaSeleccionada = entradas.find(e => String(e.idEntrada) === String(form.idEntrada))

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ArrowLeftRight}
        title="Transferencias"
        subtitle="Enviá o recibí entradas de otros usuarios"
      />

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* Formulario transferir */}
      <div className="card">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Send size={16} className="text-green-400" />
          Transferir una entrada
        </h2>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Entrada a transferir <span className="text-red-400">*</span>
            </label>
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
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Email del destinatario <span className="text-red-400">*</span>
            </label>
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
            disabled={enviando || entradas.length === 0 || !form.idEntrada || !form.emailDestino.trim()}
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
                    Entrada #{t.idEntrada}
                    {(t.seleccionLocal || t.local) && (
                      <span className="text-zinc-400 font-normal"> — {t.seleccionLocal || t.local} vs {t.seleccionVisitante || t.visitante}</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    De: <span className="text-zinc-300">{t.emailOrigen || `usuario #${t.idOrigen ?? t.id_usuario_origen}`}</span>
                    {t.fecha && <> · {new Date(t.fecha).toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</>}
                  </p>
                  {(t.nombreSector || t.sector) && (
                    <p className="text-xs text-zinc-600 mt-0.5">Sector {t.nombreSector || t.sector}</p>
                  )}
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
                    onClick={() => setConfirmRechazar(t.idTransferencia)}
                    disabled={rechazando === t.idTransferencia || aceptando === t.idTransferencia}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                  >
                    {rechazando === t.idTransferencia
                      ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <X size={12} />}
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
            <ArrowLeftRight size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm font-medium">No hay transferencias en el historial</p>
            <p className="text-zinc-600 text-xs mt-1">Las transferencias enviadas y recibidas aparecerán aquí</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Entrada</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Movimiento</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((t, i) => {
                  const esEnviada = (t.idOrigen ?? t.id_usuario_origen) === user.id
                  const contraparte = esEnviada
                    ? (t.emailDestino || `usuario #${t.idDestino ?? t.id_usuario_destino}`)
                    : (t.emailOrigen  || `usuario #${t.idOrigen  ?? t.id_usuario_origen}`)
                  return (
                    <tr key={t.idTransferencia ?? i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-300 font-medium">#{t.idEntrada}</td>
                      <td className="px-4 py-3">
                        {esEnviada ? (
                          <div>
                            <span className="flex items-center gap-1 text-orange-400 text-xs font-medium mb-0.5">
                              <ArrowRight size={11} /> Enviada a
                            </span>
                            <span className="text-zinc-400 text-xs">{contraparte}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="flex items-center gap-1 text-blue-400 text-xs font-medium mb-0.5">
                              <ArrowLeft size={11} /> Recibida de
                            </span>
                            <span className="text-zinc-400 text-xs">{contraparte}</span>
                          </div>
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

      {/* Dialog: confirmar envío */}
      {confirmEnviar && (
        <ConfirmDialog
          title="Confirmar transferencia"
          message={`¿Seguro que querés transferir la entrada${entradaSeleccionada
            ? ` (${entradaSeleccionada.seleccionLocal || 'Local'} vs ${entradaSeleccionada.seleccionVisitante || 'Visitante'}, Sector ${entradaSeleccionada.nombreSector || entradaSeleccionada.sector})`
            : ''
          } a ${form.emailDestino}? Esta acción no se puede deshacer.`}
          confirmLabel="Sí, transferir"
          onConfirm={enviarTransferencia}
          onCancel={() => setConfirmEnviar(false)}
        />
      )}

      {/* Dialog: confirmar rechazo */}
      {confirmRechazar != null && (
        <ConfirmDialog
          title="Rechazar transferencia"
          message={`¿Seguro que querés rechazar esta transferencia? La entrada volverá al remitente.`}
          confirmLabel="Rechazar"
          danger
          onConfirm={() => rechazarTransferencia(confirmRechazar)}
          onCancel={() => setConfirmRechazar(null)}
        />
      )}
    </div>
  )
}
