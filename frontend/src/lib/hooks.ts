import { useEffect, useState, useCallback } from 'react'

/** True when the OS asks for less motion. Live — responds to changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/**
 * Interaction sound hooks. No audio ships today — this is the single
 * seam every interaction routes through, so adding a sample later is
 * one file rather than fifty call sites.
 */
export type Cue =
  | 'correct' | 'wrong' | 'levelUp' | 'send' | 'cardFlip' | 'tap'

export function useCue() {
  return useCallback((cue: Cue) => {
    window.dispatchEvent(new CustomEvent('edubot:cue', { detail: cue }))
  }, [])
}
