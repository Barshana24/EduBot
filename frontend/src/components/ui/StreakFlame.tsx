import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

/** A flame that flickers when the streak is alive — still on day 0. */
export default function StreakFlame({ days, size = 16 }: { days: number; size?: number }) {
  const alive = days > 0
  return (
    <motion.span
      animate={alive ? { scale: [1, 1.14, 1], rotate: [-3, 3, -3] } : undefined}
      transition={alive ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      style={{ display: 'inline-flex', filter: alive ? 'drop-shadow(0 0 5px rgba(217,143,114,0.6))' : 'none' }}
    >
      <Flame
        size={size}
        fill={alive ? '#D98F72' : 'transparent'}
        style={{ color: alive ? '#E0A85C' : 'var(--text-lo)' }}
      />
    </motion.span>
  )
}
