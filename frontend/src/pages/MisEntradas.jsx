import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import QRModal from '../components/QRModal'
import PageHeader from '../components/ui/PageHeader'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Ticket, ShoppingBag, History, X, CheckCircle, XCircle, Send, ArrowRight } from 'lucide-react'

const SECTOR_BORDER = {
  A: 'border-l-yellow-500',
  B: 'border-l-blue-500',
  C: 'border-l-violet-500',
  D: 'border-l-green-500',
}

const ESTADO_BADGE = {
  EMITIDA:    <span className="badge-green">EMITIDA</span>,
  CONSUMIDA:  <span className="badge-zinc">CONSUMIDA</span>,
  TRANSFERIDA:<span className="badge-blue">TRANSFERIDA</span>,
}

const VENTA_BADGE = {
  PENDIENTE:  <span className="badge-yellow">⚠ Pendiente de pago</span>,
  CONFIRMADA: <span className="badge-blue">⚠ Confirmada — sin pagar</span>,
  PAGA:       null,
}

const ACCION_ICON = {
  ALTA:          <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />,
  CAMBIO_ESTADO: <ArrowRight  size={14} className="text-blue-400  shrink-0 mt-0.5" />,
}

function HistorialModal({ entrada, userId, onClose }) {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/usuarios/${userId}/entradas/${entrada.idEntrada}/historial`)
      .then(r => setEventos(r.data))
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setLoading(false))
  }, [entrada.idEntrada, userId])

  const fmtFecha = (f) => f ? new Date(f).toLocaleString('es-UY', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300">
          <X size={20} />
        </button>

        <div className="mb-4 pr-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History size={16} className="text-emerald-400" />
            Historial de la entrada #{entrada.idEntrada}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {entrada.seleccionLocal || 'Local'} vs {entrada.seleccionVisitante || 'Visitante'}
            {entrada.nombreSector && <> · Sector {entrada.nombreSector}</>}
          </p>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm text-center py-4">{error}</p>
          ) : eventos.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">Sin eventos registrados</p>
          ) : (
            <ol className="relative border-l border-zinc-700 ml-3 space-y-4">
              {eventos.map((ev, i) => (
                <li key={ev.idAuditoria ?? i} className="ml-5">
                  <span className="absolute -left-1.5 flex items-center justify-center w-3 h-3 bg-zinc-800 rounded-full border border-zinc-600" />
                  <div className="flex items-start gap-2">
                    {ACCION_ICON[ev.accion] || <Send size={14} className="text-zinc-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {ev.accion === 'ALTA' && 'Entrada emitida'}
                        {ev.accion === 'CAMBIO_ESTADO' && (
                          <>
                            <span className="text-zinc-400">{ev.estadoAnterior}</span>
                            {' → '}
                            <span className="text-white">{ev.estadoNuevo}</span>
                          </>
                        )}
                      </p>
                      {(ev.nombreOrigen || ev.nombreDestino) && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {ev.nombreOrigen && <>De: {ev.nombreOrigen}</>}
                          {ev.nombreOrigen && ev.nombreDestino && ' → '}
                          {ev.nombreDestino && <>Para: {ev.nombreDestino}</>}
                        </p>
                      )}
                      <p className="text-xs text-zinc-600 mt-0.5">{fmtFecha(ev.fecha)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MisEntradas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrEntrada, setQrEntrada] = useState(null)
  const [historialEntrada, setHistorialEntrada] = useState(null)

  useEffect(() => {
    api.get(`/usuarios/${user.id}/entradas`)
      .then(r => setEntradas(r.data))
      .catch(() => setError('No se pudieron cargar las entradas'))
      .finally(() => setLoading(false))
  }, [user.id])

  const fmt = (n) => `$${(n || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        icon={Ticket}
        title="Mis entradas"
        subtitle={`${entradas.length} entrada${entradas.length !== 1 ? 's' : ''} en tu cuenta`}
      />

      <Alert type="error" message={error} className="mb-4" />

      {entradas.length === 0 && !loading && (
        <EmptyState
          icon={Ticket}
          title="No tenés entradas todavía"
          description="Comprá tu primera entrada y disfrutá el Mundial"
          action={
            <button onClick={() => navigate('/comprar')} className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={15} />
              Ir a comprar
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {entradas.map(entrada => {
          const sector = entrada.nombreSector || entrada.sector || 'D'
          const borderColor = SECTOR_BORDER[sector] || SECTOR_BORDER.D
          const estado = entrada.estado || 'EMITIDA'
          const estadoVenta = entrada.estadoVenta || 'PAGA'
          const ventaPaga = estadoVenta === 'PAGA'
          const canQr = estado === 'EMITIDA' && ventaPaga

          return (
            <div
              key={entrada.idEntrada}
              className={`list-row border-l-4 ${borderColor} flex items-center gap-4`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm truncate">
                    {entrada.seleccionLocal || 'Local'} vs {entrada.seleccionVisitante || 'Visitante'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-2">
                  🏟️ {entrada.estadio || '—'} · {entrada.fechaHora ? new Date(entrada.fechaHora).toLocaleString('es-UY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-zinc">Sector {sector}</span>
                  {ESTADO_BADGE[estado] || <span className="badge-zinc">{estado}</span>}
                  {VENTA_BADGE[estadoVenta]}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                <p className="text-lg font-black text-white">{fmt(entrada.precio)}</p>
                {canQr && (
                  <button
                    onClick={() => setQrEntrada(entrada)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Ticket size={12} />
                    Ver QR
                  </button>
                )}
                <button
                  onClick={() => setHistorialEntrada(entrada)}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <History size={12} />
                  Historial
                </button>
                {estado === 'EMITIDA' && !ventaPaga && (
                  <p className="text-yellow-500 text-xs">Pagá la compra para acceder al QR</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {qrEntrada && (
        <QRModal entrada={qrEntrada} onClose={() => setQrEntrada(null)} />
      )}
      {historialEntrada && (
        <HistorialModal
          entrada={historialEntrada}
          userId={user.id}
          onClose={() => setHistorialEntrada(null)}
        />
      )}
    </div>
  )
}
