import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ACCENTS } from '@/lib/design'

const COLORS = Object.values(ACCENTS)
const PIECE_COUNT = 22

interface Piece {
  angle: number
  dist: number
  size: number
  shape: 'circle' | 'square'
  color: string
  spin: number
}

/**
 * A one-shot burst of colored pieces from the center of its container.
 * Bump `burstKey` to replay it (e.g. quiz submitted, achievement unlocked).
 */
export default function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      const angle = (i / PIECE_COUNT) * Math.PI * 2 + Math.random() * 0.4
      return {
        angle,
        dist: 70 + Math.random() * 90,
        size: 5 + Math.random() * 5,
        shape: i % 3 === 0 ? 'circle' : 'square',
        color: COLORS[i % COLORS.length],
        spin: (Math.random() - 0.5) * 480,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-30" aria-hidden="true">
      <AnimatePresence>
        {burstKey > 0 && (
          <div key={burstKey} className="absolute inset-0">
            {pieces.map((p, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6, rotate: 0 }}
                animate={{
                  opacity: 0,
                  x: Math.cos(p.angle) * p.dist,
                  y: Math.sin(p.angle) * p.dist - 30,
                  scale: 1,
                  rotate: p.spin,
                }}
                transition={{ duration: 0.9 + Math.random() * 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: p.size,
                  height: p.size,
                  borderRadius: p.shape === 'circle' ? '50%' : '3px',
                  background: p.color,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
