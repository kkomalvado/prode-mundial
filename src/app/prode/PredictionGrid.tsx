'use client'

import { useState, useTransition } from 'react'
import { savePrediction, saveTournamentPicks } from '@/actions/predictions'
import type { Match, Prediction, TournamentPick, TournamentSettings } from '@/types'
import { cn, formatMatchDate, isMatchLocked, stageName } from '@/lib/utils'

interface Props {
  matches: Match[]
  existingPredictions: Prediction[]
  existingPicks: TournamentPick | null
  settings: TournamentSettings | null
}

// Equipos clasificados al mundial (para sugerir en el picker)
const WORLD_CUP_TEAMS = [
  'Argentina','Brasil','Francia','España','Alemania','Portugal','Países Bajos',
  'Inglaterra','México','EEUU','Canadá','Uruguay','Colombia','Ecuador','Perú',
  'Venezuela','Marruecos','Senegal','Ghana','Nigeria','Costa Marfil','Camerún',
  'Sudáfrica','Egipto','Japón','Corea del Sur','Australia','Arabia Saudita',
  'Irán','Croacia','Bélgica','Suiza','Polonia','Serbia','Austria','Escocia',
  'Dinamarca','Suecia','Hungría','Turquía','Albania','Ucrania','Costa Rica',
  'Panamá','Jamaica','Honduras','Nueva Zelanda',
]

