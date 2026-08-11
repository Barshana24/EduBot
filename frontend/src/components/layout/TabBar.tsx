import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Brain, Layers, TrendingUp, Smile } from 'lucide-react'
import { useCue } from '@/lib/hooks'
import type { LucideIcon } from 'lucide-react'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
  /** Other paths that should light this tab up. */
  also?: string[]
}

const TABS: Tab[] = [
  { to: '/chat',       label: 'Learn',    icon: MessageCircle },
  { to: '/quiz',       label: 'Quiz',     icon: Brain },
  { to: '/flashcards', label: 'Cards',    icon: Layers },
  { to: '/progress',   label: 'Progress', icon: TrendingUp, also: ['/dashboard'] },
  { to: '/profile',    label: 'Me',       icon: Smile,      also: ['/documents'] },
]

/** Five destinations, always reachable in one tap. */
export default function TabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const cue = useCue()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-center px-1"
      style={{
        height: 'var(--tabs-bottom)',
        background: 'var(--card)',
        borderTop: '2px solid var(--line)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Main"
    >
      {/* Capped so the pills stay thumb-sized rather than stretching
          across a 1440px desktop. */}
      <div className="flex items-stretch w-full" style={{ maxWidth: '30rem' }}>
      {TABS.map((tab) => {
        const paths = [tab.to, ...(tab.also ?? [])]
        const active = paths.some((p) => location.pathname.startsWith(p))
        return (
          <button
            key={tab.to}
            onClick={() => { cue('tap'); navigate(tab.to) }}
            aria-current={active ? 'page' : undefined}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 min-w-0"
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-x-1.5 top-2 bottom-2 rounded-[18px]"
                style={{ background: 'var(--brand-soft)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <motion.span
              className="relative z-10 flex flex-col items-center gap-1"
              animate={{ scale: active ? 1.06 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <tab.icon
                size={22}
                strokeWidth={active ? 2.6 : 2.1}
                style={{ color: active ? 'var(--brand)' : 'var(--ink-faint)' }}
              />
              <span
                className="font-display text-[11px] font-semibold leading-none"
                style={{ color: active ? 'var(--brand-text)' : 'var(--ink-faint)' }}
              >
                {tab.label}
              </span>
            </motion.span>
          </button>
        )
      })}
      </div>
    </nav>
  )
}
