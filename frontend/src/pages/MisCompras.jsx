import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { Receipt, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'

const ESTADO_BADGE = {
  PENDIENTE: <span className="badge-yellow">PENDIENTE</span>,
  CONFIRMADA: <span className="badge-blue">CONFIRMADA</span>,
  PAGA: <span className="badge-green">PAGA</span>,
}

export default function MisCompras() {
  const { user } = useAuth()
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pagando, setPagando] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  const cargar = () => {
    setLoading(true)
    api.get(`/usuarios/${user.id}/compras`)
      .then(r => setCompras(r.data))
      .catch(() => setError('No se pudieron cargar las compras'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [user.id])

  const confirmar = async (id) => {
    setConfirmando(id)
    setError('')
    setSuccess('')
    try {
      await api.post(`/compras/${id}/confirmar`)
      setSuccess('Compra confirmada. Ya podés proceder al pago.')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al confirmar')
    } finally {
      setConfirmando(null)
    }
  }

  const pagar = async (id) => {
    setPagando(id)
    setError('')
    setSuccess('')
    try {
      await api.post(`/compras/${id}/pagar`)
      setSuccess('¡Pago registrado! Tus entradas están disponibles.')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al procesar el pago')
    } finally {
      setPagando(null)
    }
  }

  const fmt = (n) => `$${(n || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Mis compras</h1>
        <p className="text-zinc-500 text-sm mt-1">Historial de todas tus compras</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={16} className="text-green-400 shrink-0" />
          <span className="text-green-400 text-sm">{success}</span>
        </div>
      )}

      {compras.length === 0 && !loading && (
        <div className="card text-center py-16">
          <Receipt size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No tenés compras aún</p>
          <p className="text-zinc-600 text-sm mt-1">Tus compras aparecerán aquí</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {compras.map((compra, idx) => {
          const id = compra.idVenta
          const fecha = compra.fecha
          const estado = compra.estado
          const cantEntradas = compra.cantEntradas
          const subtotal = compra.subtotal
          const comision = compra.comision
          const total = compra.total

          const fechaFmt = fecha ? new Date(fecha).toLocaleString('es-UY', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : '—'

          return (
            <div key={id ?? idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-zinc-600">#{String(id).padStart(6, '0')}</span>
                    {ESTADO_BADGE[estado] || <span className="badge-zinc">{estado}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{fechaFmt}</p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{cantEntradas ?? '?'} entrada{cantEntradas !== 1 ? 's' : ''}</span>
                    {subtotal != null && <span>Subtotal: <span className="text-zinc-300">{fmt(subtotal)}</span></span>}
                    {comision != null && <span>Comisión: <span className="text-zinc-300">{fmt(comision)}</span></span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-white">{fmt(total)}</p>
                  {estado === 'PENDIENTE' && (
                    <button
                      onClick={() => confirmar(id)}
                      disabled={confirmando === id}
                      className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 mt-2 flex items-center gap-1.5 ml-auto rounded-lg transition-all disabled:opacity-60"
                    >
                      {confirmando === id
                        ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <CheckCircle size={12} />}
                      Confirmar
                    </button>
                  )}
                  {estado === 'CONFIRMADA' && (
                    <button
                      onClick={() => pagar(id)}
                      disabled={pagando === id}
                      className="btn-primary text-xs px-3 py-1.5 mt-2 flex items-center gap-1.5 ml-auto disabled:opacity-60"
                    >
                      {pagando === id
                        ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <CreditCard size={12} />}
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
