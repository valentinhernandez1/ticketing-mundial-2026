import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { ShoppingCart, Trash2, Ticket, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'

const SECTOR_STYLES = {
  A: { bg: 'bg-yellow-950/40', border: 'border-yellow-800/40', text: 'text-yellow-400', btn: 'bg-yellow-600 hover:bg-yellow-500 text-black font-bold', label: 'Sector A — VIP' },
  B: { bg: 'bg-blue-950/40', border: 'border-blue-800/40', text: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500 text-white font-bold', label: 'Sector B — Platea' },
  C: { bg: 'bg-violet-950/40', border: 'border-violet-800/40', text: 'text-violet-400', btn: 'bg-violet-600 hover:bg-violet-500 text-white font-bold', label: 'Sector C — Popular' },
  D: { bg: 'bg-green-950/40', border: 'border-green-800/40', text: 'text-green-400', btn: 'bg-green-600 hover:bg-green-500 text-white font-bold', label: 'Sector D — General' },
}

function SectorCard({ sector, onAdd }) {
  const s = SECTOR_STYLES[sector.sector] || SECTOR_STYLES.D
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-4 flex flex-col gap-3`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${s.text}`}>{s.label}</p>
        <p className={`text-2xl font-black mt-1 ${s.text}`}>
          ${sector.precio?.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">{sector.disponibles ?? '?'} disponibles</p>
      </div>
      <button
        onClick={() => onAdd(sector)}
        className={`${s.btn} px-3 py-1.5 rounded-lg text-sm transition-all active:scale-95 disabled:opacity-40`}
        disabled={sector.disponibles === 0}
      >
        + Agregar
      </button>
    </div>
  )
}

export default function Comprar() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [carrito, setCarrito] = useState([])
  const [comprando, setComprando] = useState(false)
  const [success, setSuccess] = useState('')
  const [expanded, setExpanded] = useState({})
  const [tasaComision, setTasaComision] = useState(5)

  useEffect(() => {
    Promise.all([
      api.get('/consulta/eventos'),
      api.get('/comisiones'),
    ]).then(([evRes, comRes]) => {
      setEventos(evRes.data)
      if (evRes.data.length > 0) setExpanded({ [evRes.data[0].idEvento]: true })
      if (comRes.data.length > 0) setTasaComision(Number(comRes.data[0].porcentaje))
    }).catch(() => setError('No se pudieron cargar los datos'))
      .finally(() => setLoading(false))
  }, [])

  const addToCart = (evento, sector) => {
    if (carrito.length >= 5) return
    setCarrito(c => [...c, { evento, sector, key: Date.now() }])
  }

  const removeFromCart = (key) => setCarrito(c => c.filter(i => i.key !== key))
  const clearCart = () => setCarrito([])

  const subtotal = carrito.reduce((s, i) => s + (i.sector.precio || 0), 0)
  const comision = subtotal * (tasaComision / 100)
  const total = subtotal + comision

  const comprar = async () => {
    if (carrito.length === 0) return
    setComprando(true)
    setError('')
    setSuccess('')
    try {
      const eventoSectores = carrito.map(i => i.sector.idEventoSector)
      await api.post('/compras', { eventoSectores })
      setSuccess('¡Compra realizada! Redirigiendo a tus compras...')
      setCarrito([])
      setTimeout(() => navigate('/mis-compras'), 1500)
    } catch (err) {
      setError(err.response?.data?.detalle || err.response?.data?.message || 'Error al realizar la compra')
    } finally {
      setComprando(false)
    }
  }

  const toggleEvento = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const fmt = (n) => `$${(n || 0).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) return <LoadingSpinner />

  return (
    <div className={carrito.length > 0 ? 'pb-52 md:pb-48' : 'pb-4'}>
      <PageHeader
        icon={ShoppingBag}
        title="Comprar entradas"
        subtitle="Seleccioná los sectores para los partidos que querés ver"
      />

      <Alert type="error" message={error} className="mb-4" />
      <Alert type="success" message={success} className="mb-4" />

      {eventos.length === 0 && !loading && (
        <EmptyState
          emoji="⚽"
          title="No hay eventos disponibles por el momento"
          description="Volvé a revisar más tarde"
        />
      )}

      <div className="flex flex-col gap-4">
        {eventos.map(ev => (
          <div key={ev.idEvento} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Match header */}
            <button
              className="w-full text-left"
              onClick={() => toggleEvento(ev.idEvento)}
            >
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-800/80 to-zinc-900 px-6 py-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-black text-white">{ev.local || 'Local'}</p>
                      <p className="text-xs text-zinc-500">{ev.paisLocal || ''}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-600 font-black text-lg">VS</span>
                      <span className="text-xs text-green-500 font-bold mt-0.5">⚽</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-white">{ev.visitante || 'Visitante'}</p>
                      <p className="text-xs text-zinc-500">{ev.paisVisitante || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-zinc-500">🏟️ {ev.estadio || 'Estadio'}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">
                      {ev.fecha ? new Date(ev.fecha).toLocaleString('es-UY', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '—'}
                    </span>
                    {ev.estado && ev.estado !== 'ACTIVO' && (
                      <span className="badge-red">{ev.estado}</span>
                    )}
                  </div>
                </div>
                <div className="text-zinc-600 ml-4">
                  {expanded[ev.idEvento] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </button>

            {/* Sectores */}
            {expanded[ev.idEvento] && (
              <div className="px-6 pb-6">
                {ev.sectores && ev.sectores.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                    {ev.sectores.map(sec => (
                      <SectorCard
                        key={sec.idEventoSector}
                        sector={sec}
                        onAdd={(s) => addToCart(ev, s)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-sm py-4">No hay sectores habilitados para este evento</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Carrito sticky */}
      {carrito.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-40 p-4">
          <div className="max-w-5xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/70 p-4">
            <div className="flex items-start gap-4">
              {/* Items */}
              <div className="flex-1 flex flex-wrap gap-2">
                {carrito.map(item => (
                  <div key={item.key} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs">
                    <Ticket size={12} className="text-green-400" />
                    <span className="text-zinc-300 font-medium">{item.evento.local} vs {item.evento.visitante}</span>
                    <span className="text-zinc-500">· Sector {item.sector.sector}</span>
                    <button onClick={() => removeFromCart(item.key)} className="text-zinc-600 hover:text-red-400 ml-1 transition-colors">
                      ×
                    </button>
                  </div>
                ))}
                {carrito.length >= 5 && (
                  <span className="text-xs text-yellow-500 font-medium self-center">Máximo 5 entradas</span>
                )}
              </div>

              {/* Totales + botones */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-xs text-zinc-500 hidden sm:block">
                  <div>Subtotal: <span className="text-zinc-300">{fmt(subtotal)}</span></div>
                  <div>Comisión ({tasaComision}%): <span className="text-zinc-300">{fmt(comision)}</span></div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="text-xl font-black text-white">{fmt(total)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearCart} className="btn-secondary flex items-center gap-1.5 text-sm">
                    <Trash2 size={14} />
                    Vaciar
                  </button>
                  <button
                    onClick={comprar}
                    disabled={comprando}
                    className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-60"
                  >
                    {comprando ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                    Comprar ({carrito.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
