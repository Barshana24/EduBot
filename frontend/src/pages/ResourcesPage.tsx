import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search } from 'lucide-react'
import { resourcesAPI } from '@/services/api'
import { useChatStore } from '@/store'
import { SUBJECTS, EASE } from '@/lib/design'
import Mascot from '@/components/ui/Mascot'
import ResourceCard from '@/components/resources/ResourceCard'
import type { Subject } from '@/types'

const IDEAS = [
  'Binary search trees', 'Kirchhoff’s laws', 'Backpropagation',
  'Database normalization', 'TCP vs UDP', 'CMOS inverter',
]

export default function ResourcesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const storeSubject = useChatStore((s) => s.selectedSubject)

  const [topic, setTopic] = useState(params.get('topic') ?? '')
  const [subject, setSubject] = useState(params.get('subject') ?? storeSubject ?? '')
  const [submitted, setSubmitted] = useState(params.get('topic') ?? '')

  // Keep the URL shareable and reloadable.
  useEffect(() => {
    const next = new URLSearchParams()
    if (submitted) next.set('topic', submitted)
    if (subject) next.set('subject', subject)
    setParams(next, { replace: true })
  }, [submitted, subject, setParams])

  const { data, isLoading } = useQuery({
    queryKey: ['resources-page', submitted, subject],
    queryFn: async () => (await resourcesAPI.forTopic(submitted, subject || null, 8)).data,
    enabled: submitted.trim().length > 1,
    staleTime: 10 * 60 * 1000,
  })

  const search = (value: string) => {
    setTopic(value)
    setSubmitted(value)
  }

  const videos = data?.resources.filter((r) => r.kind !== 'reference') ?? []
  const references = data?.resources.filter((r) => r.kind === 'reference') ?? []

  return (
    <div className="page scroll-y">
      <div className="page-inner">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm -ml-2 mb-2">
          <ArrowLeft size={17} /> Back
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <Mascot size={92} />
          <h1 className="t-title mt-2">Find more to learn from</h1>
          <p className="t-body mt-1">
            Free videos, full playlists and reference sites for any topic.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSubmitted(topic) }}
          className="card p-3.5 mb-4 space-y-2.5"
        >
          <label className="block">
            <span className="t-cap block mb-1.5">What do you want to study?</span>
            <span className="relative block">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--ink-faint)' }}
              />
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Binary search trees"
                aria-label="Topic"
                className="field pl-11"
              />
            </span>
          </label>

          <label className="block">
            <span className="t-cap block mb-1.5">Subject (helps narrow it down)</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="field field-select"
              aria-label="Subject"
            >
              <option value="">Any subject</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <button type="submit" disabled={topic.trim().length < 2} className="btn btn-primary w-full">
            Find resources
          </button>
        </form>

        {!submitted && (
          <div>
            <p className="t-cap mb-2.5">Try one of these</p>
            <div className="flex flex-wrap gap-2">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => search(idea)}
                  className="chip"
                  style={{ cursor: 'pointer' }}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && submitted && (
          <div className="grid place-items-center py-8">
            <Mascot size={64} mood="thinking" />
          </div>
        )}

        {data && data.resources.length > 0 && (
          <>
            <p className="t-cap mb-2.5">Watch</p>
            <div className="space-y-2.5 mb-6">
              {videos.map((r, i) => (
                <motion.div
                  key={r.url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: EASE }}
                >
                  <ResourceCard resource={r} />
                </motion.div>
              ))}
            </div>

            <p className="t-cap mb-2.5">Read</p>
            <div className="space-y-2.5">
              {references.map((r, i) => (
                <motion.div
                  key={r.url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (videos.length + i) * 0.05, ease: EASE }}
                >
                  <ResourceCard resource={r} />
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => {
                if (subject) useChatStore.getState().setSubject(subject as Subject)
                navigate('/chat')
              }}
              className="btn btn-soft w-full mt-6"
            >
              Ask EduBot about this instead
            </button>
          </>
        )}

        {data && submitted && data.resources.length === 0 && (
          <div className="card p-6 text-center">
            <p className="t-head">Nothing for that one</p>
            <p className="t-body mt-1">Try a shorter topic, like “binary trees”.</p>
          </div>
        )}
      </div>
    </div>
  )
}
