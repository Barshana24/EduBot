import { motion } from 'framer-motion'

interface Props {
  size?: number
  /** Blinks a little faster and glows softly while composing a reply. */
  thinking?: boolean
  className?: string
}

/** Compact face-only crop of the Mascot, for small spaces — nav, avatars, favicons. */
export default function Logo({ size = 32, thinking = false, className = '' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} role="img" aria-label="EduBot">
      <circle cx="32" cy="32" r="30" fill="#FBF6EA" stroke="#8B5A2B" strokeWidth="3" />
      <circle cx="14" cy="30" r="4" fill="#E0A85C" />
      <circle cx="50" cy="30" r="4" fill="#E0A85C" />

      <ellipse cx="20" cy="40" rx="5" ry="3.2" fill="#D98F72" opacity="0.5" />
      <ellipse cx="44" cy="40" rx="5" ry="3.2" fill="#D98F72" opacity="0.5" />

      <motion.g
        style={{ transformOrigin: '22px 30px' }}
        animate={thinking ? { scaleY: [1, 0.15, 1] } : { scaleY: [1, 1, 0.15, 1] }}
        transition={thinking ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 3.6, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
      >
        <circle cx="22" cy="30" r="4.2" fill="#3A3226" />
      </motion.g>
      <motion.g
        style={{ transformOrigin: '42px 30px' }}
        animate={thinking ? { scaleY: [1, 0.15, 1] } : { scaleY: [1, 1, 0.15, 1] }}
        transition={thinking ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.1 } : { duration: 3.6, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
      >
        <circle cx="42" cy="30" r="4.2" fill="#3A3226" />
      </motion.g>

      <path d="M24 42 Q32 48 40 42" stroke="#3A3226" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}
