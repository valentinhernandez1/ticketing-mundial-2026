import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { ShoppingCart, Trash2, Ticket, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'

const SECTOR_META = {
  A: { accent: 'text-amber-400',   label: 'VIP'     },
  B: { accent: 'text-sky-400',     label: 'Platea'  },
  C: { accent: 'text-violet-400',  label: 'Popular' },
  D: { accent: 'text-emerald-400', label: 'General' },
}

function SectorCard({ sector, onAdd }) {
  const m = SECTOR_META[sector.sector] || SECTOR_META.D
  const disponibles = sector.disponibles ?? 0
  const soldOut = disponibles === 0

  return (
    <div className={`bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 flex flex-col gap-3 transition-opacity ${soldOut ? 'opacity-40' : ''}`}>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${m.accent}`}>
          {sector.sector} · {m.label}
        </p>
        <p className="text-xl font-black text-white mt-2">
          ${sector.precio?.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {soldOut ? 'Sin disponibilidad' : `${disponibles} disponibles`}
        </p>
      </div>
      <button
        onClick={() => onAdd(sector)}
        disabled={soldOut}
        className="w-full py-1.5 rounded-lg text-xs font-semibold border border-zinc-600/50 text-zinc-300 hover:bg-zinc-700/50 hover:border-zinc-500/70 transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {soldOut ? 'Agotado' : '+ Agregar'}
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
      setSuccess('¡Compra realizada! Redirigiendo...')
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
    <div className={carrito.length > 0 ? 'pb-52 md:pb-44' : 'pb-4'}>
      <PageHeader
        icon={ShoppingBag}
        title="Comprar entradas"
        subtitle="Seleccioná los sectores para los partidos que querés ver"
      />

      <Alert type="error"   message={error}   className="mb-4" />
      <Alert type="success" message={success} className="mb-4" />

      {eventos.length === 0 && (
        <EmptyState
          emoji="⚽"
          title="No hay eventos disponibles por el momento"
          description="Volvé a revisar más tarde"
        />
      )}

      <div className="flex flex-col gap-3">
        {eventos.map(ev => (
          <div key={ev.idEvento} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden">
            {/* Encabezado del partido */}
            <button className="w-full text-left" onClick={() => toggleEvento(ev.idEvento)}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {/* Equipos */}
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-white truncate">{ev.local || 'Local'}</span>
                    <span className="text-xs font-bold text-zinc-600 shrink-0">VS</span>
                    <span className="text-base font-black text-white truncate">{ev.visitante || 'Visitante'}</span>
                    {ev.estado && ev.estado !== 'PROGRAMADO' && (
                      <span className={`shrink-0 ${ev.estado === 'CANCELADO' ? 'badge-red' : 'badge-zinc'}`}>
                        {ev.estado}
                      </span>
                    )}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-zinc-600">🏟 {ev.estadio || 'Estadio'}</span>
                    <span className="text-zinc-800">·</span>
                    <span className="text-xs text-zinc-600">
                      {ev.fecha ? new Date(ev.fecha).toLocaleString('es-UY', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </span>
                  </div>
                </div>
                <div className="text-zinc-700 ml-4 shrink-0">
                  {expanded[ev.idEvento] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </button>

            {/* Sectores */}
            {expanded[ev.idEvento] && (
              <div className="px-5 pb-5 border-t border-zinc-800/40 pt-4">
                {ev.sectores && ev.sectores.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {ev.sectores.map(sec => (
                      <SectorCard
                        key={sec.idEventoSector}
                        sector={sec}
                        onAdd={(s) => addToCart(ev, s)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-700 text-sm py-2">Sin sectores habilitados</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Carrito sticky */}
      {carrito.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-40 p-3 md:p-4">
          <div className="max-w-5xl mx-auto bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/60 p-3.5">
            <div className="flex items-start gap-3">
              {/* Chips */}
              <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                {carrito.map(item => (
                  <div key={item.key} className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 text-xs">
                    <Ticket size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-zinc-300 font-medium truncate max-w-[120px]">
                      {item.evento.local} vs {item.evento.visitante}
                    </span>
                    <span className="text-zinc-600">· {item.sector.sector}</span>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-zinc-700 hover:text-red-400 ml-0.5 transition-colors leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {carrito.length >= 5 && (
                  <span className="text-xs text-amber-500 font-medium self-center">Máx. 5 entradas</span>
                )}
              </div>

              {/* Total + acciones */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] text-zinc-600">Subtotal: <span className="text-zinc-400">{fmt(subtotal)}</span></p>
                  <p className="text-[11px] text-zinc-600">Comisión ({tasaComision}%): <span className="text-zinc-400">{fmt(comision)}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-black text-white">{fmt(total)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearCart} className="btn-secondary text-xs py-2 px-3">
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={comprar}
                    disabled={comprando}
                    className="btn-primary text-xs py-2 px-3 disabled:opacity-50"
                  >
                    {comprando
                      ? <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                      : <ShoppingCart size={13} />}
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
