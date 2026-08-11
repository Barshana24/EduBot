import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store'
import { subjectMeta, EASE } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import type { Subject } from '@/types'

const STARTERS: { text: string; subject: Subject }[] = [
  { text: "Explain Kirchhoff's laws",       subject: 'Electrical Engineering' },
  { text: 'How do binary search trees work?', subject: 'Data Structures' },
  { text: 'Walk me through backpropagation', subject: 'Machine Learning' },
  { text: 'Why does normalization matter?',  subject: 'DBMS' },
]

/** The empty chat: mascot, a greeting, and four things to tap. */
export default function Welcome({ onAsk }: { onAsk: (q: string, s: Subject) => void }) {
  const { user } = useAuthStore()
  const name = user?.full_name?.split(' ')[0] || user?.username || 'there'

  return (
    <div className="flex flex-col items-center text-center px-[var(--gutter)] py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        // Smaller on short phones so the fourth card still clears the composer.
        className="w-[84px] sm:w-[112px]"
      >
        <Mascot size="100%" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
        className="t-title mt-4"
      >
        Hi {name}! 👋
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.4, ease: EASE }}
        className="t-body mt-1.5 mb-6"
      >
        What are we learning today?
      </motion.p>

      <div className="w-full max-w-[26rem] space-y-2.5">
        {STARTERS.map((s, i) => {
          const meta = subjectMeta(s.subject)
          const Icon = meta.icon
          return (
            <motion.button
              key={s.text}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.06, duration: 0.4, ease: EASE }}
              onClick={() => onAsk(s.text, s.subject)}
              className="card card-tap w-full flex items-center gap-3 p-3.5 text-left"
            >
              <span
                className="shrink-0 grid place-items-center"
                style={{ width: 42, height: 42, borderRadius: 14, background: `${meta.colour}22` }}
              >
                <Icon size={20} style={{ color: meta.colour }} strokeWidth={2.4} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display font-semibold" style={{ color: 'var(--ink)' }}>
                  {s.text}
                </span>
                <span className="block t-cap mt-0.5">{meta.short}</span>
              </span>
              <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} className="shrink-0" />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
