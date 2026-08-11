import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import { C, XP_PER_LOGIN_DAY, EASE } from '@/lib/design'
import { useCue } from '@/lib/hooks'
import { takeDaily } from '@/lib/dailyReward'
import Mascot from '@/components/ui/Mascot'
import Confetti from '@/components/ui/Confetti'
import type { DailyReward as Reward } from '@/types'

/**
 * Claims the daily login reward once per app open and celebrates only when
 * the server says the day was genuinely new. The server is the authority,
 * so reopening the app or refreshing never awards twice.
 */
export default function DailyReward() {
  const queryClient = useQueryClient()
  const cue = useCue()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [reward, setReward] = useState<Reward | null>(null)
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false

    // A reward earned during sign-in was already credited; show that first.
    const handedOver = takeDaily()
    if (handedOver) {
      setReward(handedOver)
      setBurst((b) => b + 1)
      cue('levelUp')
      queryClient.invalidateQueries({ queryKey: ['progress-overview'] })
      return
    }

    authAPI.claimDaily()
      .then((res) => {
        if (cancelled) return
        const { user, ...daily } = res.data
        updateUser(user)
        // The HUD reads XP from the progress query, so refresh it either way.
        queryClient.invalidateQueries({ queryKey: ['progress-overview'] })
        if (daily.awarded) {
          setReward(daily)
          setBurst((b) => b + 1)
          cue('levelUp')
        }
      })
      .catch(() => {
        /* A missed daily claim must never block the app. */
      })

    return () => { cancelled = true }
  }, [isAuthenticated, queryClient, updateUser, cue])

  // Auto-dismiss, so it never becomes a thing you must click past.
  useEffect(() => {
    if (!reward) return
    const t = setTimeout(() => setReward(null), 5200)
    return () => clearTimeout(t)
  }, [reward])

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed left-1/2 -translate-x-1/2 z-50 card px-4 py-3 flex items-center gap-3"
          style={{
            top: 'calc(var(--hud-top) + 0.75rem)',
            width: 'min(22rem, calc(100vw - 2rem))',
            background: 'var(--sun-soft)',
            borderColor: 'var(--sun)',
          }}
        >
          <Confetti burstKey={burst} />
          <Mascot size={52} mood="proud" still className="shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold" style={{ color: 'var(--ink)' }}>
              Daily bonus! +{reward.xp_awarded || XP_PER_LOGIN_DAY} XP
            </p>
            <p className="t-small flex items-center gap-1.5 mt-0.5">
              <Flame size={13} color={C.sun} fill={C.sun} />
              {reward.streak_days === 1
                ? 'Streak started. Come back tomorrow!'
                : `${reward.streak_days} day streak. Keep it going!`}
            </p>
          </div>

          <button
            onClick={() => setReward(null)}
            className="icon-btn !w-8 !h-8 shrink-0"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>

          {/* Countdown hairline showing the toast will leave on its own. */}
          <motion.span
            className="absolute left-0 bottom-0 h-[3px] rounded-full"
            style={{ background: C.sun }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5.2, ease: EASE }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
