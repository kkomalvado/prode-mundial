import { createClient } from '@/lib/supabase/server'
import PredictionGrid from './PredictionGrid'
import type { Match, Prediction, TournamentPick, TournamentSettings } from '@/types'
import { redirect } from 'next/navigation'

export default async function ProdePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: matches },
    { data: predictions },
    { data: picks },
    { data: settings },
  ] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('tournament_picks').select('*').eq('user_id', user.id).single(),
    supabase.from('tournament_settings').select('*').single(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-400">⚽ Mi Prode</h1>
        {settings?.predictions_locked && (
          <span className="badge bg-red-900 text-red-300 border border-red-700">
            🔒 Predicciones cerradas
          </span>
        )}
      </div>

      <PredictionGrid
        matches={(matches ?? []) as Match[]}
        existingPredictions={(predictions ?? []) as Prediction[]}
        existingPicks={(picks ?? null) as TournamentPick | null}
        settings={settings as TournamentSettings}
      />
    </div>
  )
}
