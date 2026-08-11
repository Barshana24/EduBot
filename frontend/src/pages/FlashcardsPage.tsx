import { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Sparkles, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { quizAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import { SUBJECTS, LANGUAGES, subjectMeta, EASE } from '@/lib/design'
import { useCue, useReducedMotion } from '@/lib/hooks'
import Mascot from '@/components/ui/Mascot'
import Confetti from '@/components/ui/Confetti'
import type { FlashCard } from '@/types'

interface GenForm { subject: string; topic: string; language: string }

const RATINGS = [
  { value: 1, label: 'Not yet', bg: 'var(--coral)', shadow: 'var(--coral-dark)' },
  { value: 3, label: 'Almost',  bg: 'var(--sun)',   shadow: 'var(--sun-dark)' },
  { value: 5, label: 'Got it!', bg: 'var(--mint)',  shadow: 'var(--mint-dark)' },
]

const SWIPE = 100

export default function FlashcardsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const cue = useCue()
  const reduced = useReducedMotion()

  const [deck, setDeck] = useState<FlashCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [exitTo, setExitTo] = useState(0)
  const [burst, setBurst] = useState(0)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 0, 240], [-10, 0, 10])
  const gotIt = useTransform(x, [40, 130], [0, 1])
  const notYet = useTransform(x, [-130, -40], [1, 0])

  const { register, handleSubmit } = useForm<GenForm>({
    defaultValues: { language: user?.preferred_language || 'English' },
  })

  const { data: savedCards = [] } = useQuery<FlashCard[]>({
    queryKey: ['flashcards'],
    queryFn: async () => (await quizAPI.listFlashcards()).data,
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
      setIndex(0)
      setFlipped(false)
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
    } catch {
      toast.error("Couldn't build that deck")
    } finally {
      setGenerating(false)
    }
  }

  const rate = (confidence: number, direction = 0) => {
    const card = deck[index]
    if (card) reviewMutation.mutate({ cardId: card.id, confidence })
    cue(confidence >= 5 ? 'correct' : 'cardFlip')
    setExitTo(direction)
    x.set(0)
    setFlipped(false)
    if (index < deck.length - 1) setIndex((i) => i + 1)
    else { toast.success('Deck complete! 🎉'); setBurst((b) => b + 1); setIndex(0) }
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE) rate(5, 1)
    else if (info.offset.x < -SWIPE) rate(1, -1)
    else x.set(0)
  }

  const current = deck[index]
  const meta = subjectMeta(current?.subject)

  /* ══ Empty ══════════════════════════════════════════════ */
  if (deck.length === 0) {
    return (
      <div className="page scroll-y">
        <div className="page-inner">
          <div className="flex flex-col items-center text-center mb-7">
            <Mascot size={104} />
            <h1 className="t-title mt-3">Flashcards</h1>
            <p className="t-body mt-1">Twenty seconds a card beats an hour of rereading.</p>
          </div>

          <form onSubmit={handleSubmit(onGenerate)} className="card p-4 space-y-3.5">
            <label className="block">
              <span className="t-cap block mb-1.5">Subject</span>
              <select id="f-subject" {...register('subject', { required: true })} className="field field-select">
                <option value="">Choose one</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="t-cap block mb-1.5">Topic</span>
                <input id="f-topic" {...register('topic')} placeholder="Optional" className="field" />
              </label>
              <label className="block">
                <span className="t-cap block mb-1.5">Language</span>
                <select id="f-language" {...register('language')} className="field field-select">
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" disabled={generating} className="btn btn-primary w-full">
              {generating ? 'Making your deck…' : <><Sparkles size={18} /> Make a deck</>}
            </button>
          </form>

          {savedCards.length > 0 && (
            <section className="mt-7">
              <p className="t-cap mb-3">Saved cards · {savedCards.length}</p>
              <div className="space-y-2.5">
                {savedCards.slice(0, 10).map((card) => {
                  const cm = subjectMeta(card.subject)
                  return (
                    <div key={card.id} className="card p-3.5">
                      {/* Subject colours are fills; as text they fall under 3:1,
                          so the colour goes in the dot and the label stays legible. */}
                      <p className="t-cap mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cm.colour }} />
                        {cm.short}
                      </p>
                      <p className="font-display font-semibold mb-1" style={{ color: 'var(--ink)' }}>{card.front}</p>
                      <p className="t-small">{card.back}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="bar bar-thin flex-1 max-w-[120px]">
                          <span
                            className="bar-fill block"
                            style={{ width: `${(card.confidence_level / 5) * 100}%`, background: cm.colour }}
                          />
                        </span>
                        <span className="t-cap">{card.times_reviewed}×</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    )
  }

  /* ══ Deck ═══════════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'var(--hud-top)', paddingBottom: 'var(--tabs-bottom)' }}>
      <div className="shrink-0 px-[var(--gutter)] pt-3 pb-1">
        <div className="max-w-[30rem] mx-auto flex items-center gap-3">
          <span className="t-small shrink-0">{index + 1} / {deck.length}</span>
          <span className="bar bar-thin flex-1">
            <motion.span
              className="bar-fill block"
              animate={{ width: `${((index + 1) / deck.length) * 100}%` }}
              transition={{ ease: EASE }}
            />
          </span>
          <button onClick={() => setDeck([])} className="btn btn-ghost btn-sm shrink-0">Done</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-[var(--gutter)]">
        <p className="t-cap mb-2.5 flex items-center gap-1.5">
          <RotateCw size={11} /> Tap to flip · swipe to rate
        </p>

        <div
          className="relative w-full"
          style={{ maxWidth: 460, height: 'clamp(220px, 34vh, 300px)', perspective: 1400 }}
        >
          <Confetti burstKey={burst} />
          {deck.slice(index + 1, index + 3).map((c, i) => (
            <div
              key={c.id}
              className="card absolute inset-0"
              style={{
                transform: `translateY(${(i + 1) * 10}px) scale(${1 - (i + 1) * 0.04})`,
                opacity: 0.55 - i * 0.22,
              }}
            />
          ))}

          <AnimatePresence mode="popLayout">
            <motion.div
              key={current.id}
              className="absolute inset-0"
              style={{ x, rotate }}
              drag={reduced ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: exitTo * 400, rotate: exitTo * 14, transition: { duration: 0.26 } }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <motion.div
                className="relative w-full h-full cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                onClick={() => { cue('cardFlip'); setFlipped((f) => !f) }}
              >
                {/* Front */}
                <div
                  className="card absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                  style={{ backfaceVisibility: 'hidden', borderColor: meta.colour }}
                >
                  <span className="t-cap mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.colour }} />
                    {meta.short}
                  </span>
                  <p className="font-display font-semibold" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', lineHeight: 1.28, color: 'var(--ink)' }}>
                    {current.front}
                  </p>
                  <span className="t-cap mt-4">Tap to reveal</span>
                </div>

                {/* Back */}
                <div
                  className="card absolute inset-0 flex flex-col justify-center p-6 scroll-y"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'var(--brand-soft)',
                    borderColor: 'var(--brand)',
                  }}
                >
                  <span className="t-cap mb-2">Answer</span>
                  <p className="font-body font-bold" style={{ fontSize: '1rem', lineHeight: 1.55, color: 'var(--ink)' }}>
                    {current.back}
                  </p>
                </div>
              </motion.div>

              <motion.span
                className="absolute top-4 right-4 chip pointer-events-none"
                style={{ opacity: gotIt, background: 'var(--mint)', color: 'var(--on-accent)' }}
              >
                Got it!
              </motion.span>
              <motion.span
                className="absolute top-4 left-4 chip pointer-events-none"
                style={{ opacity: notYet, background: 'var(--coral)', color: 'var(--on-accent)' }}
              >
                Not yet
              </motion.span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 mt-6 w-full justify-center" style={{ maxWidth: 460 }}>
          <button
            onClick={() => { setIndex(Math.max(0, index - 1)); setFlipped(false); x.set(0) }}
            disabled={index === 0}
            className="icon-btn shrink-0"
            aria-label="Previous card"
          >
            <ChevronLeft size={20} />
          </button>

          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => rate(r.value, r.value === 5 ? 1 : r.value === 1 ? -1 : 0)}
              className="btn btn-sm flex-1"
              style={{ background: r.bg, color: 'var(--on-accent)', boxShadow: `0 4px 0 ${r.shadow}` }}
            >
              {r.label}
            </button>
          ))}

          <button
            onClick={() => { setIndex(Math.min(deck.length - 1, index + 1)); setFlipped(false); x.set(0) }}
            disabled={index === deck.length - 1}
            className="icon-btn shrink-0"
            aria-label="Next card"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
