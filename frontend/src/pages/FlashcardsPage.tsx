import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Sparkles, ThumbsUp, ThumbsDown, Minus,
  ChevronLeft, ChevronRight, RotateCw,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { quizAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import PageHeader from '@/components/ui/PageHeader'
import { SUBJECTS, LANGUAGES, ACCENTS, EASE, subjectMeta } from '@/lib/design'
import type { FlashCard } from '@/types'

interface GenForm { subject: string; topic: string; language: string }

const RATINGS = [
  { value: 1, label: 'Hard', icon: ThumbsDown, accent: ACCENTS.rose  },
  { value: 3, label: 'Okay', icon: Minus,      accent: ACCENTS.amber },
  { value: 5, label: 'Easy', icon: ThumbsUp,   accent: ACCENTS.mint  },
]

export default function FlashcardsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [deck, setDeck] = useState<FlashCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [filterSubject, setFilterSubject] = useState('')

  const { register, handleSubmit } = useForm<GenForm>({
    defaultValues: { language: user?.preferred_language || 'English' },
  })

  const { data: savedCards = [] } = useQuery<FlashCard[]>({
    queryKey: ['flashcards', filterSubject],
    queryFn: async () => {
      const res = await quizAPI.listFlashcards(filterSubject || undefined)
      return res.data
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, confidence }: { cardId: number; confidence: number }) =>
      quizAPI.reviewFlashcard(cardId, confidence),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcards'] }),
  })

  const onGenerate = async (data: GenForm) => {
    setGenerating(true)
    try {
      const res = await quizAPI.generateFlashcards(data)
      setDeck(res.data.flashcards.map((c: Omit<FlashCard, 'confidence_level' | 'times_reviewed'>) => ({
        ...c, confidence_level: 0, times_reviewed: 0,
      })))
      setCurrentIdx(0)
      setIsFlipped(false)
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      toast.success(`${res.data.count} cards ready`)
    } catch {
      toast.error("Couldn't build that deck")
    } finally {
      setGenerating(false)
    }
  }

  const handleRate = (confidence: number) => {
    if (deck[currentIdx]) reviewMutation.mutate({ cardId: deck[currentIdx].id, confidence })
    setIsFlipped(false)
    setTimeout(() => {
      if (currentIdx < deck.length - 1) setCurrentIdx((i) => i + 1)
      else { toast.success('Deck complete'); setCurrentIdx(0) }
    }, 320)
  }

  const current = deck[currentIdx]
  const progress = deck.length > 0 ? (currentIdx / deck.length) * 100 : 0

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-10">
        <PageHeader eyebrow="Flashcards" title="Drill the details" subtitle="Generate a deck, rate each card, and let spacing do the rest." icon={Layers} accent={ACCENTS.rose} />

        <form onSubmit={handleSubmit(onGenerate)} className="card p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="label-eyebrow" htmlFor="f-subject">Subject</label>
              <select id="f-subject" {...register('subject', { required: true })} className="select-field !py-2.5 !text-xs">
                <option value="">Choose one</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-eyebrow" htmlFor="f-topic">Topic</label>
              <input id="f-topic" {...register('topic')} placeholder="Optional" className="input-field !py-2.5 !text-xs" />
            </div>
            <div>
              <label className="label-eyebrow" htmlFor="f-language">Language</label>
              <select id="f-language" {...register('language')} className="select-field !py-2.5 !text-xs">
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={generating} className="btn-primary w-full py-2.5 text-[13px]">
            {generating
              ? <><span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(58,50,38,0.3)', borderTopColor: '#3A3226' }} /> Building deck</>
              : <><Sparkles size={15} /> Generate deck</>}
          </button>
        </form>

        {deck.length > 0 && current && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>
                Card {currentIdx + 1} of {deck.length}
              </p>
              <p className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--text-lo)' }}>
                <RotateCw size={11} /> Click to flip
              </p>
            </div>

            <div className="xp-track mb-6" style={{ height: 8 }}>
              <motion.div className="xp-fill h-full" animate={{ width: `${progress}%` }} transition={{ ease: EASE }} />
            </div>

            <div className="mb-6 cursor-pointer select-none" style={{ perspective: '1400px' }} onClick={() => setIsFlipped(!isFlipped)}>
              <motion.div
                className="relative w-full"
                style={{ height: '240px', transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <div
                  className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
                  style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #E0A85C 0%, #D98F72 100%)' }}
                >
                  <span className="text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.2em', color: 'rgba(58,50,38,0.6)' }}>Question</span>
                  <p className="font-display text-lg font-semibold leading-relaxed" style={{ color: '#3A3226' }}>{current.front}</p>
                </div>
                <div
                  className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--surface)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-soft)' }}
                >
                  <span className="text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.2em', color: 'var(--text-lo)' }}>Answer</span>
                  <p className="text-sm leading-relaxed font-semibold" style={{ color: 'var(--text-hi)' }}>{current.back}</p>
                </div>
              </motion.div>
            </div>

            <AnimatePresence>
              {isFlipped && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ ease: EASE }} className="flex gap-2.5 justify-center">
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRate(r.value)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-transform hover:-translate-y-0.5"
                      style={{ background: r.accent, color: '#3A3226' }}
                    >
                      <r.icon size={14} strokeWidth={2.5} /> {r.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-5">
              <button onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setIsFlipped(false) }} disabled={currentIdx === 0} className="icon-btn disabled:opacity-25" aria-label="Previous card">
                <ChevronLeft size={17} />
              </button>
              <button onClick={() => { setCurrentIdx(Math.min(deck.length - 1, currentIdx + 1)); setIsFlipped(false) }} disabled={currentIdx === deck.length - 1} className="icon-btn disabled:opacity-25" aria-label="Next card">
                <ChevronRight size={17} />
              </button>
            </div>
          </section>
        )}

        {savedCards.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-[11px] font-extrabold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--text-lo)' }}>Saved cards</h2>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="select-field !py-1.5 !text-[11px] !rounded-full !w-auto" aria-label="Filter by subject">
                <option value="">All subjects</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2.5">
              {savedCards.slice(0, 12).map((card, i) => {
                const meta = subjectMeta(card.subject)
                const Icon = meta.icon
                return (
                  <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3), ease: EASE }} className="card card-interactive p-4 flex gap-3.5">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.accent }}>
                      <Icon size={15} color="#3A3226" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-hi)' }}>{card.front}</p>
                      <p className="text-[11px] leading-relaxed font-medium" style={{ color: 'var(--text-mid)' }}>{card.back}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className="w-4 h-1 rounded-full" style={{ background: n <= card.confidence_level ? meta.accent : 'var(--border-bold)' }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-lo)' }}>{card.times_reviewed} reviews</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {deck.length === 0 && savedCards.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: ACCENTS.rose }}>
              <Layers size={22} color="#3A3226" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-hi)' }}>No cards yet</h3>
            <p className="text-sm max-w-xs mx-auto font-semibold" style={{ color: 'var(--text-mid)' }}>Pick a subject above and generate your first deck.</p>
          </div>
        )}
      </div>
    </div>
  )
}
