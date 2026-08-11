import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { progressAPI } from '@/services/api'
import { computeGameStats, EASE, C } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import type { ProgressOverview } from '@/types'

/**
 * Always on screen: level, XP and streak. The whole point of the
 * game feel is that progress is never more than a glance away.
 */
export default function HUD() {
  const navigate = useNavigate()

  const { data: overview } = useQuery<ProgressOverview>({
    queryKey: ['progress-overview'],
    queryFn: async () => (await progressAPI.overview()).data,
    staleTime: 30_000,
  })

  const game = computeGameStats(overview)
  const streak = overview?.streak_days ?? 0

  // Whenever XP grows, float the gain above the counter for a moment.
  const prevXP = useRef<number | null>(null)
  const [gain, setGain] = useState<{ amount: number; id: number } | null>(null)

  useEffect(() => {
    const previous = prevXP.current
    prevXP.current = game.totalXP
    // Skip the very first read, otherwise every page load claims a gain.
    if (previous === null || game.totalXP <= previous) return
    setGain({ amount: game.totalXP - previous, id: Date.now() })
    const t = setTimeout(() => setGain(null), 1700)
    return () => clearTimeout(t)
  }, [game.totalXP])

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 flex items-center gap-2 px-[var(--gutter)]"
      style={{
        height: 'var(--hud-top)',
        background: 'var(--card)',
        borderBottom: '2px solid var(--line)',
      }}
    >
      <button
        onClick={() => navigate('/chat')}
        className="flex items-center gap-2 pr-2 shrink-0"
        aria-label="EduBot home"
      >
        <Mascot size={36} still />
        <span className="font-display text-lg font-semibold hidden sm:block" style={{ color: 'var(--ink)' }}>
          EduBot
        </span>
      </button>

      {/* Level track — fills as XP accrues toward the next level. */}
      <button
        onClick={() => navigate('/progress')}
        className="flex-1 min-w-0 flex items-center gap-2.5"
        aria-label={`Level ${game.level}, ${game.xpIntoLevel} of ${game.xpForNextLevel} XP to the next level`}
      >
        <span
          className="shrink-0 grid place-items-center font-display font-semibold text-white"
          style={{ width: 30, height: 30, borderRadius: 10, background: C.brand, fontSize: 13 }}
        >
          {game.level}
        </span>
        <span className="bar bar-thin flex-1 min-w-0 max-w-[180px]">
          <motion.span
            className="bar-fill block bar-shine"
            initial={{ width: 0 }}
            animate={{ width: `${game.progress}%` }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        </span>
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{ background: 'var(--sun-soft)' }}
          title={`${streak} day streak`}
        >
          <Flame size={15} color={C.sun} fill={streak > 0 ? C.sun : 'none'} strokeWidth={2.5} />
          <span className="font-display font-semibold text-sm" style={{ color: 'var(--ink)' }}>{streak}</span>
        </span>

        <span
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{ background: 'var(--brand-soft)' }}
          title={`${game.totalXP} XP`}
        >
          <motion.span
            className="flex items-center gap-1.5"
            animate={gain ? { scale: [1, 1.22, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Star size={15} color={C.brand} fill={C.brand} strokeWidth={2.5} />
            <span className="font-display font-semibold text-sm" style={{ color: 'var(--ink)' }}>
              {game.totalXP}
            </span>
          </motion.span>

          <AnimatePresence>
            {gain && (
              <motion.span
                key={gain.id}
                initial={{ opacity: 0, y: 4, scale: 0.8 }}
                animate={{ opacity: 1, y: 26, scale: 1 }}
                exit={{ opacity: 0, y: 34 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute left-1/2 -translate-x-1/2 top-full font-display font-semibold text-sm whitespace-nowrap pointer-events-none"
                style={{ color: 'var(--mint-text)' }}
              >
                +{gain.amount} XP
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
    </header>
  )
}
