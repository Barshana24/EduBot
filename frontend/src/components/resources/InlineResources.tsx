import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Compass, ChevronDown } from 'lucide-react'
import { resourcesAPI } from '@/services/api'
import { EASE } from '@/lib/design'
import ResourceCard from './ResourceCard'

interface Props {
  /** The student's question, used to work out what to look up. */
  question: string
  subject?: string | null
}

/**
 * A collapsed "Learn more" strip under an answer. It only fetches once
 * opened, so a long thread doesn't fire a request per message.
 */
export default function InlineResources({ question, subject }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['resources', question, subject],
    queryFn: async () => (await resourcesAPI.forTopic(question, subject, 4)).data,
    enabled: open && question.trim().length > 2,
    staleTime: 10 * 60 * 1000,
  })

  if (!question.trim()) return null

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors"
        style={{
          background: open ? 'var(--sky-soft)' : 'transparent',
          color: open ? 'var(--sky-text)' : 'var(--ink-faint)',
        }}
      >
        <Compass size={14} strokeWidth={2.4} />
        <span className="font-display font-semibold text-[0.8rem]">
          {open ? 'Videos & links' : 'Want videos & links?'}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} strokeWidth={2.6} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 space-y-2">
              {isLoading && <p className="t-small px-1">Finding good ones…</p>}

              {data?.resources.map((r) => (
                <ResourceCard key={r.url} resource={r} compact />
              ))}

              {data && data.resources.length > 0 && (
                <button
                  onClick={() =>
                    navigate(`/resources?topic=${encodeURIComponent(question)}` +
                      (subject ? `&subject=${encodeURIComponent(subject)}` : ''))
                  }
                  className="btn btn-soft btn-sm w-full"
                >
                  See all resources
                </button>
              )}

              {data && data.resources.length === 0 && (
                <p className="t-small px-1">Nothing to suggest for that one.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
