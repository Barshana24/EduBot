import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, RotateCcw, ArrowLeft, Sparkles, Check, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { quizAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import { SUBJECTS, LANGUAGES, LEVELS, C, EASE } from '@/lib/design'
import { useCue } from '@/lib/hooks'
import Mascot from '@/components/ui/Mascot'
import CountUp from '@/components/ui/CountUp'
import Confetti from '@/components/ui/Confetti'
import type { Quiz, QuizQuestion } from '@/types'

interface GenForm { subject: string; topic: string; difficulty: string; language: string }

export default function QuizPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const cue = useCue()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<{ score: number; questions: QuizQuestion[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [burst, setBurst] = useState(0)
  const startedAt = useRef(0)

  const { register, handleSubmit, formState: { errors } } = useForm<GenForm>({
    defaultValues: { difficulty: 'Intermediate', language: user?.preferred_language || 'English' },
  })

  const question = quiz?.questions[index]
  const answered = Object.keys(answers).length
  const total = quiz?.total_questions ?? 0

  const onGenerate = async (data: GenForm) => {
    setLoading(true)
    setQuiz(null); setResult(null); setAnswers({}); setIndex(0)
    try {
      const res = await quizAPI.generate(data)
      setQuiz(res.data)
      startedAt.current = Date.now()
    } catch {
      toast.error("Couldn't build that quiz. Try again!")
    } finally {
      setLoading(false)
    }
  }

  const pick = (key: string) => {
    if (!question) return
    cue('tap')
    setAnswers((p) => ({ ...p, [question.id]: key }))
    if (index < (quiz?.questions.length ?? 0) - 1) {
      setTimeout(() => setIndex((i) => i + 1), 240)
    }
  }

  const submit = async () => {
    if (!quiz) return
    const missing = quiz.questions.filter((q) => !answers[q.id])
    if (missing.length > 0) {
      setIndex(quiz.questions.indexOf(missing[0]))
      toast.error(`${missing.length} still to answer`)
      return
    }
    setSubmitting(true)
    try {
      const res = await quizAPI.submit(quiz.quiz_id, {
        answers: Object.entries(answers).map(([qid, answer]) => ({ question_id: parseInt(qid), answer })),
        time_taken_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      })
      setResult({ score: res.data.score, questions: res.data.questions })
      cue(res.data.score >= 60 ? 'correct' : 'wrong')
      if (res.data.score >= 60) setBurst((b) => b + 1)
      queryClient.invalidateQueries({ queryKey: ['progress-overview'] })
    } catch {
      toast.error("Couldn't submit your answers")
    } finally {
      setSubmitting(false)
    }
  }

  const downloadPDF = async () => {
    if (!quiz) return
    try {
      const res = await quizAPI.downloadPDF(quiz.quiz_id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `edubot-quiz-${quiz.quiz_id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Couldn't build the PDF")
    }
  }

  const reset = () => { setQuiz(null); setResult(null); setAnswers({}); setIndex(0) }

  // A–D answers the current question.
  useEffect(() => {
    if (!quiz || result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const letter = e.key.toUpperCase()
      if (question && Object.keys(question.options).includes(letter)) pick(letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ══ Setup ══════════════════════════════════════════════ */
  if (!quiz) {
    return (
      <div className="page scroll-y">
        <div className="page-inner">
          <div className="flex flex-col items-center text-center mb-7">
            <Mascot size={104} />
            <h1 className="t-title mt-3">Quiz time!</h1>
            <p className="t-body mt-1">Pick a subject and I'll write the questions.</p>
          </div>

          <form onSubmit={handleSubmit(onGenerate)} className="card p-4 space-y-3.5">
            <label className="block">
              <span className="t-cap block mb-1.5">Subject</span>
              <select id="q-subject" {...register('subject', { required: 'Pick a subject first' })} className="field field-select">
                <option value="">Choose one</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && (
                <span className="t-small block mt-1.5" style={{ color: 'var(--coral-text)' }}>{errors.subject.message}</span>
              )}
            </label>

            <label className="block">
              <span className="t-cap block mb-1.5">Topic (optional)</span>
              <input id="q-topic" {...register('topic')} placeholder="Binary trees, PN junctions…" className="field" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="t-cap block mb-1.5">Difficulty</span>
                <select id="q-difficulty" {...register('difficulty')} className="field field-select">
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="t-cap block mb-1.5">Language</span>
                <select id="q-language" {...register('language')} className="field field-select">
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Writing your quiz…' : <><Sparkles size={18} /> Start quiz</>}
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ══ Result ═════════════════════════════════════════════ */
  if (result) {
    const pct = Math.round(result.score)
    const great = pct >= 80
    const ok = pct >= 60
    const correctCount = result.questions.filter((q) => q.is_correct).length

    return (
      <div className="page scroll-y">
        <div className="page-inner">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="card p-6 text-center mb-5 relative overflow-hidden"
            style={{ background: great ? 'var(--mint-soft)' : ok ? 'var(--sun-soft)' : 'var(--coral-soft)' }}
          >
            <Confetti burstKey={burst} />
            <Mascot size={112} mood={ok ? 'proud' : 'oops'} />
            <p className="t-num mt-2" style={{ fontSize: 'clamp(3rem, 12vw, 4.5rem)', lineHeight: 1 }}>
              <CountUp value={pct} duration={1.2} />%
            </p>
            <p className="t-head mt-1">
              {great ? 'Amazing work!' : ok ? 'Nice one!' : 'Good try!'}
            </p>
            <p className="t-body mt-1">
              You got {correctCount} of {result.questions.length} right
            </p>

            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="chip" style={{ background: 'var(--card)', color: 'var(--brand)' }}>
                +{correctCount * 15} XP
              </span>
            </div>

            <div className="flex gap-2.5 justify-center mt-5 flex-wrap">
              <button onClick={reset} className="btn btn-primary btn-sm">
                <RotateCcw size={16} /> Try another
              </button>
              <button onClick={downloadPDF} className="btn btn-soft btn-sm">
                <Download size={16} /> Save PDF
              </button>
            </div>
          </motion.div>

          <p className="t-cap mb-3">Let's look at the answers</p>

          <div className="space-y-3">
            {result.questions.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.35, ease: EASE }}
                className="card p-4"
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span
                    className="shrink-0 grid place-items-center mt-0.5"
                    style={{
                      width: 26, height: 26, borderRadius: 9,
                      background: q.is_correct ? 'var(--mint)' : 'var(--coral)',
                    }}
                  >
                    {q.is_correct
                      ? <Check size={15} color={C.ink} strokeWidth={3.2} />
                      : <X size={15} color={C.ink} strokeWidth={3.2} />}
                  </span>
                  <p className="font-display font-semibold min-w-0" style={{ color: 'var(--ink)' }}>
                    {q.question_text}
                  </p>
                </div>

                <div className="space-y-1.5 mb-2.5">
                  {Object.entries(q.options).map(([key, val]) => {
                    const isAnswer = key === q.correct_answer
                    const wasPicked = key === q.user_answer && !q.is_correct
                    if (!isAnswer && !wasPicked) return null
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2.5 px-3 py-2 font-body font-bold text-sm"
                        style={{
                          background: isAnswer ? 'var(--mint-soft)' : 'var(--coral-soft)',
                          border: `2px solid ${isAnswer ? 'var(--mint)' : 'var(--coral)'}`,
                          borderRadius: 'var(--r-md)',
                          color: 'var(--ink)',
                        }}
                      >
                        <span className="t-cap shrink-0" style={{ color: isAnswer ? C.mint : C.coral }}>
                          {isAnswer ? 'Correct' : 'You said'}
                        </span>
                        <span className="min-w-0">{val}</span>
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <p className="t-small px-3 py-2 rounded-[var(--r-sm)]" style={{ background: 'var(--sun-soft)' }}>
                    💡 {q.explanation}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ══ Challenge ══════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'var(--hud-top)', paddingBottom: 'var(--tabs-bottom)' }}>
      <div className="shrink-0 px-[var(--gutter)] pt-3 pb-2">
        <div className="max-w-[46rem] mx-auto flex items-center gap-3">
          <button onClick={reset} className="icon-btn shrink-0" aria-label="Leave quiz">
            <ArrowLeft size={20} />
          </button>
          <span className="bar flex-1">
            <motion.span
              className="bar-fill block"
              animate={{ width: `${(answered / total) * 100}%` }}
              transition={{ ease: EASE }}
            />
          </span>
          <span className="t-small shrink-0">{answered}/{total}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 scroll-y px-[var(--gutter)]">
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="max-w-[46rem] mx-auto py-4"
            >
              <div className="flex items-start gap-3 mb-6">
                <Mascot size={54} still className="shrink-0" />
                <div
                  className="card px-4 py-3 flex-1 min-w-0"
                  style={{ borderRadius: '6px 22px 22px 22px' }}
                >
                  <p className="t-cap mb-1">Question {index + 1}</p>
                  <h2 className="font-display font-semibold" style={{ fontSize: '1.15rem', lineHeight: 1.32, color: 'var(--ink)' }}>
                    {question.question_text}
                  </h2>
                </div>
              </div>

              <div className="space-y-2.5">
                {Object.entries(question.options).map(([key, val], oi) => {
                  const picked = answers[question.id] === key
                  return (
                    <motion.button
                      key={key}
                      onClick={() => pick(key)}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + oi * 0.05, ease: EASE }}
                      whileTap={{ scale: 0.985 }}
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                      style={{
                        background: picked ? 'var(--brand-soft)' : 'var(--card)',
                        border: `2px solid ${picked ? 'var(--brand)' : 'var(--line)'}`,
                        borderRadius: 'var(--r-lg)',
                        boxShadow: picked ? '0 3px 0 var(--brand)' : 'var(--shadow-card)',
                      }}
                    >
                      <span
                        className="shrink-0 grid place-items-center font-display font-semibold"
                        style={{
                          width: 34, height: 34, borderRadius: 11,
                          background: picked ? 'var(--brand)' : 'var(--card-soft)',
                          color: picked ? '#fff' : 'var(--ink-soft)',
                        }}
                      >
                        {key}
                      </span>
                      <span
                        className="flex-1 min-w-0 font-body font-bold"
                        style={{ color: picked ? 'var(--ink)' : 'var(--ink-soft)' }}
                      >
                        {val}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 px-[var(--gutter)] py-3">
        <div className="max-w-[46rem] mx-auto flex gap-2.5">
          {index > 0 && (
            <button onClick={() => setIndex((i) => i - 1)} className="btn btn-soft shrink-0" aria-label="Previous question">
              <ArrowLeft size={18} />
            </button>
          )}
          {index < (quiz.questions.length - 1) ? (
            <button onClick={() => setIndex((i) => i + 1)} className="btn btn-soft flex-1">
              Skip
            </button>
          ) : (
            <button onClick={submit} disabled={submitting || answered < total} className="btn btn-happy flex-1">
              {submitting ? 'Checking…' : answered < total ? `${total - answered} left` : 'Finish quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
