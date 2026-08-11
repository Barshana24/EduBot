import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE } from '@/lib/design'

interface Props {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  /** Replay each time it scrolls into view rather than only the first time. */
  repeat?: boolean
}

/** Content that lifts into place when it reaches the viewport. */
export default function Reveal({ children, delay = 0, y = 20, className, repeat = false }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
