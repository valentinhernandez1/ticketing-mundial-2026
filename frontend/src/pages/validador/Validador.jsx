import { useState, useEffect } from 'react'
import api from '../../api/client'
import { ScanLine, CheckCircle, XCircle, Settings, Info } from 'lucide-react'

const DEVICE_KEY = 'validador_device_id'

export default function Validador() {
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(DEVICE_KEY) || '')
  const [codigoQr, setCodigoQr] = useState('')
  const [resultado, setResultado] = useState(null)
  const [detalle, setDetalle] = useState('')
  const [validando, setValidando] = useState(false)
  const [showDeviceEdit, setShowDeviceEdit] = useState(!localStorage.getItem(DEVICE_KEY))

  const saveDevice = () => {
    if (deviceId.trim()) {
      localStorage.setItem(DEVICE_KEY, deviceId.trim())
      setShowDeviceEdit(false)
    }
  }

  const validar = async (e) => {
    e.preventDefault()
    if (!deviceId) { setDetalle('Configurá el ID del dispositivo primero'); return }
    if (!codigoQr.trim()) return
    setValidando(true)
    setResultado(null)
    setDetalle('')
    try {
      const { data } = await api.post('/validaciones', {
        codigoQr: codigoQr.trim(),
        idDispositivo: parseInt(deviceId),
      })
      setResultado(data.resultado === 'ACEPTADO' ? 'ACEPTADO' : 'RECHAZADO')
      setDetalle(data.mensaje || '')
      setCodigoQr('')
    } catch (err) {
      setResultado('RECHAZADO')
      setDetalle(err.response?.data?.detalle || err.response?.data?.message || 'Error al validar')
    } finally {
      setValidando(false)
    }
  }

  useEffect(() => {
    if (!resultado) return
    const t = setTimeout(() => { setResultado(null); setDetalle('') }, 6000)
    return () => clearTimeout(t)
  }, [resultado])

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Validador de acceso</h1>
        <p className="text-zinc-500 text-sm mt-1">Control de ingreso al estadio</p>
      </div>

      {/* Config dispositivo */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-zinc-500" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dispositivo</span>
          </div>
          <button onClick={() => setShowDeviceEdit(v => !v)} className="btn-ghost text-xs">
            {showDeviceEdit ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        {showDeviceEdit ? (
          <div className="flex gap-2">
            <input
              type="number"
              className="input-field flex-1"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder="ID del dispositivo (ej: 1)"
            />
            <button onClick={saveDevice} className="btn-primary px-4">Guardar</button>
          </div>
        ) : (
          <p className="text-zinc-300 font-mono text-sm">
            Dispositivo #{deviceId || <span className="text-red-400">sin configurar</span>}
          </p>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-2xl border-2 p-8 text-center mb-6 ${
          resultado === 'ACEPTADO'
            ? 'bg-green-950/50 border-green-500 shadow-lg shadow-green-900/30'
            : 'bg-red-950/50 border-red-500 shadow-lg shadow-red-900/30'
        }`}>
          {resultado === 'ACEPTADO' ? (
            <>
              <CheckCircle size={56} className="text-green-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-4xl font-black text-green-400" style={{ textShadow: '0 0 30px rgba(74,222,128,0.5)' }}>
                ACEPTADO
              </p>
              <p className="text-zinc-400 text-sm mt-2">Ingreso registrado ✓</p>
            </>
          ) : (
            <>
              <XCircle size={56} className="text-red-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-4xl font-black text-red-400" style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
                RECHAZADO
              </p>
            </>
          )}
          {detalle && <p className="text-sm text-zinc-400 mt-2">{detalle}</p>}
        </div>
      )}

      {/* Formulario */}
      <div className="card">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <ScanLine size={16} className="text-green-400" />
          Escanear código QR
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Pegá o escribí el código del QR de la entrada
        </p>

        <form onSubmit={validar} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Código QR
            </label>
            <input
              type="text"
              className="input-field font-mono text-sm"
              value={codigoQr}
              onChange={e => setCodigoQr(e.target.value)}
              placeholder="1:bf67ff407a8c..."
              required
              autoFocus
            />
            <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
              <Info size={10} />
              Formato: idEntrada:codigoToken
            </p>
          </div>

          <button
            type="submit"
            disabled={validando || !deviceId || !codigoQr.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold disabled:opacity-60"
          >
            {validando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <ScanLine size={18} />
                Validar acceso
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-700 mt-6">
        El resultado se limpia a los 6 segundos
      </p>
    </div>
  )
}
