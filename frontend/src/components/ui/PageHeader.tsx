import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { tint, EASE } from '@/lib/design'

interface Props {
  eyebrow: string
  title: string
  subtitle: string
  icon: LucideIcon
  accent: string
  action?: React.ReactNode
}

export default function PageHeader({ eyebrow, title, subtitle, icon: Icon, accent, action }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mb-8 flex flex-wrap items-start justify-between gap-4"
    >
      <div className="flex items-start gap-4 min-w-0">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tint(accent, 0.24) }}>
          <Icon size={20} style={{ color: accent }} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase mb-1.5" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight" style={{ color: 'var(--text-hi)' }}>
            {title}
          </h1>
          <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--text-mid)' }}>{subtitle}</p>
        </div>
      </div>
      {action}
    </motion.header>
  )
}
