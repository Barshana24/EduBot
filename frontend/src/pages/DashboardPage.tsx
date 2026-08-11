import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, Check } from 'lucide-react'
import { progressAPI, chatAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import { computeGameStats, subjectMeta, C, EASE } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import type { ProgressOverview, ChatSession } from '@/types'

/** Goals derived from numbers the backend already reports. Nothing invented. */
function buildGoals(o?: ProgressOverview) {
  return [
    { label: 'Have 10 chats',        have: o?.total_sessions ?? 0,                 need: 10, to: '/chat' },
    { label: 'Finish 5 quizzes',     have: o?.quizzes_completed ?? 0,              need: 5,  to: '/quiz' },
    { label: 'Keep a 7-day streak',  have: o?.streak_days ?? 0,                    need: 7,  to: '/chat' },
    { label: 'Average 80% on quizzes', have: Math.round(o?.avg_quiz_score ?? 0),   need: 80, to: '/quiz' },
  ]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: overview, isLoading } = useQuery<ProgressOverview>({
    queryKey: ['progress-overview'],
    queryFn: async () => (await progressAPI.overview()).data,
  })

  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => (await chatAPI.listSessions({ limit: 6 })).data,
  })

  if (isLoading) {
    return (
      <div className="h-full grid place-items-center">
        <Mascot size={72} mood="thinking" />
      </div>
    )
  }

  const game = computeGameStats(overview)
  const goals = buildGoals(overview)
  const name = user?.full_name?.split(' ')[0] || user?.username || 'there'

  return (
    <div className="page scroll-y">
      <div className="page-inner">
        <button onClick={() => navigate('/progress')} className="btn btn-ghost btn-sm -ml-2 mb-2">
          <ArrowLeft size={17} /> Back
        </button>

        <div className="card p-5 flex items-center gap-4 mb-5" style={{ background: 'var(--brand-soft)', borderColor: 'var(--brand)' }}>
          <Mascot size={72} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="t-head">Hey {name}!</h1>
            <p className="t-small mt-0.5">
              Level {game.level} · {game.totalXP} XP so far
            </p>
          </div>
        </div>

        <p className="t-cap mb-3">Your goals</p>
        <div className="space-y-2.5 mb-6">
          {goals.map((goal, i) => {
            const pct = Math.min((goal.have / goal.need) * 100, 100)
            const done = pct >= 100
            return (
              <motion.button
                key={goal.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.05, ease: EASE }}
                onClick={() => navigate(goal.to)}
                className="card card-tap w-full p-3.5 text-left"
                style={done ? { background: 'var(--mint-soft)', borderColor: 'var(--mint)' } : undefined}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  {done && (
                    <span className="shrink-0 grid place-items-center" style={{ width: 22, height: 22, borderRadius: 8, background: C.mint }}>
                      <Check size={13} color={C.ink} strokeWidth={3.4} />
                    </span>
                  )}
                  <span className="flex-1 font-display font-semibold" style={{ color: 'var(--ink)' }}>
                    {goal.label}
                  </span>
                  <span className="t-small shrink-0">
                    {done ? 'Done!' : `${goal.have}/${goal.need}`}
                  </span>
                </div>
                <span className="bar bar-thin block">
                  <motion.span
                    className="bar-fill block"
                    style={{ background: done ? C.mint : C.brand }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: EASE }}
                  />
                </span>
              </motion.button>
            )
          })}
        </div>

        <p className="t-cap mb-3">Recent chats</p>
        {sessions.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="t-head">No chats yet</p>
            <p className="t-body mt-1 mb-4">Ask your first question and it shows up here.</p>
            <button onClick={() => navigate('/chat')} className="btn btn-primary btn-sm">Start a chat</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((session, i) => {
              const meta = subjectMeta(session.subject)
              const Icon = meta.icon
              return (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.04, ease: EASE }}
                  onClick={() => navigate(`/chat/${session.id}`)}
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
                      {session.title}
                    </span>
                    <span className="t-small">{session.message_count} messages</span>
                  </span>
                  <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} className="shrink-0" />
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
