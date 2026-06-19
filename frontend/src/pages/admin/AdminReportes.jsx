import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Trophy, BarChart2, Building2, AlertCircle, RefreshCw } from 'lucide-react'

const MEDALS = ['🥇', '🥈', '🥉']

function ProgressBar({ value, max, color = 'bg-green-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

function Section({ title, icon: Icon, children, color = 'text-green-400' }) {
  return (
    <div className="card">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Icon size={16} className={color} />
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function AdminReportes() {
  const [compradores, setCompradores] = useState([])
  const [eventosTop, setEventosTop] = useState([])
  const [estadisticas, setEstadisticas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fmt = (n) => `$${(n || 0).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const [cRes, eRes, esRes] = await Promise.all([
        api.get('/reportes/ranking-compradores'),
        api.get('/reportes/eventos-top'),
        api.get('/reportes/estadisticas-estadio'),
      ])
      setCompradores(cRes.data)
      setEventosTop(eRes.data)
      setEstadisticas(esRes.data)
    } catch {
      setError('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  // Field names come from the SQL functions (snake_case, passed through as-is by JdbcTemplate)
  const getVal = (row, keys) => {
    if (!row) return null
    for (const k of keys) if (row[k] !== undefined && row[k] !== null) return row[k]
    return null
  }

  const maxCompras = getVal(compradores[0], ['cant_entradas', 'totalCompras', 'cantidad']) ?? 1
  const maxRecaudacion = getVal(eventosTop[0], ['recaudacion', 'total']) ?? 1

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Reportes</h1>
          <p className="text-zinc-500 text-sm mt-1">Estadísticas del sistema de ticketing</p>
        </div>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Ranking compradores */}
      <Section title="Ranking de compradores" icon={Trophy} color="text-yellow-400">
        {compradores.length === 0 ? (
          <p className="text-zinc-500 text-sm">Sin datos disponibles</p>
        ) : (
          <div className="flex flex-col gap-3">
            {compradores.map((row, i) => {
              const nombre = getVal(row, ['nombre', 'email', 'nombreUsuario'])
              const total = getVal(row, ['cant_entradas', 'totalCompras', 'cantidad'])
              const monto = getVal(row, ['monto_total', 'totalGastado', 'monto'])
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{MEDALS[i] || `${i + 1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-200 truncate">{nombre ?? '—'}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {total != null && <span className="text-xs text-zinc-500">{total} compras</span>}
                        {monto != null && <span className="text-xs font-bold text-yellow-400">{fmt(monto)}</span>}
                      </div>
                    </div>
                    <ProgressBar value={total ?? 0} max={maxCompras} color={i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-zinc-400' : i === 2 ? 'bg-orange-700' : 'bg-zinc-700'} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Eventos top */}
      <Section title="Eventos con mayor recaudación" icon={BarChart2} color="text-blue-400">
        {eventosTop.length === 0 ? (
          <p className="text-zinc-500 text-sm">Sin datos disponibles</p>
        ) : (
          <div className="flex flex-col gap-3">
            {eventosTop.map((row, i) => {
              const partido = getVal(row, ['partido', 'nombre', 'evento'])
              const entradas = getVal(row, ['entradas_vendidas', 'entradasVendidas', 'entradas'])
              const recaudacion = getVal(row, ['recaudacion', 'total', 'monto'])
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{MEDALS[i] || `${i + 1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-200 truncate">{partido ?? '—'}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        {entradas != null && <span className="text-xs text-zinc-500">{entradas} entradas</span>}
                        {recaudacion != null && <span className="text-xs font-bold text-blue-400">{fmt(recaudacion)}</span>}
                      </div>
                    </div>
                    <ProgressBar value={recaudacion ?? 0} max={maxRecaudacion} color={i === 0 ? 'bg-blue-500' : 'bg-blue-900'} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Estadísticas por estadio */}
      <Section title="Estadísticas por estadio" icon={Building2} color="text-violet-400">
        {estadisticas.length === 0 ? (
          <p className="text-zinc-500 text-sm">Sin datos disponibles</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">#</th>
                  <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">Estadio</th>
                  <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">Eventos</th>
                  <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-2 pr-4">Entradas</th>
                  <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-2">Recaudación</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((row, i) => {
                  const estadio = getVal(row, ['estadio', 'nombre'])
                  const eventos = getVal(row, ['eventos', 'cantEventos'])
                  const entradas = getVal(row, ['entradas_vendidas', 'entradas', 'cantEntradas'])
                  const recaudacion = getVal(row, ['recaudacion', 'total'])
                  return (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 pr-4 text-zinc-600 font-mono text-xs">{i + 1}</td>
                      <td className="py-3 pr-4 font-medium text-zinc-200">{estadio ?? '—'}</td>
                      <td className="py-3 pr-4 text-right text-zinc-400">{eventos ?? '—'}</td>
                      <td className="py-3 pr-4 text-right text-zinc-400">{entradas ?? '—'}</td>
                      <td className="py-3 text-right font-bold text-violet-400">{recaudacion != null ? fmt(recaudacion) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}
