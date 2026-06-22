import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import QRModal from '../components/QRModal'
import PageHeader from '../components/ui/PageHeader'
import Alert from '../components/ui/Alert'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Ticket, ShoppingBag } from 'lucide-react'

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

const VENTA_BADGE = {
  PENDIENTE:  <span className="badge-yellow">⚠ Pendiente de pago</span>,
  CONFIRMADA: <span className="badge-blue">⚠ Confirmada — sin pagar</span>,
  PAGA:       null,
}

export default function MisEntradas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrEntrada, setQrEntrada] = useState(null)

  useEffect(() => {
    api.get(`/usuarios/${user.id}/entradas`)
      .then(r => setEntradas(r.data))
      .catch(() => setError('No se pudieron cargar las entradas'))
      .finally(() => setLoading(false))
  }, [user.id])

  const fmt = (n) => `$${(n || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        icon={Ticket}
        title="Mis entradas"
        subtitle={`${entradas.length} entrada${entradas.length !== 1 ? 's' : ''} en tu cuenta`}
      />

      <Alert type="error" message={error} className="mb-4" />

      {entradas.length === 0 && !loading && (
        <EmptyState
          icon={Ticket}
          title="No tenés entradas todavía"
          description="Comprá tu primera entrada y disfrutá el Mundial"
          action={
            <button onClick={() => navigate('/comprar')} className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={15} />
              Ir a comprar
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {entradas.map(entrada => {
          const sector = entrada.nombreSector || entrada.sector || 'D'
          const borderColor = SECTOR_BORDER[sector] || SECTOR_BORDER.D
          const estado = entrada.estado || 'EMITIDA'
          const estadoVenta = entrada.estadoVenta || 'PAGA'
          const ventaPaga = estadoVenta === 'PAGA'
          const canQr = estado === 'EMITIDA' && ventaPaga

          return (
            <div
              key={entrada.idEntrada}
              className={`list-row border-l-4 ${borderColor} flex items-center gap-4`}
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
                  {VENTA_BADGE[estadoVenta]}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-white">{fmt(entrada.precio)}</p>
                {canQr && (
                  <button
                    onClick={() => setQrEntrada(entrada)}
                    className="btn-primary text-xs px-3 py-1.5 mt-2 flex items-center gap-1.5"
                  >
                    <Ticket size={12} />
                    Ver QR
                  </button>
                )}
                {estado === 'EMITIDA' && !ventaPaga && (
                  <p className="text-yellow-500 text-xs mt-2">Pagá la compra para acceder al QR</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {qrEntrada && (
        <QRModal entrada={qrEntrada} onClose={() => setQrEntrada(null)} />
      )}
    </div>
  )
}
