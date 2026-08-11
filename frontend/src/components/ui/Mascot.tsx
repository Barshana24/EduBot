import { motion } from 'framer-motion'
import { C } from '@/lib/design'

export type Mood = 'idle' | 'happy' | 'thinking' | 'oops' | 'proud'

interface Props {
  /** A number in px, or a CSS length so a parent can size it responsively. */
  size?: number | string
  mood?: Mood
  /** Turn off the idle breathing when the mascot is a small static avatar. */
  still?: boolean
  className?: string
}

/**
 * Bo, the study buddy. A rounded robot head built from plain SVG so it
 * scales anywhere and costs nothing to ship. The mood prop drives the
 * eyes, mouth and posture, which is how the app reacts to the student.
 */
export default function Mascot({ size = 96, mood = 'idle', still = false, className }: Props) {
  const bodyColour =
    mood === 'happy' || mood === 'proud' ? C.mint
    : mood === 'oops' ? C.coral
    : C.brand

  // Eyes: open by default, curved-shut when delighted, narrowed when thinking.
  const eye = (cx: number) => {
    if (mood === 'happy' || mood === 'proud') {
      return (
        <path
          key={cx}
          d={`M ${cx - 7} 46 q 7 -8 14 0`}
          stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none"
        />
      )
    }
    if (mood === 'thinking') {
      return (
        <rect
          key={cx}
          x={cx - 6.5} y={43} width={13} height={5} rx={2.5} fill={C.ink}
        />
      )
    }
    return (
      <g key={cx}>
        <circle cx={cx} cy={45} r={7} fill={C.ink} />
        <circle cx={cx + 2.4} cy={42.6} r={2.4} fill={C.white} />
      </g>
    )
  }

  const mouth =
    mood === 'oops'
      ? <path d="M 42 66 q 8 -6 16 0" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      : mood === 'thinking'
        ? <circle cx={50} cy={64} r={4} fill={C.ink} />
        : mood === 'proud' || mood === 'happy'
          ? <path d="M 39 60 q 11 13 22 0 z" fill={C.ink} />
          : <path d="M 41 61 q 9 8 18 0" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`EduBot mascot, ${mood}`}
      animate={
        still
          ? undefined
          : mood === 'happy' || mood === 'proud'
            ? { y: [0, -9, 0], rotate: [0, -4, 4, 0] }
            : mood === 'oops'
              ? { x: [0, -5, 5, -3, 0] }
              : { y: [0, -5, 0] }
      }
      transition={
        still
          ? undefined
          : mood === 'happy' || mood === 'proud'
            ? { duration: 0.7, ease: 'easeInOut' }
            : mood === 'oops'
              ? { duration: 0.45 }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {/* Antenna */}
      <line x1="50" y1="18" x2="50" y2="26" stroke={bodyColour} strokeWidth={5} strokeLinecap="round" />
      <motion.circle
        cx="50" cy="14" r="6" fill={mood === 'thinking' ? C.sun : bodyColour}
        animate={still || mood !== 'thinking' ? undefined : { scale: [1, 1.28, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ears */}
      <rect x="10" y="46" width="9" height="20" rx="4.5" fill={bodyColour} opacity={0.55} />
      <rect x="81" y="46" width="9" height="20" rx="4.5" fill={bodyColour} opacity={0.55} />

      {/* Head */}
      <rect x="17" y="26" width="66" height="58" rx="22" fill={bodyColour} />
      {/* Face plate */}
      <rect x="24" y="33" width="52" height="44" rx="17" fill={C.white} />

      {eye(39)}
      {eye(61)}
      {mouth}

      {/* Cheeks — the detail that makes it read as cute rather than technical. */}
      {(mood === 'happy' || mood === 'proud' || mood === 'idle') && (
        <>
          <ellipse cx="31" cy="58" rx="5.5" ry="3.6" fill={C.coral} opacity={0.5} />
          <ellipse cx="69" cy="58" rx="5.5" ry="3.6" fill={C.coral} opacity={0.5} />
        </>
      )}
    </motion.svg>
  )
}
