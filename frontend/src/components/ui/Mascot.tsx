import { motion } from 'framer-motion'

interface Props {
  size?: number
  mood?: 'happy' | 'thinking' | 'celebrating'
  className?: string
}

/**
 * EduBot's mascot: a small round tutor-bot who carries a book everywhere.
 * One consistent character used at every size — see Logo.tsx for the
 * cropped face-only version used in tight spaces (nav, avatars).
 */
export default function Mascot({ size = 96, mood = 'happy', className = '' }: Props) {
  const bounce = mood === 'celebrating'

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 132"
      fill="none"
      className={className}
      role="img"
      aria-label="EduBot mascot"
      animate={bounce ? { y: [0, -8, 0], rotate: [-3, 3, -3] } : { y: [0, -4, 0] }}
      transition={{ duration: bounce ? 0.6 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* antenna */}
      <motion.g
        style={{ transformOrigin: '60px 20px' }}
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="60" y1="20" x2="60" y2="6" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="5" r="5" fill="#8FAE7D" />
      </motion.g>

      {/* ears */}
      <rect x="10" y="46" width="12" height="22" rx="6" fill="#E0A85C" />
      <rect x="98" y="46" width="12" height="22" rx="6" fill="#E0A85C" />

      {/* head */}
      <rect x="20" y="22" width="80" height="66" rx="32" fill="#FBF6EA" stroke="#8B5A2B" strokeWidth="3.5" />

      {/* blush */}
      <ellipse cx="34" cy="64" rx="7" ry="4.5" fill="#D98F72" opacity="0.55" />
      <ellipse cx="86" cy="64" rx="7" ry="4.5" fill="#D98F72" opacity="0.55" />

      {/* eyes */}
      <motion.g
        style={{ transformOrigin: '46px 54px' }}
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] }}
      >
        <circle cx="46" cy="54" r="7" fill="#3A3226" />
        <circle cx="48" cy="51.5" r="2.2" fill="#FBF6EA" />
      </motion.g>
      <motion.g
        style={{ transformOrigin: '74px 54px' }}
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] }}
      >
        <circle cx="74" cy="54" r="7" fill="#3A3226" />
        <circle cx="76" cy="51.5" r="2.2" fill="#FBF6EA" />
      </motion.g>

      {/* smile */}
      <path d="M50 70 Q60 78 70 70" stroke="#3A3226" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* body */}
      <rect x="34" y="92" width="52" height="34" rx="16" fill="#8FAE7D" stroke="#8B5A2B" strokeWidth="3.5" />

      {/* book */}
      <g transform="translate(45, 100)">
        <rect x="0" y="0" width="30" height="20" rx="3" fill="#FBF6EA" stroke="#8B5A2B" strokeWidth="2.5" />
        <line x1="15" y1="1.5" x2="15" y2="18.5" stroke="#8B5A2B" strokeWidth="2" />
        <line x1="4" y1="6" x2="12" y2="6" stroke="#D98F72" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="4" y1="11" x2="12" y2="11" stroke="#D98F72" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="18" y1="6" x2="26" y2="6" stroke="#7FADC2" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="18" y1="11" x2="26" y2="11" stroke="#7FADC2" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </motion.svg>
  )
}
