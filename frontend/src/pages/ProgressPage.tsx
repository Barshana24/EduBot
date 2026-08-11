import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Brain, Star, Flame, Trophy, Target, BookOpen, Lock, LayoutGrid } from 'lucide-react'
import { progressAPI } from '@/services/api'
import { useChatStore } from '@/store'
import { subjectMeta, computeGameStats, C, EASE } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import CountUp from '@/components/ui/CountUp'
import type { ProgressOverview, Subject } from '@/types'
import type { LucideIcon } from 'lucide-react'

const BADGES: { icon: LucideIcon; label: string; colour: string; test: (o?: ProgressOverview) => boolean }[] = [
  { icon: Target,   label: 'First chat',  colour: C.brand, test: (o) => (o?.total_sessions || 0) >= 1 },
  { icon: BookOpen, label: '10 chats',    colour: C.sky,   test: (o) => (o?.total_sessions || 0) >= 10 },
  { icon: Brain,    label: 'First quiz',  colour: C.sun,   test: (o) => (o?.quizzes_completed || 0) >= 1 },
  { icon: Star,     label: 'Scored 80%',  colour: C.coral, test: (o) => (o?.avg_quiz_score || 0) >= 80 },
  { icon: Flame,    label: '7-day streak',colour: C.mint,  test: (o) => (o?.streak_days || 0) >= 7 },
  { icon: Trophy,   label: '10 quizzes',  colour: C.brand, test: (o) => (o?.quizzes_completed || 0) >= 10 },
]

export default function ProgressPage() {
  const navigate = useNavigate()
  const setSubject = useChatStore((s) => s.setSubject)

  const { data: overview, isLoading } = useQuery<ProgressOverview>({
    queryKey: ['progress-overview'],
    queryFn: async () => (await progressAPI.overview()).data,
  })

  if (isLoading) {
    return (
      <div className="h-full grid place-items-center">
        <Mascot size={72} mood="thinking" />
      </div>
    )
  }

  const game = computeGameStats(overview)
  const unlocked = BADGES.filter((b) => b.test(overview)).length
  const noActivity =
    !overview ||
    (overview.total_sessions === 0 && overview.quizzes_completed === 0 && overview.total_messages === 0)

  const STATS = [
    { icon: MessageCircle, label: 'Chats',      value: overview?.total_sessions ?? 0,             colour: C.brand },
    { icon: Brain,         label: 'Quizzes',    value: overview?.quizzes_completed ?? 0,          colour: C.sky },
    { icon: Star,          label: 'Avg score',  value: Math.round(overview?.avg_quiz_score ?? 0), colour: C.sun, suffix: '%' },
    { icon: Flame,         label: 'Day streak', value: overview?.streak_days ?? 0,                colour: C.coral },
  ]

  return (
    <div className="page scroll-y">
      <div className="page-inner">
        {/* Level card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="card p-5 flex items-center gap-4 mb-4"
          style={{ background: 'var(--brand-soft)', borderColor: 'var(--brand)' }}
        >
          <Mascot size={80} mood={game.level >= 3 ? 'proud' : 'idle'} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="t-cap">Level {game.level}</p>
            <p className="t-title" style={{ fontSize: '1.5rem' }}>{game.title}</p>
            <div className="bar mt-2.5">
              <motion.span
                className="bar-fill block bar-shine"
                initial={{ width: 0 }}
                animate={{ width: `${game.progress}%` }}
                transition={{ duration: 1, ease: EASE }}
              />
            </div>
            <p className="t-small mt-1.5">
              {game.xpForNextLevel - game.xpIntoLevel} XP to level {game.level + 1}
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05, ease: EASE }}
              className="card p-4"
            >
              <span
                className="grid place-items-center mb-2.5"
                style={{ width: 38, height: 38, borderRadius: 13, background: `${s.colour}22` }}
              >
                <s.icon size={19} style={{ color: s.colour }} strokeWidth={2.4} />
              </span>
              <p className="t-num" style={{ fontSize: '1.75rem', lineHeight: 1 }}>
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="t-cap mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Subjects */}
        {(overview?.subject_stats?.length ?? 0) > 0 ? (
          <section className="mb-4">
            <p className="t-cap mb-3">Your subjects</p>
            <div className="space-y-2.5">
              {overview!.subject_stats.slice(0, 6).map((stat, i) => {
                const meta = subjectMeta(stat.subject)
                const Icon = meta.icon
                return (
                  <motion.button
                    key={stat.subject}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, ease: EASE }}
                    onClick={() => { setSubject(stat.subject as Subject); navigate('/chat') }}
                    className="card card-tap w-full flex items-center gap-3 p-3.5 text-left"
                  >
                    <span
                      className="shrink-0 grid place-items-center"
                      style={{ width: 40, height: 40, borderRadius: 14, background: `${meta.colour}22` }}
                    >
                      <Icon size={19} style={{ color: meta.colour }} strokeWidth={2.4} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-display font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {stat.subject}
                      </span>
                      <span className="bar bar-thin mt-1.5 block">
                        <motion.span
                          className="bar-fill block"
                          style={{ background: meta.colour }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((stat.sessions / 10) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: EASE }}
                        />
                      </span>
                    </span>
                    <span className="t-small shrink-0">
                      {stat.avg_quiz_score != null ? `${stat.avg_quiz_score.toFixed(0)}%` : `${stat.sessions}`}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="card p-6 text-center mb-4">
            <Mascot size={80} className="mx-auto" />
            <p className="t-head mt-2">
              {noActivity ? 'Nothing here yet!' : 'No subjects tagged yet'}
            </p>
            <p className="t-body mt-1 mb-4">
              {noActivity
                ? 'Ask me one question and your first stat appears.'
                : 'Pick a subject in chat and it shows up here.'}
            </p>
            <button onClick={() => navigate('/chat')} className="btn btn-primary btn-sm">
              Start learning
            </button>
          </div>
        )}

        {/* Badges */}
        <section className="mb-4">
          <div className="flex items-baseline justify-between mb-3">
            <p className="t-cap">Badges</p>
            <p className="t-cap">{unlocked} of {BADGES.length}</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {BADGES.map((badge, i) => {
              const got = badge.test(overview)
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  className="card p-3 flex flex-col items-center gap-2 text-center"
                  style={got ? { background: `${badge.colour}18`, borderColor: badge.colour } : { opacity: 0.6 }}
                >
                  <span
                    className="grid place-items-center"
                    style={{
                      width: 40, height: 40, borderRadius: 14,
                      background: got ? badge.colour : 'var(--line)',
                    }}
                  >
                    {/* Only the brand violet is dark enough for a white glyph. */}
                    {got
                      ? <badge.icon
                          size={19}
                          color={badge.colour === C.brand ? '#fff' : C.ink}
                          strokeWidth={2.5}
                        />
                      : <Lock size={17} style={{ color: 'var(--ink-faint)' }} />}
                  </span>
                  <span className="t-small text-center leading-tight" style={{ fontSize: '0.7rem' }}>
                    {badge.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </section>

        <button onClick={() => navigate('/dashboard')} className="card card-tap w-full flex items-center gap-3 p-4 text-left">
          <span
            className="shrink-0 grid place-items-center"
            style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--brand-soft)' }}
          >
            <LayoutGrid size={19} style={{ color: C.brand }} strokeWidth={2.4} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>Full dashboard</span>
            <span className="t-small">Goals and recent chats</span>
          </span>
        </button>
      </div>
    </div>
  )
}
