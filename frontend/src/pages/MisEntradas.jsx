import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import QRCode from 'qrcode'
import { Ticket, X, RefreshCw, AlertCircle } from 'lucide-react'

const SECTOR_BORDER = {
  A: 'border-l-yellow-500',
  B: 'border-l-blue-500',
  C: 'border-l-violet-500',
  D: 'border-l-green-500',
}

const ESTADO_BADGE = {
  EMITIDA: <span className="badge-green">EMITIDA</span>,
  CONSUMIDA: <span className="badge-zinc">CONSUMIDA</span>,
  TRANSFERIDA: <span className="badge-blue">TRANSFERIDA</span>,
}

function QRModal({ entradaId, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [tokenCodigo, setTokenCodigo] = useState('')
  const [loadingQr, setLoadingQr] = useState(true)
  const [qrError, setQrError] = useState('')

  const fetchToken = useCallback(async () => {
    setLoadingQr(true)
    setQrError('')
    try {
      const { data } = await api.post(`/entradas/${entradaId}/token`)
      const codigo = data.codigo || data.token || JSON.stringify(data)
      setTokenCodigo(codigo)
      const url = await QRCode.toDataURL(codigo, { width: 220, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      setQrDataUrl(url)
      setCountdown(30)
    } catch (err) {
      setQrError('No se pudo generar el QR')
    } finally {
      setLoadingQr(false)
    }
  }, [entradaId])

  useEffect(() => {
    fetchToken()
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { fetchToken(); return 30 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [fetchToken])

  const progress = (countdown / 30) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Código de acceso</h3>
        <p className="text-xs text-zinc-500 mb-5">Presentá este QR en el ingreso al estadio</p>

        {qrError ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-red-400 text-sm">{qrError}</p>
            <button onClick={fetchToken} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        ) : loadingQr && !qrDataUrl ? (
          <div className="flex items-center justify-center h-56">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* QR */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl shadow-inner">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" width={220} height={220} />}
              </div>
            </div>

            {/* Countdown */}
            <div className="text-center mb-3">
              <span className={`text-5xl font-black tabular-nums ${countdown <= 10 ? 'text-red-400' : 'text-green-400'}`}
                style={{ textShadow: countdown <= 10 ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(74,222,128,0.5)' }}>
                {countdown}
              </span>
              <p className="text-xs text-zinc-600 mt-1">segundos para renovar</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${countdown <= 10 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Token code */}
            {tokenCodigo && (
              <p className="text-center font-mono text-xs text-zinc-600 break-all">{tokenCodigo}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MisEntradas() {
  const { user } = useAuth()
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrEntradaId, setQrEntradaId] = useState(null)

  useEffect(() => {
    api.get(`/usuarios/${user.id}/entradas`)
      .then(r => setEntradas(r.data))
      .catch(() => setError('No se pudieron cargar las entradas'))
      .finally(() => setLoading(false))
  }, [user.id])

  const fmt = (n) => `$${(n || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Mis entradas</h1>
        <p className="text-zinc-500 text-sm mt-1">{entradas.length} entrada{entradas.length !== 1 ? 's' : ''} en tu cuenta</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {entradas.length === 0 && !loading && (
        <div className="card text-center py-16">
          <Ticket size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No tenés entradas aún</p>
          <p className="text-zinc-600 text-sm mt-1">Comprá en la sección "Comprar entradas"</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {entradas.map(entrada => {
          const sector = entrada.nombreSector || entrada.sector || 'D'
          const borderColor = SECTOR_BORDER[sector] || SECTOR_BORDER.D
          const estado = entrada.estado || 'EMITIDA'
          const canQr = estado === 'EMITIDA'

          return (
            <div
              key={entrada.idEntrada}
              className={`bg-zinc-900 border border-zinc-800 border-l-4 ${borderColor} rounded-xl p-5 flex items-center gap-4`}
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
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-white">{fmt(entrada.precio)}</p>
                {canQr && (
                  <button
                    onClick={() => setQrEntradaId(entrada.idEntrada)}
                    className="btn-primary text-xs px-3 py-1.5 mt-2 flex items-center gap-1.5"
                  >
                    <Ticket size={12} />
                    Ver QR
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {qrEntradaId && (
        <QRModal entradaId={qrEntradaId} onClose={() => setQrEntradaId(null)} />
      )}
    </div>
  )
}
