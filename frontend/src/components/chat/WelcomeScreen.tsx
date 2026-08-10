import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useChatStore, useAuthStore } from '@/store'
import Mascot from '@/components/ui/Mascot'
import { subjectMeta, tint, EASE } from '@/lib/design'
import type { Subject } from '@/types'

const STARTERS: { text: string; subject: Subject }[] = [
  { text: "Explain Kirchhoff's laws with a worked example", subject: 'Electrical Engineering' },
  { text: 'How does a binary search tree stay balanced?',   subject: 'Data Structures' },
  { text: 'Walk me through backpropagation step by step',   subject: 'Machine Learning' },
  { text: 'What problem does database normalization solve?', subject: 'DBMS' },
]

export default function WelcomeScreen() {
  const { user } = useAuthStore()
  const { setSubject } = useChatStore()
  const name = user?.full_name?.split(' ')[0] || user?.username || 'there'

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-4"
      >
        <Mascot size={68} />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4, ease: EASE }}
        className="font-display text-2xl sm:text-3xl font-semibold mb-2" style={{ color: 'var(--text-hi)' }}
      >
        What are we learning, <span className="text-gradient">{name}</span>?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.4, ease: EASE }}
        className="text-sm max-w-md mb-7 font-semibold" style={{ color: 'var(--text-mid)' }}
      >
        Ask about any engineering concept — every question earns XP.
      </motion.p>

      <div className="w-full max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STARTERS.map((p, i) => {
            const meta = subjectMeta(p.subject)
            const Icon = meta.icon
            return (
              <motion.button
                key={p.text}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.05, ease: EASE }}
                whileHover={{ y: -3 }}
                onClick={() => setSubject(p.subject)}
                className="card card-interactive p-3.5 flex items-center gap-3 text-left group"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(meta.accent, 0.22) }}>
                  <Icon size={15} style={{ color: meta.accent }} strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold leading-snug" style={{ color: 'var(--text-hi)' }}>{p.text}</span>
                  <span className="block text-[10px] mt-1 font-semibold" style={{ color: 'var(--text-lo)' }}>{p.subject}</span>
                </span>
                <ArrowUpRight size={14} strokeWidth={2.25} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: meta.accent }} />
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
