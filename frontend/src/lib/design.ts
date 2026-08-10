import {
  RadioTower, Cpu, Zap, Cog, Building2, Brain, Bot, Network,
  Binary, Database, MonitorCog, Boxes, Share2, BookMarked,
  type LucideIcon,
} from 'lucide-react'

export const ACCENTS = {
  violet: '#B4A3D6', // lavender
  cyan:   '#7FADC2', // sky
  amber:  '#E0A85C', // honey
  rose:   '#D98F72', // clay
  mint:   '#8FAE7D', // sage
} as const

export type AccentKey = keyof typeof ACCENTS
export const ACCENT_CYCLE: AccentKey[] = ['violet', 'cyan', 'amber', 'rose', 'mint']
export function accentAt(i: number): string {
  return ACCENTS[ACCENT_CYCLE[i % ACCENT_CYCLE.length]]
}

/** rgba() string from a hex accent, for tinted fills and borders. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

interface SubjectMeta {
  icon: LucideIcon
  accent: string
}

export const SUBJECT_META: Record<string, SubjectMeta> = {
  'Electronics & Communication': { icon: RadioTower, accent: ACCENTS.cyan   },
  'Computer Science':            { icon: Cpu,        accent: ACCENTS.violet },
  'Electrical Engineering':      { icon: Zap,        accent: ACCENTS.amber  },
  'Mechanical Engineering':      { icon: Cog,        accent: ACCENTS.rose   },
  'Civil Engineering':           { icon: Building2,  accent: ACCENTS.mint   },
  'Artificial Intelligence':     { icon: Brain,      accent: ACCENTS.violet },
  'Machine Learning':            { icon: Bot,        accent: ACCENTS.cyan   },
  'Data Structures':             { icon: Network,    accent: ACCENTS.mint   },
  'Algorithms':                  { icon: Binary,     accent: ACCENTS.amber  },
  'DBMS':                        { icon: Database,   accent: ACCENTS.rose   },
  'Operating Systems':           { icon: MonitorCog, accent: ACCENTS.violet },
  'OOP':                         { icon: Boxes,      accent: ACCENTS.cyan   },
  'Computer Networks':           { icon: Share2,     accent: ACCENTS.mint   },
}

export function subjectMeta(subject?: string | null): SubjectMeta {
  if (!subject) return { icon: BookMarked, accent: ACCENTS.violet }
  return SUBJECT_META[subject] ?? { icon: BookMarked, accent: ACCENTS.violet }
}

export const SUBJECTS = Object.keys(SUBJECT_META)

export const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Tamil',
  'Telugu', 'Marathi', 'French', 'Spanish',
] as const

export const LANGUAGE_GLYPH: Record<string, string> = {
  English: 'Aa', Hindi: 'अ', Bengali: 'অ', Tamil: 'அ',
  Telugu: 'అ', Marathi: 'म', French: 'Éé', Spanish: 'Ññ',
}

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

/** Bar count encodes depth — one filled bar per level of difficulty. */
export const LEVEL_BARS: Record<string, number> = {
  Beginner: 1, Intermediate: 2, Advanced: 3,
}

export const EASE = [0.22, 1, 0.36, 1] as const
export const SPRING = { type: 'spring', stiffness: 340, damping: 28 } as const
export const BOUNCE = { type: 'spring', stiffness: 260, damping: 16 } as const

/* ─────────────────────────────────────────────────────────
 * Gamification — XP, levels, ranks. Derived entirely from
 * stats the backend already returns, so no schema change
 * is needed to make progress feel like progress.
 * ───────────────────────────────────────────────────────── */

const XP_PER_MESSAGE = 2
const XP_PER_SESSION = 10
const XP_PER_QUIZ = 25
const XP_PER_STREAK_DAY = 5

export interface OverviewLike {
  total_messages?: number
  total_sessions?: number
  quizzes_completed?: number
  streak_days?: number
  avg_quiz_score?: number
}

export interface GameStats {
  level: number
  title: string
  totalXP: number
  xpIntoLevel: number
  xpForNextLevel: number
  progress: number
}

export function totalXP(o?: OverviewLike): number {
  if (!o) return 0
  const scoreBonus = o.quizzes_completed ? Math.round(o.avg_quiz_score || 0) : 0
  return (
    (o.total_messages || 0) * XP_PER_MESSAGE +
    (o.total_sessions || 0) * XP_PER_SESSION +
    (o.quizzes_completed || 0) * XP_PER_QUIZ +
    (o.streak_days || 0) * XP_PER_STREAK_DAY +
    scoreBonus
  )
}

export function levelTitle(level: number): string {
  if (level >= 20) return 'Sage'
  if (level >= 15) return 'Scholar'
  if (level >= 10) return 'Bookworm'
  if (level >= 6) return 'Apprentice'
  if (level >= 3) return 'Sprout'
  return 'Newcomer'
}

/** Each level costs a bit more than the last — quick early wins, real ones later. */
export function computeGameStats(o?: OverviewLike): GameStats {
  const xp = totalXP(o)
  let level = 1
  let cum = 0
  let step = 150
  while (xp >= cum + step) {
    cum += step
    level += 1
    step += 50
  }
  const xpIntoLevel = xp - cum
  return {
    level,
    title: levelTitle(level),
    totalXP: xp,
    xpIntoLevel,
    xpForNextLevel: step,
    progress: Math.min((xpIntoLevel / step) * 100, 100),
  }
}
