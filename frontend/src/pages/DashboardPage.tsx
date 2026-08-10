import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, Send, Brain, Star, ArrowUpRight,
  Layers, TrendingUp, BookOpen, Sparkles, Lock,
  Target, Flame, Trophy, NotebookPen,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { progressAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import Mascot from '@/components/ui/Mascot'
import CountUp from '@/components/ui/CountUp'
import ConfettiBurst from '@/components/ui/ConfettiBurst'
import StreakFlame from '@/components/ui/StreakFlame'
import { subjectMeta, tint, ACCENTS, EASE, BOUNCE, computeGameStats } from '@/lib/design'
import type { ProgressOverview } from '@/types'
import type { LucideIcon } from 'lucide-react'

const STATS: { key: keyof ProgressOverview; icon: LucideIcon; label: string; accent: string; suffix?: string }[] = [
  { key: 'total_sessions',    icon: MessageSquare, label: 'Sessions',  accent: ACCENTS.violet },
  { key: 'total_messages',    icon: Send,          label: 'Messages',  accent: ACCENTS.cyan   },
  { key: 'quizzes_completed', icon: Brain,         label: 'Quizzes',   accent: ACCENTS.amber  },
  { key: 'avg_quiz_score',    icon: Star,          label: 'Avg score', accent: ACCENTS.rose, suffix: '%' },
]

const QUESTS: { to: string; icon: LucideIcon; label: string; desc: string; xp: number; accent: string }[] = [
  { to: '/chat',       icon: MessageSquare, label: 'Ask a question', desc: 'Explanations in your language', xp: 10, accent: ACCENTS.violet },
  { to: '/quiz',       icon: Brain,         label: 'Take a quiz',    desc: 'MCQs on any topic',             xp: 25, accent: ACCENTS.amber  },
  { to: '/flashcards', icon: Layers,        label: 'Review cards',   desc: 'Spaced repetition deck',        xp: 15, accent: ACCENTS.rose   },
  { to: '/progress',   icon: TrendingUp,    label: 'Check progress', desc: 'Subject-wise breakdown',        xp: 5,  accent: ACCENTS.mint   },
]

const BADGES: { icon: LucideIcon; label: string; test: (o?: ProgressOverview) => boolean; accent: string }[] = [
  { icon: Target,  label: 'First chat',   test: (o) => (o?.total_sessions || 0) >= 1,     accent: ACCENTS.violet },
  { icon: Brain,   label: 'Quiz taker',   test: (o) => (o?.quizzes_completed || 0) >= 1,  accent: ACCENTS.amber  },
  { icon: Star,    label: 'High scorer',  test: (o) => (o?.avg_quiz_score || 0) >= 80,    accent: ACCENTS.rose   },
  { icon: Flame,   label: '7-day streak', test: (o) => (o?.streak_days || 0) >= 7,        accent: ACCENTS.mint   },
  { icon: Trophy,  label: 'Ten quizzes',  test: (o) => (o?.quizzes_completed || 0) >= 10, accent: ACCENTS.cyan   },
  { icon: BookOpen,label: '10 sessions',  test: (o) => (o?.total_sessions || 0) >= 10,    accent: ACCENTS.violet },
]

const MASCOT_NOTES = [
  "Small steps count. One question today is one more than yesterday.",
  "You're doing great — a streak is just showing up, twice in a row.",
  "Stuck on something? Ask me to explain it a different way.",
  "Consistency beats intensity. Ten minutes daily adds up fast.",
]

function StatCard({ icon: Icon, label, value, suffix, accent, index }: {
  icon: LucideIcon; label: string; value: number; suffix?: string; accent: string; index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.05 + index * 0.06, ease: EASE, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="card card-interactive p-5"
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: tint(accent, 0.22) }}>
        <Icon size={17} style={{ color: accent }} strokeWidth={2.25} />
      </div>
      <p className="font-display text-3xl font-semibold leading-none" style={{ color: 'var(--text-hi)' }}>
        {value === 0 && suffix ? '—' : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className="text-xs font-bold mt-1.5" style={{ color: 'var(--text-mid)' }}>{label}</p>
    </motion.div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [celebrate, setCelebrate] = useState(0)

  const { data: overview } = useQuery<ProgressOverview>({
    queryKey: ['progress-overview'],
    queryFn: async () => {
      const res = await progressAPI.overview()
      return res.data
    },
  })

  const game = computeGameStats(overview)
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'there'
  const isEmpty = !overview || overview.total_sessions === 0
  const unlockedCount = BADGES.filter((b) => b.test(overview)).length
  const stars = Math.max(1, Math.min(5, Math.round(((overview?.avg_quiz_score || 0) / 100) * 5) || 1))
  const note = MASCOT_NOTES[game.level % MASCOT_NOTES.length]

  useEffect(() => {
    if (!overview) return
    const key = 'edubot-last-level'
    const prev = Number(localStorage.getItem(key) || 0)
    if (game.level > prev) {
      localStorage.setItem(key, String(game.level))
      if (prev > 0) setCelebrate((c) => c + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.level])

  const statValue = (key: keyof ProgressOverview): number => {
    const raw = overview?.[key]
    return typeof raw === 'number' ? Math.round(raw) : 0
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative card p-7 sm:p-8 mb-6 overflow-visible"
        >
          <ConfettiBurst burstKey={celebrate} />
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="hidden sm:block flex-shrink-0 -my-4">
                <Mascot size={92} mood={celebrate > 0 ? 'celebrating' : 'happy'} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase mb-2" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>
                  Level {game.level} · {game.title}
                </p>
                <h1 className="font-display text-3xl sm:text-[2.35rem] font-semibold leading-tight" style={{ color: 'var(--text-hi)' }}>
                  Welcome back, {firstName}!
                </h1>
                <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--text-mid)' }}>
                  {game.xpForNextLevel - game.xpIntoLevel} XP to level {game.level + 1}
                </p>
                <div className="w-56 max-w-full mt-3 xp-track">
                  <motion.div className="xp-fill" initial={{ width: 0 }} animate={{ width: `${game.progress}%` }} transition={{ duration: 1, ease: EASE, delay: 0.15 }} />
                </div>
              </div>
            </div>

            {(overview?.streak_days || 0) > 0 && (
              <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <StreakFlame days={overview?.streak_days || 0} size={22} />
                <span className="font-display text-xl font-semibold leading-none" style={{ color: 'var(--text-hi)' }}>
                  <CountUp value={overview?.streak_days || 0} />
                </span>
                <span className="text-[9px] font-extrabold uppercase" style={{ letterSpacing: '0.08em', color: 'var(--text-lo)' }}>Day streak</span>
              </div>
            )}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Overview card, island-rating style */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ease: EASE }} className="card p-5">
            <p className="text-[11px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.12em', color: 'var(--text-lo)' }}>Overview</p>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={16} fill={n <= stars ? ACCENTS.amber : 'none'} style={{ color: n <= stars ? ACCENTS.amber : 'var(--border-bold)' }} />
              ))}
              <span className="text-xs font-bold ml-1" style={{ color: 'var(--text-mid)' }}>study rating</span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>
              Preferred subject: <span style={{ color: 'var(--text-hi)' }}>{user?.preferred_subject || 'Not set'}</span>
            </p>
            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-mid)' }}>
              Depth: <span style={{ color: 'var(--text-hi)' }}>{user?.explanation_level || 'Intermediate'}</span>
            </p>
          </motion.div>

          {/* Mascot note */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: EASE }} className="card p-5 flex gap-3">
            <Mascot size={48} />
            <div>
              <p className="text-[11px] font-extrabold uppercase mb-2" style={{ letterSpacing: '0.12em', color: 'var(--text-lo)' }}>EduBot says</p>
              <p className="font-hand text-lg leading-tight" style={{ color: 'var(--text-hi)' }}>{note}</p>
            </div>
          </motion.div>

          {/* Stats compact */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ease: EASE }} className="card p-5">
            <p className="text-[11px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.12em', color: 'var(--text-lo)' }}>Achievements</p>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} style={{ color: ACCENTS.amber }} />
              <span className="font-display text-xl font-semibold" style={{ color: 'var(--text-hi)' }}>{unlockedCount} / {BADGES.length}</span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>badges unlocked so far</p>
          </motion.div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STATS.map((s, i) => (
            <StatCard key={s.key} icon={s.icon} label={s.label} value={statValue(s.key)} suffix={s.suffix} accent={s.accent} index={i} />
          ))}
        </section>

        {/* Quests */}
        <section className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <Sparkles size={14} style={{ color: ACCENTS.amber }} />
            <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>Today's quests</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUESTS.map((a, i) => (
              <motion.button
                key={a.to}
                onClick={() => navigate(a.to)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, ease: EASE, duration: 0.4 }}
                whileHover={{ y: -3 }}
                className="card card-interactive p-5 text-left group"
              >
                <div className="flex items-start gap-4">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tint(a.accent, 0.22) }}>
                    <a.icon size={18} style={{ color: a.accent }} strokeWidth={2.25} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="block font-display text-base font-semibold" style={{ color: 'var(--text-hi)' }}>{a.label}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: tint(ACCENTS.amber, 0.28), color: '#8B5A2B' }}>
                        +{a.xp} XP
                      </span>
                    </span>
                    <span className="block text-xs font-semibold mt-1" style={{ color: 'var(--text-mid)' }}>{a.desc}</span>
                  </span>
                  <ArrowUpRight size={16} strokeWidth={2.25} className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: a.accent }} />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {isEmpty ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: EASE }} className="card p-12 text-center">
            <div className="mb-4 flex justify-center"><Mascot size={80} /></div>
            <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text-hi)' }}>Nothing here yet</h3>
            <p className="text-sm mb-7 max-w-sm mx-auto font-semibold" style={{ color: 'var(--text-mid)' }}>Ask your first question to start earning XP.</p>
            <button onClick={() => navigate('/chat')} className="btn-primary">Ask a question</button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {overview.subject_stats?.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ease: EASE }} className="card p-6">
                <div className="flex items-center gap-2.5 mb-6">
                  <BookOpen size={14} style={{ color: ACCENTS.cyan }} />
                  <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.12em', color: 'var(--text-lo)' }}>Collections</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {overview.subject_stats.slice(0, 10).map((stat) => {
                    const meta = subjectMeta(stat.subject)
                    const Icon = meta.icon
                    return (
                      <div key={stat.subject} className="flex flex-col items-center gap-1.5 text-center">
                        <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: tint(meta.accent, 0.2) }}>
                          <Icon size={18} style={{ color: meta.accent }} strokeWidth={2.25} />
                        </span>
                        <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--text-mid)' }}>{stat.sessions}/10</span>
                      </div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {overview.recent_activity?.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ease: EASE }} className="card p-6">
                <div className="flex items-center gap-2.5 mb-6">
                  <NotebookPen size={14} style={{ color: ACCENTS.mint }} />
                  <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.12em', color: 'var(--text-lo)' }}>Recent activity</h2>
                </div>
                <div className="space-y-4">
                  {overview.recent_activity.slice(0, 5).map((a, i) => {
                    const meta = subjectMeta(a.subject)
                    return (
                      <motion.div key={`${a.title}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05, ease: EASE }} className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.accent }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--text-hi)' }}>{a.title}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-lo)' }}>{a.subject ? `${a.subject} · ` : ''}{a.date}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </div>
        )}

        {/* Achievements */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: EASE }} className="card p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <Trophy size={14} style={{ color: ACCENTS.amber }} />
            <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.12em', color: 'var(--text-lo)' }}>Achievements</h2>
            <span className="text-[10px] font-bold ml-auto" style={{ color: 'var(--text-lo)' }}>{unlockedCount} / {BADGES.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map((badge, i) => {
              const unlocked = badge.test(overview)
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={unlocked ? { ...BOUNCE, delay: 0.35 + i * 0.05 } : { delay: 0.35 + i * 0.05, ease: EASE }}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-2xl text-center"
                  style={{ background: unlocked ? tint(badge.accent, 0.2) : 'var(--surface-2)', border: `1px solid ${unlocked ? tint(badge.accent, 0.4) : 'var(--border-soft)'}`, opacity: unlocked ? 1 : 0.55 }}
                >
                  {unlocked ? <badge.icon size={18} style={{ color: badge.accent }} strokeWidth={2.25} /> : <Lock size={16} style={{ color: 'var(--text-lo)' }} />}
                  <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--text-mid)' }}>{badge.label}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
