'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isMatchLocked } from '@/lib/utils'
import type { Match } from '@/types'

export async function savePrediction(
  matchId: string,
  predictedHome: number,
  predictedAway: number
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verificar que el partido no esté bloqueado
  const { data: match } = await supabase
    .from('matches')
    .select('match_date, status')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Partido no encontrado' }
  if (isMatchLocked(match as Match)) return { error: 'Las predicciones están cerradas para este partido' }

  // Verificar si predicciones globalmente bloqueadas
  const { data: settings } = await supabase
    .from('tournament_settings')
    .select('predictions_locked')
    .single()

  if (settings?.predictions_locked) return { error: 'Las predicciones están cerradas' }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      match_id: matchId,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' })

  if (error) return { error: error.message }

  revalidatePath('/prode')
  revalidatePath('/mis-predicciones')
  return { success: true }
}

export async function saveTournamentPicks(championTeam: string, topScorer: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: settings } = await supabase
    .from('tournament_settings')
    .select('predictions_locked')
    .single()

  if (settings?.predictions_locked) return { error: 'Las predicciones están cerradas' }

  const { error } = await supabase
    .from('tournament_picks')
    .upsert({
      user_id: user.id,
      champion_team: championTeam,
      top_scorer: topScorer,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/prode')
  revalidatePath('/mis-predicciones')
  return { success: true }
}

export async function getUserPredictions() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { predictions: [], picks: null }

  const [{ data: predictions }, { data: picks }] = await Promise.all([
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('tournament_picks').select('*').eq('user_id', user.id).single(),
  ])

  return { predictions: predictions ?? [], picks: picks ?? null }
}
