import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Receipt, CreditCard, CheckCircle, Ticket, ShoppingBag } from 'lucide-react'

const ESTADO_BADGE = {
  PENDIENTE: <span className="badge-yellow">PENDIENTE</span>,
  CONFIRMADA: <span className="badge-blue">CONFIRMADA</span>,
  PAGA: <span className="badge-green">PAGA</span>,
  ANULADA: <span className="badge-red">ANULADA</span>,
}

export default function MisCompras() {
  const { user } = useAuth()
  const navigate = useNavigate()
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

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        icon={Receipt}
        title="Mis compras"
        subtitle="Historial de todas tus compras"
      />

      <Alert type="error" message={error} className="mb-4" />
      <Alert type="success" message={success} className="mb-4" />

      {compras.length === 0 && !loading && (
        <EmptyState
          icon={Receipt}
          title="No hiciste ninguna compra aún"
          description="Cuando compres entradas aparecerán aquí"
          action={
            <button onClick={() => navigate('/comprar')} className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={15} />
              Comprar entradas
            </button>
          }
        />
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
          const entradas = compra.entradas || []

          const fechaFmt = fecha ? new Date(fecha).toLocaleString('es-UY', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : '—'

          return (
            <div key={id ?? idx} className="list-item">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-zinc-600">#{String(id).padStart(6, '0')}</span>
                    {ESTADO_BADGE[estado] || <span className="badge-zinc">{estado}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{fechaFmt}</p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                    <span>{cantEntradas ?? '?'} entrada{cantEntradas !== 1 ? 's' : ''}</span>
                    {subtotal != null && <span>Subtotal: <span className="text-zinc-300">{fmt(subtotal)}</span></span>}
                    {comision != null && <span>Comisión: <span className="text-zinc-300">{fmt(comision)}</span></span>}
                  </div>

                  {/* Detalle de entradas */}
                  {entradas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entradas.map((en, ei) => (
                        <div key={ei} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs">
                          <Ticket size={10} className="text-green-400" />
                          <span className="text-zinc-300">
                            {en.seleccionLocal || en.local || '—'} vs {en.seleccionVisitante || en.visitante || '—'}
                          </span>
                          {(en.nombreSector || en.sector) && (
                            <span className="text-zinc-500">· Sector {en.nombreSector || en.sector}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                  {estado === 'PAGA' && (
                    <button
                      onClick={() => navigate('/mis-entradas')}
                      className="btn-secondary text-xs px-3 py-1.5 mt-2 flex items-center gap-1.5 ml-auto"
                    >
                      <Ticket size={12} />
                      Ver entradas
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