export default function PredictionGrid({ matches, existingPredictions, existingPicks, settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({})
  const [errorMap, setErrorMap] = useState<Record<string, string>>({})
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({})

  // Predicciones locales (para editar en UI sin recargar)
  const [predInputs, setPredInputs] = useState<Record<string, { home: string; away: string }>>(() => {
    const map: Record<string, { home: string; away: string }> = {}
    for (const p of existingPredictions) {
      map[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) }
    }
    return map
  })

  const [champion, setChampion] = useState(existingPicks?.champion_team ?? '')
  const [scorer, setScorer] = useState(existingPicks?.top_scorer ?? '')
  const [picksSaving, setPicksSaving] = useState(false)
  const [picksSaved, setPicksSaved] = useState(false)
  const [picksError, setPicksError] = useState<string | null>(null)

  const globalLocked = settings?.predictions_locked ?? false

  const handleScoreChange = (matchId: string, side: 'home' | 'away', value: string) => {
    if (!/^\d*$/.test(value)) return
    setPredInputs(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value }
    }))
  }

  const handleSavePrediction = (matchId: string) => {
    const input = predInputs[matchId]
    if (!input || input.home === '' || input.away === '') return

    setPendingMap(p => ({ ...p, [matchId]: true }))
    setErrorMap(p => ({ ...p, [matchId]: '' }))

    startTransition(async () => {
      const result = await savePrediction(matchId, Number(input.home), Number(input.away))
      setPendingMap(p => ({ ...p, [matchId]: false }))
      if (result.error) {
        setErrorMap(p => ({ ...p, [matchId]: result.error! }))
      } else {
        setSavedMap(p => ({ ...p, [matchId]: true }))
        setTimeout(() => setSavedMap(p => ({ ...p, [matchId]: false })), 2000)
      }
    })
  }

  const handleSavePicks = async () => {
    setPicksSaving(true)
    setPicksError(null)
    const result = await saveTournamentPicks(champion, scorer)
    setPicksSaving(false)
    if (result.error) { setPicksError(result.error); return }
    setPicksSaved(true)
    setTimeout(() => setPicksSaved(false), 2000)
  }

  // Agrupar partidos por etapa
  const stages = ['group', 'round_of_16', 'quarter', 'semi', 'third_place', 'final']
  const matchesByStage = stages
    .map(stage => ({
      stage,
      label: stageName(stage),
      matches: matches.filter(m => m.stage === stage),
    }))
    .filter(g => g.matches.length > 0)

  return (
    <div className="space-y-8">
      {/* Picks del torneo */}
      <div className="card p-5">
        <h2 className="text-lg font-bold text-amber-400 mb-4">🎯 Picks del Torneo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">🏆 Campeón del Mundial</label>
            {globalLocked ? (
              <p className="text-white font-medium">{champion || '—'}</p>
            ) : (
              <input
                list="teams-list"
                value={champion}
                onChange={e => setChampion(e.target.value)}
                placeholder="Escribí el equipo..."
                className="input w-full"
              />
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">⚽ Goleador del Mundial</label>
            {globalLocked ? (
              <p className="text-white font-medium">{scorer || '—'}</p>
            ) : (
              <input
                value={scorer}
                onChange={e => setScorer(e.target.value)}
                placeholder="Nombre del jugador..."
                className="input w-full"
              />
            )}
          </div>
        </div>
        <datalist id="teams-list">
          {WORLD_CUP_TEAMS.map(t => <option key={t} value={t} />)}
        </datalist>
        {!globalLocked && (
          <div className="mt-3 flex items-center gap-3">
            <button onClick={handleSavePicks} disabled={picksSaving} className="btn-primary">
              {picksSaving ? 'Guardando...' : 'Guardar picks'}
            </button>
            {picksSaved && <span className="text-green-400 text-sm">✓ Guardado</span>}
            {picksError && <span className="text-red-400 text-sm">{picksError}</span>}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Campeón: 15 pts · Goleador: 10 pts
        </p>
      </div>

      {/* Partidos por etapa */}
      {matchesByStage.map(({ stage, label, matches: stageMatches }) => (
        <div key={stage}>
          <h2 className="text-lg font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">
            {label}
          </h2>

          {/* Sub-agrupar por grupo si es fase de grupos */}
          {stage === 'group' ? (
            <GroupStageView
              matches={stageMatches}
              predInputs={predInputs}
              savedMap={savedMap}
              errorMap={errorMap}
              pendingMap={pendingMap}
              globalLocked={globalLocked}
              onScoreChange={handleScoreChange}
              onSave={handleSavePrediction}
            />
          ) : (
            <div className="space-y-3">
              {stageMatches.map(match => (
                <MatchRow
                  key={match.id}
                  match={match}
                  input={predInputs[match.id]}
                  saved={savedMap[match.id]}
                  error={errorMap[match.id]}
                  pending={pendingMap[match.id]}
                  globalLocked={globalLocked}
                  onScoreChange={handleScoreChange}
                  onSave={handleSavePrediction}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {matches.length === 0 && (
        <div className="card p-12 text-center text-slate-500">
          <div className="text-5xl mb-3">🗓️</div>
          <p>Los partidos aún no fueron cargados</p>
        </div>
      )}
    </div>
  )
}

// ─── Fase de grupos agrupada por grupo ───────────────────────────────────────
function GroupStageView(props: {
  matches: Match[]
  predInputs: Record<string, { home: string; away: string }>
  savedMap: Record<string, boolean>
  errorMap: Record<string, string>
  pendingMap: Record<string, boolean>
  globalLocked: boolean
  onScoreChange: (id: string, side: 'home' | 'away', val: string) => void
  onSave: (id: string) => void
}) {
  const groups = [...new Set(props.matches.map(m => m.group_name).filter(Boolean))].sort()

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group}>
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Grupo {group}</h3>
          <div className="space-y-2">
            {props.matches
              .filter(m => m.group_name === group)
              .map(match => (
                <MatchRow
                  key={match.id}
                  match={match}
                  input={props.predInputs[match.id]}
                  saved={props.savedMap[match.id]}
                  error={props.errorMap[match.id]}
                  pending={props.pendingMap[match.id]}
                  globalLocked={props.globalLocked}
                  onScoreChange={props.onScoreChange}
                  onSave={props.onSave}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Fila de partido individual ───────────────────────────────────────────────
function MatchRow({
  match, input, saved, error, pending, globalLocked, onScoreChange, onSave,
}: {
  match: Match
  input?: { home: string; away: string }
  saved?: boolean
  error?: string
  pending?: boolean
  globalLocked: boolean
  onScoreChange: (id: string, side: 'home' | 'away', val: string) => void
  onSave: (id: string) => void
}) {
  const locked = globalLocked || isMatchLocked(match)
  const hasInput = input && input.home !== '' && input.away !== ''

  return (
    <div className={cn(
      'card p-4 transition-all',
      locked && 'opacity-75',
      saved && 'ring-1 ring-green-500',
    )}>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Fecha */}
        <div className="hidden sm:block text-xs text-slate-500 w-36 shrink-0">
          {formatMatchDate(match.match_date)}
        </div>

        {/* Equipo local */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className="font-medium text-sm sm:text-base text-right">
            {match.home_team}
          </span>
          <span className="text-xl">{match.home_flag ?? '🏳️'}</span>
        </div>

        {/* Score input / resultado */}
        <div className="flex items-center gap-1.5 shrink-0">
          {match.status === 'finished' ? (
            <>
              <span className="text-xl font-bold text-amber-400 w-8 text-center">
                {match.home_score}
              </span>
              <span className="text-slate-500">–</span>
              <span className="text-xl font-bold text-amber-400 w-8 text-center">
                {match.away_score}
              </span>
            </>
          ) : locked ? (
            <>
              <span className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded text-sm font-bold text-center">
                {input?.home ?? '?'}
              </span>
              <span className="text-slate-500">–</span>
              <span className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded text-sm font-bold text-center">
                {input?.away ?? '?'}
              </span>
            </>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={input?.home ?? ''}
                onChange={e => onScoreChange(match.id, 'home', e.target.value)}
                onBlur={() => hasInput && onSave(match.id)}
                className="w-10 h-10 text-center font-bold text-lg bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-500"
                maxLength={2}
                placeholder="0"
              />
              <span className="text-slate-500">–</span>
              <input
                type="text"
                inputMode="numeric"
                value={input?.away ?? ''}
                onChange={e => onScoreChange(match.id, 'away', e.target.value)}
                onBlur={() => hasInput && onSave(match.id)}
                className="w-10 h-10 text-center font-bold text-lg bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-500"
                maxLength={2}
                placeholder="0"
              />
            </>
          )}
        </div>

        {/* Equipo visitante */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xl">{match.away_flag ?? '🏳️'}</span>
          <span className="font-medium text-sm sm:text-base">
            {match.away_team}
          </span>
        </div>

        {/* Estado */}
        <div className="hidden sm:flex items-center justify-end w-20 shrink-0">
          {match.status === 'live' && (
            <span className="badge bg-red-900 text-red-300 animate-pulse">🔴 LIVE</span>
          )}
          {match.status === 'upcoming' && locked && (
            <span className="badge bg-slate-700 text-slate-400">🔒</span>
          )}
          {saved && <span className="text-green-400 text-sm">✓</span>}
          {pending && <span className="text-slate-400 text-sm animate-pulse">...</span>}
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
      </div>

      {/* Fecha en mobile */}
      <div className="sm:hidden text-xs text-slate-500 mt-2 text-center">
        {formatMatchDate(match.match_date)}
      </div>
    </div>
  )
}
