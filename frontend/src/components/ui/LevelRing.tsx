import { motion } from 'framer-motion'
import { EASE } from '@/lib/design'

interface Props {
  level: number
  progress: number
  size?: number
}

/** Circular level badge — the ring fills as XP accrues toward the next level. */
export default function LevelRing({ level, progress, size = 44 }: Props) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const center = size / 2

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" strokeWidth={4} stroke="var(--border-soft)" />
        <motion.circle
          cx={center} cy={center} r={r} fill="none" strokeWidth={4}
          strokeLinecap="round"
          stroke="url(#level-ring-grad)"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
          transition={{ duration: 1, ease: EASE }}
        />
        <defs>
          <linearGradient id="level-ring-grad" x1="0" y1="0" x2={size} y2={size}>
            <stop offset="0%" stopColor="#E0A85C" />
            <stop offset="100%" stopColor="#D98F72" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[13px] font-bold" style={{ color: 'var(--text-hi)' }}>
          {level}
        </span>
      </div>
    </div>
  )
}
