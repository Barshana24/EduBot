import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C } from '@/lib/design'
import { useReducedMotion } from '@/lib/hooks'

const COLOURS = [C.brand, C.mint, C.sun, C.coral, C.sky]
const COUNT = 26

interface Props {
  /** Increment this to fire a burst. Zero means nothing has happened yet. */
  burstKey: number
}

/** A short celebration. Fires once per burstKey and cleans itself up. */
export default function Confetti({ burstKey }: Props) {
  const reduced = useReducedMotion()

  // Regenerated per burst so every celebration looks a little different.
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        colour: COLOURS[i % COLOURS.length],
        x: (Math.random() - 0.5) * 460,
        y: -120 - Math.random() * 220,
        rotate: (Math.random() - 0.5) * 620,
        size: 7 + Math.random() * 9,
        round: Math.random() > 0.5,
        delay: Math.random() * 0.14,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey]
  )

  if (reduced || burstKey === 0) return null

  return (
    <AnimatePresence>
      <div
        key={burstKey}
        aria-hidden
        className="absolute left-1/2 top-1/3 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className="absolute block"
            style={{
              width: p.size,
              height: p.size,
              borderRadius: p.round ? '50%' : 3,
              background: p.colour,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: 0 }}
            animate={{
              x: p.x,
              // Up first, then gravity takes over.
              y: [0, p.y, p.y + 340],
              opacity: [1, 1, 0],
              scale: 1,
              rotate: p.rotate,
            }}
            transition={{ duration: 1.5, delay: p.delay, ease: [0.18, 0.7, 0.4, 1] }}
          />
        ))}
      </div>
    </AnimatePresence>
  )
}
