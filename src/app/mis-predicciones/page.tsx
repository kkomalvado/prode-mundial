import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Match, Prediction, TournamentPick } from '@/types'
import { cn, formatMatchDateShort, pointsLabel, stageName } from '@/lib/utils'

export default async function MisPrediccionesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: matchesData },
    { data: predictionsData },
    { data: picks },
    { data: settings },
  ] = await Promise.all([
    supabase.from('matches').select('*').order('match_date'),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('tournament_picks').select('*').eq('user_id', user.id).single(),
    supabase.from('tournament_settings').select('*').single(),
  ])

  const matches = (matchesData ?? []) as Match[]
  const predictions = (predictionsData ?? []) as Prediction[]
  const myPicks = picks as TournamentPick | null

  const predMap = new Map(predictions.map(p => [p.match_id, p]))

  const totalPoints = predictions.reduce((sum, p) => sum + p.points_earned, 0)
    + (myPicks?.champion_points ?? 0)
    + (myPicks?.scorer_points ?? 0)

  const exactScores = predictions.filter(p => p.points_earned === 5).length
  const correctResults = predictions.filter(p => p.points_earned === 2).length
  const finishedMatches = matches.filter(m => m.status === 'finished')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-400">📋 Mis Predicciones</h1>

      {/* Resumen personal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Puntos totales', value: totalPoints, color: 'text-amber-400', icon: '🏅' },
          { label: 'Marcadores exactos', value: exactScores, color: 'text-yellow-400', icon: '🎯' },
          { label: 'Resultados correctos', value: correctResults, color: 'text-green-400', icon: '✓' },
          { label: 'Predicciones hechas', value: predictions.length, color: 'text-slate-300', icon: '📝' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={cn('text-2xl font-bold', color)}>{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Picks del torneo */}
      <div className="card p-4">
        <h2 className="text-base font-semibold text-slate-300 mb-3">🎯 Mis Picks del Torneo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
            <div>
              <p className="text-xs text-slate-500">🏆 Campeón</p>
              <p className="font-semibold">{myPicks?.champion_team || '—'}</p>
            </div>
            {myPicks?.champion_points !== undefined && myPicks.champion_points > 0 && (
              <span className="text-amber-400 font-bold">+{myPicks.champion_points} pts</span>
            )}
            {settings?.champion_team && myPicks?.champion_team && myPicks.champion_team !== settings.champion_team && (
              <span className="text-red-400 text-sm">✗</span>
            )}
          </div>
          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
            <div>
              <p className="text-xs text-slate-500">⚽ Goleador</p>
              <p className="font-semibold">{myPicks?.top_scorer || '—'}</p>
            </div>
            {myPicks?.scorer_points !== undefined && myPicks.scorer_points > 0 && (
              <span className="text-amber-400 font-bold">+{myPicks.scorer_points} pts</span>
            )}
          </div>
        </div>
      </div>

      {/* Predicciones por etapa */}
      {['group','round_of_16','quarter','semi','third_place','final'].map(stage => {
        const stageMatches = finishedMatches.filter(m => m.stage === stage)
        if (stageMatches.length === 0) return null

        return (
          <div key={stage}>
            <h2 className="text-base font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-1">
              {stageName(stage)}
            </h2>
            <div className="space-y-2">
              {stageMatches.map(match => {
                const pred = predMap.get(match.id)
                const { label, color } = pointsLabel(pred?.points_earned ?? -1)

                return (
                  <div key={match.id} className="card p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-24 shrink-0 hidden sm:block">
                        {formatMatchDateShort(match.match_date)}
                      </span>

                      {/* Partido real */}
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm">{match.home_flag}</span>
                        <span className="text-sm font-medium">{match.home_team}</span>
                        <span className="font-bold text-amber-400 mx-1">
                          {match.home_score} – {match.away_score}
                        </span>
                        <span className="text-sm font-medium">{match.away_team}</span>
                        <span className="text-sm">{match.away_flag}</span>
                      </div>

                      {/* Mi predicción */}
                      <div className="flex items-center gap-2 shrink-0">
                        {pred ? (
                          <>
                            <span className="text-xs text-slate-400">
                              Mi pred: <span className="text-white font-medium">
                                {pred.predicted_home}–{pred.predicted_away}
                              </span>
                            </span>
                            <span className={cn('badge font-semibold', color,
                              pred.points_earned === 5 ? 'bg-yellow-900/40' :
                              pred.points_earned === 2 ? 'bg-green-900/40' : 'bg-red-900/40'
                            )}>
                              {pred.points_earned > 0 ? `+${pred.points_earned}` : label}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-600">Sin predicción</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {finishedMatches.length === 0 && (
        <div className="card p-12 text-center text-slate-500">
          <div className="text-5xl mb-3">⏳</div>
          <p>Tus resultados aparecerán cuando terminen los partidos</p>
        </div>
      )}
    </div>
  )
}
