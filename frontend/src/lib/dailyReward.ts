import type { DailyReward } from '@/types'

const KEY = 'edubot-pending-daily'

/**
 * Sign-in and sign-up already credit the day server-side, so by the time the
 * app shell mounts the server correctly reports "nothing to award". Without
 * this hand-off a brand-new account would never see its own first reward.
 * Stored in sessionStorage so it survives the redirect into the app.
 */
export function stashDaily(daily?: DailyReward | null): void {
  if (!daily?.awarded) return
  try {
    sessionStorage.setItem(KEY, JSON.stringify(daily))
  } catch {
    /* private mode — the reward is still credited, just not celebrated */
  }
}

/** Reads and clears the pending reward, so it is shown exactly once. */
export function takeDaily(): DailyReward | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    sessionStorage.removeItem(KEY)
    const parsed = JSON.parse(raw) as DailyReward
    return parsed?.awarded ? parsed : null
  } catch {
    return null
  }
}
