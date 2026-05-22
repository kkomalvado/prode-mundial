'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Verificar que el usuario es admin
async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Sin permisos de admin')
  return { supabase, user }
}

// ─── USUARIOS ──────────────────────────────────────────────
export async function inviteUser(email: string, username: string, fullName: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { username, full_name: fullName, role: 'player' },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/prode`,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function listUsers() {
  await requireAdmin()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { users: [], error: error.message }
  return { users: data ?? [] }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}

// ─── PARTIDOS ───────────────────────────────────────────────
export async function updateMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  await requireAdmin()
  const supabase = createClient()

  const { error } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status: 'finished' })
    .eq('id', matchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/resultados')
  revalidatePath('/')
  revalidatePath('/mis-predicciones')
  return { success: true }
}

export async function createMatch(data: {
  home_team: string; away_team: string
  home_flag?: string; away_flag?: string
  match_date: string; stage: string
  group_name?: string; venue?: string
}) {
  await requireAdmin()
  const supabase = createClient()
  const { error } = await supabase.from('matches').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/prode')
  return { success: true }
}

export async function updateTournamentSettings(data: {
  champion_team?: string
  top_scorer?: string
  predictions_locked?: boolean
}) {
  await requireAdmin()
  const supabase = createClient()

  const { error } = await supabase
    .from('tournament_settings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

export async function getAdminStats() {
  await requireAdmin()
  const supabase = createClient()

  const [
    { count: totalUsers },
    { count: totalMatches },
    { count: finishedMatches },
    { count: totalPredictions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
  ])

  return { totalUsers, totalMatches, finishedMatches, totalPredictions }
}
