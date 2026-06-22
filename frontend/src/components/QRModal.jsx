import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { X, RefreshCw, AlertCircle } from 'lucide-react'
import api from '../api/client'

export default function QRModal({ entrada, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [tokenCodigo, setTokenCodigo] = useState('')
  const [loadingQr, setLoadingQr] = useState(true)
  const [qrError, setQrError] = useState('')

  const idEntrada = entrada.idEntrada ?? entrada.id_entrada

  const fetchToken = useCallback(async () => {
    setLoadingQr(true)
    setQrError('')
    try {
      const { data } = await api.post(`/entradas/${idEntrada}/token`)
      const codigo = data.codigo || data.token || JSON.stringify(data)
      setTokenCodigo(codigo)
      const url = await QRCode.toDataURL(codigo, {
        width: 220,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      setQrDataUrl(url)
      setCountdown(30)
    } catch {
      setQrError('No se pudo generar el QR')
    } finally {
      setLoadingQr(false)
    }
  }, [idEntrada])

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
  const isUrgent = countdown <= 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-4 pr-6">
          <h3 className="text-base font-bold text-white">Código de acceso</h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            {entrada.seleccionLocal || 'Local'} vs {entrada.seleccionVisitante || 'Visitante'}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-zinc-500">🏟️ {entrada.estadio || '—'}</span>
            {(entrada.nombreSector || entrada.sector) && (
              <span className="badge-zinc text-xs">Sector {entrada.nombreSector || entrada.sector}</span>
            )}
          </div>
          {entrada.fechaHora && (
            <p className="text-xs text-zinc-600 mt-0.5">
              {new Date(entrada.fechaHora).toLocaleString('es-UY', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <p className="text-xs text-zinc-500 mb-4">Presentá este QR en el ingreso al estadio</p>

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
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className={`bg-white p-3 rounded-xl shadow-inner transition-all duration-300 ${isUrgent ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-zinc-900' : ''}`}>
                {qrDataUrl && <img src={qrDataUrl} alt="QR" width={220} height={220} />}
              </div>
            </div>

            <div className="text-center mb-2">
              <span
                className={`text-5xl font-black tabular-nums transition-colors duration-300 ${
                  isUrgent ? 'text-orange-400 animate-pulse' : 'text-emerald-400'
                }`}
                style={{ textShadow: isUrgent ? '0 0 24px rgba(251,146,60,0.6)' : '0 0 20px rgba(74,222,128,0.5)' }}
              >
                {countdown}
              </span>
              <p className="text-xs text-zinc-600 mt-1">segundos para renovar</p>
            </div>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-orange-500' : 'bg-emerald-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {isUrgent && (
              <p className="text-center text-xs text-orange-400 font-semibold mb-2 animate-pulse">
                ¡Renovando pronto!
              </p>
            )}

            {tokenCodigo && (
              <p className="text-center font-mono text-xs text-zinc-600 break-all">{tokenCodigo}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
