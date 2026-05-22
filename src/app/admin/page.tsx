import { createClient } from '@/lib/supabase/server'
import { updateTournamentSettings } from '@/actions/admin'
import type { TournamentSettings } from '@/types'
import { revalidatePath } from 'next/cache'

export default async function AdminPage() {
  const supabase = createClient()

  const [
    { count: totalUsers },
    { count: totalMatches },
    { count: finishedMatches },
    { count: totalPredictions },
    { data: settings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('predictions').select('*', { count: 'exact', head: true }),
    supabase.from('tournament_settings').select('*').single(),
  ])

  const s = settings as TournamentSettings | null

  async function handleLockToggle(formData: FormData) {
    'use server'
    const locked = formData.get('locked') === 'true'
    await updateTournamentSettings({ predictions_locked: locked })
    revalidatePath('/admin')
  }

  async function handleTournamentResult(formData: FormData) {
    'use server'
    const champion = formData.get('champion') as string
    const scorer = formData.get('scorer') as string
    await updateTournamentSettings({ champion_team: champion, top_scorer: scorer })
    revalidatePath('/admin')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-400">⚙️ Panel de Administración</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jugadores', value: totalUsers ?? 0, icon: '👥', color: 'text-blue-400' },
          { label: 'Partidos totales', value: totalMatches ?? 0, icon: '⚽', color: 'text-slate-300' },
          { label: 'Partidos jugados', value: finishedMatches ?? 0, icon: '✅', color: 'text-green-400' },
          { label: 'Predicciones', value: totalPredictions ?? 0, icon: '📝', color: 'text-amber-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Control de predicciones */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">🔒 Control de Predicciones</h2>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            s?.predictions_locked
              ? 'bg-red-900/50 text-red-300 border border-red-700'
              : 'bg-green-900/50 text-green-300 border border-green-700'
          }`}>
            {s?.predictions_locked ? '🔒 Predicciones CERRADAS' : '🔓 Predicciones ABIERTAS'}
          </div>

          <form action={handleLockToggle}>
            <input type="hidden" name="locked" value={s?.predictions_locked ? 'false' : 'true'} />
            <button
              type="submit"
              className={s?.predictions_locked ? 'btn-secondary' : 'btn-danger'}
            >
              {s?.predictions_locked ? 'Abrir predicciones' : 'Cerrar predicciones'}
            </button>
          </form>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Cerrá las predicciones antes de que empiece el primer partido
        </p>
      </div>

      {/* Resultado final del torneo */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">🏆 Resultado Final del Torneo</h2>
        <p className="text-sm text-slate-400 mb-4">
          Cargá el campeón y goleador cuando termine el torneo. Los puntos se calculan automáticamente.
        </p>
        <form action={handleTournamentResult} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">🏆 Campeón real</label>
              <input
                name="champion"
                defaultValue={s?.champion_team ?? ''}
                placeholder="País ganador..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">⚽ Goleador real</label>
              <input
                name="scorer"
                defaultValue={s?.top_scorer ?? ''}
                placeholder="Nombre del goleador..."
                className="input w-full"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Guardar y calcular puntos
          </button>
        </form>
      </div>
    </div>
  )
}
