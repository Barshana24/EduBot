import type { Variants, Transition } from 'framer-motion'
import { EASE } from './design'

/* Reusable motion primitives. Components compose these instead of
 * re-declaring initial/animate objects, so timing stays consistent. */

export const fadeUp = (delay = 0, distance = 18): Variants => ({
  hidden: { opacity: 0, y: distance },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: EASE } },
})

export const fadeIn = (delay = 0): Variants => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, delay, ease: EASE } },
})

export const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, delay, ease: EASE } },
})

export const staggerChildren = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

/** A word or line sliding up from behind a clipping mask. */
export const revealLine: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 0.8, ease: EASE } },
}

/** Rooms of the same building: content lifts out, next content lifts in. */
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.42, ease: EASE } as Transition,
}
