import {
  RadioTower, Cpu, Zap, Cog, Building2, Brain, Bot, Network,
  Binary, Database, MonitorCog, Boxes, Share2, BookMarked,
  type LucideIcon,
} from 'lucide-react'

/* ─── Palette ────────────────────────────────────────────────
 * Mirrors styles/tokens.css for the places that need a literal
 * value (SVG fills, inline animation targets).
 * ──────────────────────────────────────────────────────────── */
export const C = {
  // Must stay in step with --brand in tokens.css; this value is dark
  // enough to carry white text at label sizes.
  brand:     '#7450F0',
  brandDark: '#5734C9',
  mint:      '#1FC28A',
  coral:     '#FF6257',
  sun:       '#FFB020',
  sky:       '#35B6F5',
  ink:       '#221F38',
  white:     '#FFFFFF',
} as const

/** rgba() from a hex, for tinted fills. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/* ─── Subjects ───────────────────────────────────────────── */

export interface SubjectMeta {
  icon: LucideIcon
  colour: string
  short: string
}

export const SUBJECT_META: Record<string, SubjectMeta> = {
  'Electronics & Communication': { icon: RadioTower, colour: C.sky,   short: 'Electronics' },
  'Computer Science':            { icon: Cpu,        colour: C.brand, short: 'CS' },
  'Electrical Engineering':      { icon: Zap,        colour: C.sun,   short: 'Electrical' },
  'Mechanical Engineering':      { icon: Cog,        colour: C.coral, short: 'Mechanical' },
  'Civil Engineering':           { icon: Building2,  colour: C.mint,  short: 'Civil' },
  'Artificial Intelligence':     { icon: Brain,      colour: C.brand, short: 'AI' },
  'Machine Learning':            { icon: Bot,        colour: C.sky,   short: 'ML' },
  'Data Structures':             { icon: Network,    colour: C.mint,  short: 'Data Structures' },
  'Algorithms':                  { icon: Binary,     colour: C.sun,   short: 'Algorithms' },
  'DBMS':                        { icon: Database,   colour: C.coral, short: 'DBMS' },
  'Operating Systems':           { icon: MonitorCog, colour: C.brand, short: 'OS' },
  'OOP':                         { icon: Boxes,      colour: C.sky,   short: 'OOP' },
  'Computer Networks':           { icon: Share2,     colour: C.mint,  short: 'Networks' },
}

const FALLBACK: SubjectMeta = { icon: BookMarked, colour: C.brand, short: 'General' }

export function subjectMeta(subject?: string | null): SubjectMeta {
  if (!subject) return FALLBACK
  return SUBJECT_META[subject] ?? FALLBACK
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
export const LEVEL_BARS: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 }

/* ─── Motion ─────────────────────────────────────────────── */
export const EASE = [0.22, 1, 0.36, 1] as const
export const BUMP = { type: 'spring', stiffness: 380, damping: 22 } as const
export const SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const

/* ─── XP and levels ──────────────────────────────────────────
 * Derived from stats the backend already returns, so progress
 * feels like progress without a schema change.
 * ──────────────────────────────────────────────────────────── */

const XP_PER_MESSAGE = 2
const XP_PER_SESSION = 10
const XP_PER_QUIZ = 25
const XP_PER_STREAK_DAY = 5
/** Must match XP_PER_LOGIN_DAY in backend/app/services/streak_service.py. */
export const XP_PER_LOGIN_DAY = 10

export interface OverviewLike {
  total_messages?: number
  total_sessions?: number
  quizzes_completed?: number
  streak_days?: number
  /** Distinct days signed in. Only grows, so this XP is never lost. */
  login_days?: number
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
    (o.login_days || 0) * XP_PER_LOGIN_DAY +
    (o.streak_days || 0) * XP_PER_STREAK_DAY +
    scoreBonus
  )
}

export function levelTitle(level: number): string {
  if (level >= 20) return 'Legend'
  if (level >= 15) return 'Pro'
  if (level >= 10) return 'Whiz'
  if (level >= 6) return 'Learner'
  if (level >= 3) return 'Sprout'
  return 'Newbie'
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
