import { motion } from 'framer-motion'
import {
  TrendingUp, BookOpen, Award, MessageSquare, Brain, Star, Flame,
  Trophy, Target, GraduationCap, Lock,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { progressAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import PageHeader from '@/components/ui/PageHeader'
import LevelRing from '@/components/ui/LevelRing'
import CountUp from '@/components/ui/CountUp'
import { subjectMeta, ACCENTS, EASE, BOUNCE, LANGUAGE_GLYPH, computeGameStats } from '@/lib/design'
import type { ProgressOverview } from '@/types'
import type { LucideIcon } from 'lucide-react'

function Dial({ value, max, accent, label, icon: Icon, suffix, delay }: {
  value: number; max: number; accent: string; label: string; icon: LucideIcon; suffix?: string; delay: number
}) {
  const pct = Math.min((value / max) * 100, 100)
  const r = 38
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[104px] h-[104px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r={r} fill="none" strokeWidth="8" stroke="var(--border-soft)" />
          <motion.circle
            cx="52" cy="52" r={r} fill="none" strokeWidth="8" stroke={accent} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
            transition={{ duration: 1.1, delay, ease: EASE }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={13} style={{ color: accent }} className="mb-1" />
          <span className="font-display text-xl font-extrabold leading-none" style={{ color: 'var(--text-hi)' }}>
            <CountUp value={Math.round(value)} suffix={suffix} />
          </span>
        </div>
      </div>
      <span className="text-[11px] font-bold" style={{ color: 'var(--text-mid)' }}>{label}</span>
    </div>
  )
}

const BADGES: { icon: LucideIcon; label: string; test: (o?: ProgressOverview) => boolean; accent: string }[] = [
  { icon: Target,   label: 'First chat',   test: (o) => (o?.total_sessions || 0) >= 1,     accent: ACCENTS.violet },
  { icon: BookOpen, label: '10 sessions',  test: (o) => (o?.total_sessions || 0) >= 10,    accent: ACCENTS.cyan   },
  { icon: Brain,    label: 'Quiz taker',   test: (o) => (o?.quizzes_completed || 0) >= 1,  accent: ACCENTS.amber  },
  { icon: Star,     label: 'High scorer',  test: (o) => (o?.avg_quiz_score || 0) >= 80,    accent: ACCENTS.rose   },
  { icon: Flame,    label: '7-day streak', test: (o) => (o?.streak_days || 0) >= 7,        accent: ACCENTS.mint   },
  { icon: Trophy,   label: 'Ten quizzes',  test: (o) => (o?.quizzes_completed || 0) >= 10, accent: ACCENTS.violet },
]

export default function ProgressPage() {
  const { user } = useAuthStore()
  const { data: overview, isLoading } = useQuery<ProgressOverview>({
    queryKey: ['progress-overview'],
    queryFn: async () => {
      const res = await progressAPI.overview()
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-9 h-9 rounded-full animate-spin" style={{ border: '3px solid var(--border-soft)', borderTopColor: ACCENTS.violet }} />
      </div>
    )
  }

  const isEmpty = !overview || overview.total_sessions === 0
  const game = computeGameStats(overview)
  const language = overview?.preferred_language || user?.preferred_language || 'English'
  const level = overview?.explanation_level || user?.explanation_level || 'Intermediate'

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-10">
        <PageHeader eyebrow="Progress" title="How it's going" subtitle="Sessions, scores, and the subjects you keep returning to." icon={TrendingUp} accent={ACCENTS.mint} />

        {/* Level card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }}
          className="card p-6 mb-5 flex items-center gap-5"
        >
          <LevelRing level={game.level} progress={game.progress} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="font-display text-lg font-extrabold" style={{ color: 'var(--text-hi)' }}>{game.title}</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-mid)' }}>
                <CountUp value={game.xpIntoLevel} /> / {game.xpForNextLevel} XP
              </p>
            </div>
            <div className="xp-track"><div className="xp-fill h-full" style={{ width: `${game.progress}%` }} /></div>
          </div>
        </motion.div>

        {isEmpty ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: ACCENTS.mint }}>
              <GraduationCap size={22} color="#3A3226" />
            </div>
            <h3 className="font-display text-2xl font-extrabold mb-2" style={{ color: 'var(--text-hi)' }}>Nothing to chart yet</h3>
            <p className="text-sm max-w-sm mx-auto font-semibold" style={{ color: 'var(--text-mid)' }}>Ask a few questions and take a quiz. Your numbers show up here.</p>
          </div>
        ) : (
          <>
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }} className="card p-8 mb-5 flex flex-wrap gap-8 justify-center">
              <Dial value={overview.total_sessions} max={50} accent={ACCENTS.violet} label="Sessions" icon={MessageSquare} delay={0.1} />
              <Dial value={overview.quizzes_completed} max={20} accent={ACCENTS.cyan} label="Quizzes" icon={Brain} delay={0.2} />
              <Dial value={overview.avg_quiz_score} max={100} accent={ACCENTS.amber} label="Avg score" icon={Star} suffix="%" delay={0.3} />
              <Dial value={overview.streak_days} max={30} accent={ACCENTS.rose} label="Day streak" icon={Flame} delay={0.4} />
            </motion.section>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Language', value: language, glyph: LANGUAGE_GLYPH[language], accent: ACCENTS.cyan },
                { label: 'Depth', value: level, glyph: null, accent: ACCENTS.amber },
                { label: 'Streak', value: `${overview.streak_days} days`, glyph: null, accent: ACCENTS.rose, icon: Flame },
              ].map((s) => (
                <div key={s.label} className="card card-interactive p-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-extrabold" style={{ background: s.accent, color: '#3A3226' }}>
                    {s.glyph ?? (s.icon ? <s.icon size={15} /> : null)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase" style={{ letterSpacing: '0.1em', color: 'var(--text-lo)' }}>{s.label}</p>
                    <p className="text-xs font-extrabold truncate mt-0.5" style={{ color: 'var(--text-hi)' }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {overview.subject_stats?.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ease: EASE }} className="card p-6 mb-5">
                <div className="flex items-center gap-2.5 mb-6">
                  <BookOpen size={14} style={{ color: ACCENTS.cyan }} />
                  <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>Subject breakdown</h2>
                </div>
                <div className="space-y-5">
                  {overview.subject_stats.map((stat, i) => {
                    const meta = subjectMeta(stat.subject)
                    const Icon = meta.icon
                    return (
                      <motion.div key={stat.subject} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05, ease: EASE }} className="flex items-center gap-3.5">
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.accent }}>
                          <Icon size={15} color="#3A3226" strokeWidth={2.5} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3 mb-2">
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-hi)' }}>{stat.subject}</p>
                            <p className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--text-lo)' }}>
                              {stat.sessions} sessions · {stat.quizzes_taken} quizzes
                            </p>
                          </div>
                          <div className="xp-track" style={{ height: 6 }}>
                            <motion.div className="h-full rounded-full" style={{ background: meta.accent }} initial={{ width: 0 }} animate={{ width: `${Math.min((stat.sessions / 10) * 100, 100)}%` }} transition={{ duration: 0.9, delay: 0.3 + i * 0.05, ease: EASE }} />
                          </div>
                        </div>
                        {stat.avg_quiz_score != null && (
                          <span className="text-xs font-extrabold flex-shrink-0 w-10 text-right" style={{ color: 'var(--text-hi)' }}>{stat.avg_quiz_score.toFixed(0)}%</span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </>
        )}

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ease: EASE }} className="card p-6 mt-5">
          <div className="flex items-center gap-2.5 mb-6">
            <Award size={14} style={{ color: ACCENTS.amber }} />
            <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>Achievements</h2>
            <span className="text-[10px] font-bold ml-auto" style={{ color: 'var(--text-lo)' }}>
              {BADGES.filter((b) => b.test(overview)).length} of {BADGES.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map((badge, i) => {
              const unlocked = badge.test(overview)
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={unlocked ? { ...BOUNCE, delay: 0.3 + i * 0.05 } : { delay: 0.3 + i * 0.05, ease: EASE }}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-2xl text-center"
                  style={{ background: unlocked ? badge.accent : 'var(--surface-2)', border: `1px solid ${unlocked ? badge.accent : 'var(--border-soft)'}`, opacity: unlocked ? 1 : 0.55 }}
                >
                  {unlocked ? <badge.icon size={18} color="#3A3226" strokeWidth={2.5} /> : <Lock size={16} style={{ color: 'var(--text-lo)' }} />}
                  <span className="text-[10px] font-bold leading-tight" style={{ color: unlocked ? '#3A3226' : 'var(--text-mid)' }}>{badge.label}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
