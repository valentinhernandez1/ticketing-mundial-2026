import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { X, RefreshCw } from 'lucide-react'
import { getToken } from '../api'

export default function QRModal({ entrada, onClose }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQR = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await getToken(entrada.id_entrada ?? entrada.idEntrada)
      const url = await QRCode.toDataURL(data.codigo, {
        width: 240,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      })
      setQrUrl(url)
      setCountdown(30)
      setError(null)
    } catch {
      setError('No se pudo generar el QR')
    } finally {
      setLoading(false)
    }
  }, [entrada])

  useEffect(() => {
    fetchQR()
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchQR(); return 30 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchQR])

  const progressPct = (countdown / 30) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 text-center shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white">Tu entrada digital</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="h-60 flex flex-col items-center justify-center gap-3">
            <span className="text-red-400 text-sm">{error}</span>
            <button
              onClick={fetchQR}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-3 inline-block mb-4 shadow-lg shadow-green-900/30">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
            </div>

            <div className="mb-3">
              <div
                className="text-5xl font-black tabular-nums"
                style={{
                  color: countdown <= 10 ? '#f87171' : '#4ade80',
                  textShadow: countdown <= 10
                    ? '0 0 20px rgba(248,113,113,0.4)'
                    : '0 0 20px rgba(74,222,128,0.4)'
                }}
              >
                {countdown}
              </div>
              <div className="text-xs text-zinc-500 mt-1">segundos hasta que se renueve</div>
            </div>

            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${countdown <= 10 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-2 rounded-lg transition-all text-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
