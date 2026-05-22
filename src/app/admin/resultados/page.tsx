'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateMatchResult } from '@/actions/admin'
import type { Match } from '@/types'
import { cn, formatMatchDate } from '@/lib/utils'

export default function ResultadosPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })
    setMatches((data ?? []) as Match[])
    setLoading(false)
  }

  const handleSave = async (matchId: string) => {
    const input = scoreInputs[matchId]
    if (!input || input.home === '' || input.away === '') return

    setSaving(s => ({ ...s, [matchId]: true }))
    setErrors(e => ({ ...e, [matchId]: '' }))

    const result = await updateMatchResult(matchId, Number(input.home), Number(input.away))
    setSaving(s => ({ ...s, [matchId]: false }))

    if (result.error) {
      setErrors(e => ({ ...e, [matchId]: result.error! }))
    } else {
      setSaved(s => ({ ...s, [matchId]: true }))
      setMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, home_score: Number(input.home), away_score: Number(input.away), status: 'finished' }
          : m
      ))
      setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
    }
  }

  const displayMatches = filter === 'upcoming'
    ? matches.filter(m => m.status !== 'finished')
    : matches

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-400">⚽ Cargar Resultados</h1>
        <div className="flex gap-2">
          {(['upcoming', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-sm', filter === f ? 'btn-primary' : 'btn-secondary')}
            >
              {f === 'upcoming' ? 'Sin resultado' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-400">Cargando partidos...</div>
      ) : displayMatches.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">No hay partidos pendientes</div>
      ) : (
        <div className="space-y-2">
          {displayMatches.map(match => (
            <div key={match.id} className={cn('card p-4', match.status === 'finished' && 'opacity-60')}>
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="text-xs text-slate-500 w-full sm:w-40 shrink-0">
                  {formatMatchDate(match.match_date)}
                  <div className="text-slate-600">{match.stage} {match.group_name ? `· Grupo ${match.group_name}` : ''}</div>
                </div>

                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="font-medium">{match.home_team}</span>
                  <span className="text-xl">{match.home_flag}</span>
                </div>

                {/* Score inputs */}
                <div className="flex items-center gap-2 shrink-0">
                  {match.status === 'finished' ? (
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 bg-green-900/40 border border-green-700 rounded-lg flex items-center justify-center font-bold text-green-300">
                        {match.home_score}
                      </span>
                      <span className="text-slate-500">–</span>
                      <span className="w-10 h-10 bg-green-900/40 border border-green-700 rounded-lg flex items-center justify-center font-bold text-green-300">
                        {match.away_score}
                      </span>
                      <span className="text-green-400 text-sm ml-1">✓</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scoreInputs[match.id]?.home ?? ''}
                        onChange={e => {
                          if (!/^\d*$/.test(e.target.value)) return
                          setScoreInputs(p => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))
                        }}
                        className="w-10 h-10 text-center font-bold bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-500"
                        maxLength={2}
                        placeholder="0"
                      />
                      <span className="text-slate-500">–</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scoreInputs[match.id]?.away ?? ''}
                        onChange={e => {
                          if (!/^\d*$/.test(e.target.value)) return
                          setScoreInputs(p => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))
                        }}
                        className="w-10 h-10 text-center font-bold bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-500"
                        maxLength={2}
                        placeholder="0"
                      />
                      <button
                        onClick={() => handleSave(match.id)}
                        disabled={saving[match.id]}
                        className="btn-primary py-2 text-sm ml-1"
                      >
                        {saving[match.id] ? '...' : 'Guardar'}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xl">{match.away_flag}</span>
                  <span className="font-medium">{match.away_team}</span>
                </div>
              </div>

              {saved[match.id] && (
                <p className="text-green-400 text-sm mt-2">
                  ✅ Resultado guardado y puntos calculados automáticamente
                </p>
              )}
              {errors[match.id] && (
                <p className="text-red-400 text-sm mt-2">❌ {errors[match.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
