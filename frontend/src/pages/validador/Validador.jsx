import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../api/client'
import { ScanLine, CheckCircle, XCircle, Settings, Camera, CameraOff, Type, User } from 'lucide-react'

const DEVICE_KEY = 'validador_device_id'

export default function Validador() {
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(DEVICE_KEY) || '')
  const [codigoQr, setCodigoQr] = useState('')
  const [resultado, setResultado] = useState(null)
  const [detalle, setDetalle] = useState('')
  const [titular, setTitular] = useState(null) // info del titular cuando ACEPTADO
  const [validando, setValidando] = useState(false)
  const [showDeviceEdit, setShowDeviceEdit] = useState(!localStorage.getItem(DEVICE_KEY))
  const [modo, setModo] = useState('camara')
  const [escaneando, setEscaneando] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)

  const saveDevice = () => {
    if (deviceId.trim()) {
      localStorage.setItem(DEVICE_KEY, deviceId.trim())
      setShowDeviceEdit(false)
    }
  }

  const iniciarCamara = async () => {
    setErrorCamara('')
    try {
      const html5Qr = new Html5Qrcode('qr-reader')
      html5QrRef.current = html5Qr
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await detenerCamara()
          await procesarCodigo(decodedText)
        },
        () => {}
      )
      setEscaneando(true)
    } catch (err) {
      setEscaneando(false)
      const msg = err?.message || String(err)
      if (msg.includes('permission') || msg.includes('Permission') || msg.includes('NotAllowed')) {
        setErrorCamara('Permiso de cámara denegado. Andá a Configuración del celular y habilitá la cámara para este sitio.')
      } else {
        setErrorCamara('No se pudo acceder a la cámara. Usá el modo manual.')
      }
    }
  }

  const detenerCamara = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch {}
      html5QrRef.current = null
    }
    setEscaneando(false)
  }

  useEffect(() => {
    return () => { detenerCamara() }
  }, [])

  useEffect(() => {
    if (modo === 'manual') detenerCamara()
  }, [modo])

  const procesarCodigo = async (codigo) => {
    if (!deviceId) {
      setResultado('RECHAZADO')
      setDetalle('Configurá el ID del dispositivo primero')
      setTitular(null)
      return
    }
    setValidando(true)
    setResultado(null)
    setDetalle('')
    setTitular(null)
    try {
      const { data } = await api.post('/validaciones', {
        codigoQr: codigo.trim(),
        idDispositivo: parseInt(deviceId),
      })
      const res = data.resultado === 'ACEPTADO' ? 'ACEPTADO' : 'RECHAZADO'
      setResultado(res)
      setDetalle(data.mensaje || '')
      // si viene info del titular la mostramos
      if (res === 'ACEPTADO' && (data.titular || data.nombreTitular || data.nombre)) {
        setTitular({
          nombre: data.titular || data.nombreTitular || data.nombre || null,
          email: data.emailTitular || data.email || null,
          partido: data.partido || data.evento || null,
          sector: data.sector || null,
        })
      }
    } catch (err) {
      setResultado('RECHAZADO')
      setDetalle(err.response?.data?.detalle || err.response?.data?.message || 'Error al validar')
      setTitular(null)
    } finally {
      setValidando(false)
    }
  }

  const validarManual = async (e) => {
    e.preventDefault()
    if (!codigoQr.trim()) return
    await procesarCodigo(codigoQr)
    setCodigoQr('')
  }

  useEffect(() => {
    if (!resultado) return
    const t = setTimeout(() => {
      setResultado(null)
      setDetalle('')
      setTitular(null)
      if (modo === 'camara' && !escaneando) iniciarCamara()
    }, 6000)
    return () => clearTimeout(t)
  }, [resultado])

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Validador de acceso</h1>
        <p className="text-zinc-500 text-sm mt-1">Control de ingreso al estadio</p>
      </div>

      {/* Config dispositivo */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-zinc-500" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dispositivo</span>
          </div>
          <button onClick={() => setShowDeviceEdit(v => !v)} className="text-xs text-zinc-500 hover:text-zinc-300">
            {showDeviceEdit ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        {showDeviceEdit ? (
          <div className="flex gap-2">
            <input
              type="number"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder="ID del dispositivo"
            />
            <button onClick={saveDevice} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all">
              OK
            </button>
          </div>
        ) : (
          <p className={`font-mono text-sm ${deviceId ? 'text-green-400' : 'text-red-400'}`}>
            {deviceId ? `Dispositivo #${deviceId}` : 'Sin configurar'}
          </p>
        )}
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setModo('camara')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            modo === 'camara'
              ? 'bg-green-900/30 border-green-800 text-green-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
          }`}
        >
          <Camera size={16} />
          Escanear con cámara
        </button>
        <button
          onClick={() => setModo('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            modo === 'manual'
              ? 'bg-green-900/30 border-green-800 text-green-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
          }`}
        >
          <Type size={16} />
          Ingresar código
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-2xl border-2 p-6 text-center mb-4 ${
          resultado === 'ACEPTADO'
            ? 'bg-green-950/50 border-green-500 shadow-lg shadow-green-900/30'
            : 'bg-red-950/50 border-red-500 shadow-lg shadow-red-900/30'
        }`}>
          {resultado === 'ACEPTADO' ? (
            <>
              <CheckCircle size={56} className="text-green-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-4xl font-black text-green-400">ACEPTADO</p>
              <p className="text-zinc-400 text-sm mt-1">Ingreso registrado ✓</p>

              {/* Info del titular */}
              {titular && (titular.nombre || titular.email || titular.partido) && (
                <div className="mt-4 bg-green-950/50 border border-green-800/40 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={13} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Titular</span>
                  </div>
                  {titular.nombre && (
                    <p className="text-sm font-semibold text-white">{titular.nombre}</p>
                  )}
                  {titular.email && (
                    <p className="text-xs text-zinc-400 mt-0.5">{titular.email}</p>
                  )}
                  {titular.partido && (
                    <p className="text-xs text-zinc-500 mt-1">⚽ {titular.partido}</p>
                  )}
                  {titular.sector && (
                    <p className="text-xs text-zinc-500">Sector {titular.sector}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle size={56} className="text-red-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-4xl font-black text-red-400">RECHAZADO</p>
            </>
          )}
          {detalle && <p className="text-sm text-zinc-400 mt-3">{detalle}</p>}
          <p className="text-xs text-zinc-600 mt-3">Se limpia en 6 segundos...</p>
        </div>
      )}

      {/* MODO CÁMARA */}
      {modo === 'camara' && !resultado && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="relative bg-black" style={{ minHeight: 280 }}>
            <div id="qr-reader" className="w-full" />
            {!escaneando && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {errorCamara && (
                  <p className="text-red-400 text-sm text-center px-4">{errorCamara}</p>
                )}
                <button
                  onClick={iniciarCamara}
                  disabled={!deviceId}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Camera size={18} />
                  Iniciar cámara
                </button>
                {!deviceId && <p className="text-xs text-yellow-500">Configurá el dispositivo primero</p>}
              </div>
            )}
            {escaneando && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={detenerCamara}
                  className="bg-zinc-800/80 backdrop-blur text-zinc-300 hover:text-white p-2 rounded-lg"
                >
                  <CameraOff size={16} />
                </button>
              </div>
            )}
          </div>
          {escaneando && (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Esperando código QR...
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO MANUAL */}
      {modo === 'manual' && !resultado && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <ScanLine size={15} className="text-green-400" />
            Ingresar código QR
          </h2>
          <form onSubmit={validarManual} className="flex flex-col gap-3">
            <div>
              <input
                type="text"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30"
                value={codigoQr}
                onChange={e => setCodigoQr(e.target.value)}
                placeholder="1:bf67ff407a8c..."
                required
                autoFocus
              />
              <p className="text-xs text-zinc-600 mt-1">Formato: idEntrada:codigoToken</p>
            </div>
            <button
              type="submit"
              disabled={validando || !deviceId || !codigoQr.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {validando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ScanLine size={18} />
              )}
              Validar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
