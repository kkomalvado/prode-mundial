import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatMatchDate(dateStr: string) {
  const date = parseISO(dateStr)
  return format(date, "EEEE d 'de' MMMM · HH:mm", { locale: es })
}

export function formatMatchDateShort(dateStr: string) {
  const date = parseISO(dateStr)
  return format(date, 'd MMM · HH:mm', { locale: es })
}

export function timeUntilMatch(dateStr: string) {
  const date = parseISO(dateStr)
  return formatDistanceToNow(date, { locale: es, addSuffix: true })
}

export function isMatchLocked(match: { match_date: string; status: string }) {
  return match.status !== 'upcoming' || isPast(parseISO(match.match_date))
}

export function getMatchResult(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}

export function stageName(stage: string) {
  const names: Record<string, string> = {
    group: 'Fase de Grupos',
    round_of_16: 'Octavos de Final',
    quarter: 'Cuartos de Final',
    semi: 'Semifinales',
    third_place: 'Tercer Puesto',
    final: 'Gran Final',
  }
  return names[stage] ?? stage
}

export function pointsLabel(pts: number) {
  if (pts === 5) return { label: 'Exacto', color: 'text-yellow-400' }
  if (pts === 2) return { label: 'Resultado', color: 'text-green-400' }
  if (pts === 0) return { label: 'Fallo', color: 'text-red-400' }
  return { label: '—', color: 'text-gray-500' }
}
