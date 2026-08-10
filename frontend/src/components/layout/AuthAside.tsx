import { motion } from 'framer-motion'
import Mascot from '@/components/ui/Mascot'
import { SUBJECT_META, LANGUAGE_GLYPH, LANGUAGES, tint, EASE } from '@/lib/design'

const SUBJECT_ENTRIES = Object.entries(SUBJECT_META)

/**
 * Left panel on auth screens. The subject shelf is the signature element: every
 * subject EduBot teaches, laid out like books settling onto a shelf.
 */
export default function AuthAside() {
  return (
    <aside
      className="relative z-10 hidden lg:flex flex-col justify-between w-[46%] max-w-[560px] px-12 py-12"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl relative"
          style={{ background: 'linear-gradient(160deg, #9C6B3B, #7A4A22)' }}
        >
          <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-black/25" />
          <span className="absolute right-2 top-1.5 w-1.5 h-1.5 rounded-full bg-black/25" />
          <div className="w-7 h-7 rounded-full bg-[#FBF6EA] flex items-center justify-center flex-shrink-0">
            <span style={{ fontSize: 14 }}>📖</span>
          </div>
          <span className="font-display text-base font-semibold" style={{ color: '#FBF6EA' }}>EduBot</span>
        </div>
      </div>

      <div>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="mb-5"
        >
          <Mascot size={72} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: EASE }}
          className="font-display text-[2.3rem] leading-[1.15] font-semibold mb-4"
          style={{ color: '#FBF6EA' }}
        >
          Engineering, explained<br />in <span style={{ color: '#E0A85C' }}>your language</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.5, ease: EASE }}
          className="text-sm max-w-sm mb-10 font-semibold" style={{ color: 'rgba(245,237,220,0.7)' }}
        >
          Thirteen subjects, eight languages, three levels of depth. Earn XP with every
          question, quiz, and streak.
        </motion.p>

        <div className="grid grid-cols-7 gap-2 max-w-[380px] mb-8">
          {SUBJECT_ENTRIES.map(([subject, meta], i) => {
            const Icon = meta.icon
            return (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.035, duration: 0.3, ease: EASE }}
                title={subject}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: tint(meta.accent, 0.9) }}
              >
                <Icon size={14} color="#3A3226" strokeWidth={2.25} />
              </motion.div>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }} className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => (
            <span key={l} title={l} className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(245,237,220,0.75)' }}>
              {LANGUAGE_GLYPH[l]}
            </span>
          ))}
        </motion.div>
      </div>

      <p className="text-[11px] font-semibold" style={{ color: 'rgba(245,237,220,0.45)' }}>
        Runs on your own machine. Your notes never leave it.
      </p>
    </aside>
  )
}
