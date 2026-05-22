import { createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry } from '@/types'
import { cn } from '@/lib/utils'

export const revalidate = 60 // revalidar cada minuto

const medalColors: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
}

export default async function HomePage() {
  const supabase = createClient()

  const [{ data: entries }, { data: settings }] = await Promise.all([
    supabase.from('leaderboard').select('*').order('rank', { ascending: true }),
    supabase.from('tournament_settings').select('*').single(),
  ])

  const leaderboard = (entries ?? []) as LeaderboardEntry[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-amber-400">🏆 Tabla de Posiciones</h1>
        <p className="text-slate-400 mt-2">{settings?.tournament_name ?? 'Mundial 2026'}</p>
      </div>

      {/* Puntuación */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        {[
          { label: 'Marcador exacto', pts: '5 pts', color: 'text-yellow-400' },
          { label: 'Resultado correcto', pts: '2 pts', color: 'text-green-400' },
          { label: 'Campeón acertado', pts: '15 pts', color: 'text-amber-400' },
        ].map(({ label, pts, color }) => (
          <div key={label} className="card p-3">
            <div className={cn('text-lg font-bold', color)}>{pts}</div>
            <div className="text-slate-400 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {leaderboard.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <div className="text-5xl mb-3">⚽</div>
          <p>El torneo todavía no comenzó. ¡Sumate al prode!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-sm">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Jugador</th>
                <th className="text-center px-3 py-3 hidden sm:table-cell">Exactos</th>
                <th className="text-center px-3 py-3 hidden sm:table-cell">Correctos</th>
                <th className="text-right px-4 py-3 font-semibold">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'border-t border-slate-700 transition-colors',
                    i < 3 && 'hover:bg-slate-750',
                  )}
                >
                  <td className="px-4 py-3">
                    <span className={cn('font-bold', medalColors[entry.rank] ?? 'text-slate-400')}>
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-amber-400">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{entry.username}</div>
                        {entry.full_name && (
                          <div className="text-xs text-slate-500">{entry.full_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-yellow-400 font-medium hidden sm:table-cell">
                    {entry.exact_scores}
                  </td>
                  <td className="px-3 py-3 text-center text-green-400 font-medium hidden sm:table-cell">
                    {entry.correct_results}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-amber-400">{entry.total_points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
