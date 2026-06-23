import { useState, useEffect, useRef, useCallback } from 'react'
import jsQR from 'jsqr'
import api from '../../api/client'
import { ScanLine, CheckCircle, XCircle, Settings, Camera, CameraOff, Type, User } from 'lucide-react'

const DEVICE_KEY = 'validador_device_id'

export default function Validador() {
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem(DEVICE_KEY) || '')
  const [codigoQr, setCodigoQr] = useState('')
  const [resultado, setResultado] = useState(null)
  const [detalle, setDetalle] = useState('')
  const [titular, setTitular] = useState(null)
  const [validando, setValidando] = useState(false)
  const [showDeviceEdit, setShowDeviceEdit] = useState(!localStorage.getItem(DEVICE_KEY))
  const [modo, setModo] = useState('camara')
  const [escaneando, setEscaneando] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')

  // video oculto para capturar el stream
  const videoRef = useRef(null)
  // canvas visible que muestra los frames de la camara
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const procesandoRef = useRef(false)
  const rafRef = useRef(null)

  const saveDevice = () => {
    if (deviceId.trim()) {
      localStorage.setItem(DEVICE_KEY, deviceId.trim())
      setShowDeviceEdit(false)
    }
  }

  const procesarCodigo = useCallback(async (codigo) => {
    if (procesandoRef.current) return
    procesandoRef.current = true
    detenerCamara()
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
    } catch (err) {
      setResultado('RECHAZADO')
      setDetalle(err.response?.data?.detalle || err.response?.data?.message || 'Error al validar')
    } finally {
      setValidando(false)
      procesandoRef.current = false
    }
  }, [deviceId])

  // Loop principal: dibuja el video en el canvas Y detecta QR
  const loop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || procesandoRef.current) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      // Dibujar frame actual de la camara en el canvas
      ctx.drawImage(video, 0, 0)
      // Intentar detectar QR en el mismo frame
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code?.data) {
        procesarCodigo(code.data)
        return  // no seguir el loop si detectamos
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [procesarCodigo])

  const iniciarCamara = async () => {
    setErrorCamara('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.onloadedmetadata = () => {
          video.play().catch(() => {})
        }
      }
      setEscaneando(true)
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('ermission') || msg.includes('NotAllowed')) {
        setErrorCamara('Permiso de cámara denegado. Habilitalo en la configuración del navegador.')
      } else {
        setErrorCamara('No se pudo acceder a la cámara. Usá el modo manual.')
      }
    }
  }

  const detenerCamara = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setEscaneando(false)
  }

  // Arranca el loop cuando empieza a escanear
  useEffect(() => {
    if (!escaneando) return
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [escaneando, loop])

  useEffect(() => { return () => detenerCamara() }, [])
  useEffect(() => { if (modo === 'manual') detenerCamara() }, [modo])

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
      if (modo === 'camara') iniciarCamara()
    }, 6000)
    return () => clearTimeout(t)
  }, [resultado])

  return (
    <div className="max-w-md mx-auto">
      {/* Video oculto — solo para capturar el stream de la camara */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

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
              placeholder="ID del dispositivo (ej: 1)"
              autoFocus
            />
            <button onClick={saveDevice} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm">OK</button>
          </div>
        ) : (
          <p className={`font-mono text-sm ${deviceId ? 'text-green-400' : 'text-red-400'}`}>
            {deviceId ? `Dispositivo #${deviceId}` : 'Sin configurar'}
          </p>
        )}
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setModo('camara')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${modo === 'camara' ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
          <Camera size={16} /> Escanear con cámara
        </button>
        <button onClick={() => setModo('manual')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${modo === 'manual' ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
          <Type size={16} /> Ingresar código
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-2xl border-2 p-6 text-center mb-4 ${resultado === 'ACEPTADO' ? 'bg-green-950/50 border-green-500 shadow-lg shadow-green-900/30' : 'bg-red-950/50 border-red-500 shadow-lg shadow-red-900/30'}`}>
          {resultado === 'ACEPTADO' ? (
            <>
              <CheckCircle size={56} className="text-green-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-4xl font-black text-green-400">ACEPTADO</p>
              <p className="text-zinc-400 text-sm mt-1">Ingreso registrado ✓</p>
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
          <div className="relative" style={{ minHeight: 300, background: '#000' }}>

            {/* Canvas: muestra lo que ve la camara */}
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                display: escaneando ? 'block' : 'none',
                maxHeight: 380,
              }}
            />

            {/* Marco de escaneo verde encima del canvas */}
            {escaneando && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400" />
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-green-400/70 animate-pulse" />
                </div>
              </div>
            )}

            {!escaneando && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {errorCamara && <p className="text-red-400 text-sm text-center px-6">{errorCamara}</p>}
                <button onClick={iniciarCamara} disabled={!deviceId} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                  <Camera size={18} /> Iniciar cámara
                </button>
                {!deviceId && <p className="text-xs text-yellow-500">Configurá el dispositivo primero</p>}
              </div>
            )}

            {escaneando && (
              <button onClick={detenerCamara} className="absolute top-2 right-2 z-10 bg-black/60 text-zinc-300 hover:text-white p-2 rounded-lg">
                <CameraOff size={16} />
              </button>
            )}
          </div>

          {escaneando && (
            <div className="p-3 text-center border-t border-zinc-800">
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Apuntá el QR al recuadro...
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO MANUAL */}
      {modo === 'manual' && !resultado && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <ScanLine size={15} className="text-green-400" /> Ingresar código QR
          </h2>
          <form onSubmit={validarManual} className="flex flex-col gap-3">
            <input
              type="text"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-green-500"
              value={codigoQr}
              onChange={e => setCodigoQr(e.target.value)}
              placeholder="1:bf67ff407a8c..."
              required autoFocus
            />
            <p className="text-xs text-zinc-600">Formato: idEntrada:codigoToken</p>
            <button type="submit" disabled={validando || !deviceId || !codigoQr.trim()} className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              {validando ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ScanLine size={18} />}
              Validar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
