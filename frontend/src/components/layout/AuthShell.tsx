import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import Backdrop from '@/components/ui/Backdrop'

interface Props {
  greeting: string
  sub: string
  children: ReactNode
}

/** Shared frame for sign-in and sign-up. Mascot up top, form below. */
export default function AuthShell({ greeting, sub, children }: Props) {
  return (
    <div className="relative h-full w-full scroll-y" style={{ background: 'var(--bg)' }}>
      <Backdrop />
      <div className="relative min-h-full flex items-center justify-center px-[var(--gutter)] py-8" style={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="w-full max-w-[26rem]"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <Mascot size={112} mood="happy" />
            <h1 className="t-title mt-3">{greeting}</h1>
            <p className="t-body mt-1">{sub}</p>
          </div>

          <div className="card p-5">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}
