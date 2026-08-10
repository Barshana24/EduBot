import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Download, Check, X, RotateCcw, Lightbulb, Sparkles, Trophy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { quizAPI } from '@/services/api'
import { useAuthStore } from '@/store'
import PageHeader from '@/components/ui/PageHeader'
import ConfettiBurst from '@/components/ui/ConfettiBurst'
import CountUp from '@/components/ui/CountUp'
import { SUBJECTS, LANGUAGES, LEVELS, ACCENTS, EASE, BOUNCE, subjectMeta } from '@/lib/design'
import type { Quiz, QuizQuestion } from '@/types'

interface GenForm { subject: string; topic: string; difficulty: string; language: string }

export default function QuizPage() {
  const { user } = useAuthStore()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<{ score: number; questions: QuizQuestion[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [burst, setBurst] = useState(0)

  const { register, handleSubmit, formState: { errors } } = useForm<GenForm>({
    defaultValues: { difficulty: 'Intermediate', language: user?.preferred_language || 'English' },
  })

  const onGenerate = async (data: GenForm) => {
    setLoading(true)
    setQuiz(null); setResult(null); setAnswers({})
    try {
      const res = await quizAPI.generate(data)
      setQuiz(res.data)
      setStartTime(Date.now())
      toast.success('Quiz ready')
    } catch {
      toast.error("Couldn't build that quiz. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async () => {
    if (!quiz) return
    const missing = quiz.questions.filter((q) => !answers[q.id]).length
    if (missing > 0) {
      toast.error(`${missing} question${missing > 1 ? 's' : ''} still unanswered`)
      return
    }
    setSubmitting(true)
    try {
      const res = await quizAPI.submit(quiz.quiz_id, {
        answers: Object.entries(answers).map(([qid, answer]) => ({ question_id: parseInt(qid), answer })),
        time_taken_seconds: Math.round((Date.now() - startTime) / 1000),
      })
      setResult({ score: res.data.score, questions: res.data.questions })
      if (res.data.score >= 60) setBurst((b) => b + 1)
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

  const reset = () => { setQuiz(null); setResult(null); setAnswers({}) }
  const answered = Object.keys(answers).length
  const xpEarned = result ? Math.round(result.score / 100 * quiz!.total_questions) * 15 : 0
  const scoreAccent = !result
    ? ACCENTS.violet
    : result.score >= 80 ? ACCENTS.mint
    : result.score >= 60 ? ACCENTS.amber
    : ACCENTS.rose

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
        <PageHeader eyebrow="Quiz" title="Test what you know" subtitle="Pick a subject and EduBot writes the questions." icon={Brain} accent={ACCENTS.amber} />

        {!quiz && (
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }}
            onSubmit={handleSubmit(onGenerate)} className="card p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-eyebrow" htmlFor="q-subject">Subject</label>
                <select id="q-subject" {...register('subject', { required: 'Pick a subject' })} className="select-field">
                  <option value="">Choose one</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subject && <p className="text-xs font-bold mt-1.5" style={{ color: '#B5654A' }}>{errors.subject.message}</p>}
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="q-topic">Topic</label>
                <input id="q-topic" {...register('topic')} placeholder="Binary trees, PN junctions…" className="input-field" />
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="q-difficulty">Difficulty</label>
                <select id="q-difficulty" {...register('difficulty')} className="select-field">
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label-eyebrow" htmlFor="q-language">Language</label>
                <select id="q-language" {...register('language')} className="select-field">
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <><span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(58,50,38,0.3)', borderTopColor: '#3A3226' }} /> Writing questions</>
                : <><Sparkles size={15} /> Generate quiz</>}
            </button>
          </motion.form>
        )}

        <AnimatePresence>
          {result && quiz && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={BOUNCE}
              className="p-8 mb-6 text-center relative rounded-3xl overflow-hidden"
              style={{ background: scoreAccent }}
            >
              <ConfettiBurst burstKey={burst} />
              <p className="text-[11px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.18em', color: 'rgba(58,50,38,0.65)' }}>Your score</p>
              <p className="font-display text-6xl font-semibold leading-none mb-3" style={{ color: '#3A3226' }}>
                <CountUp value={Math.round(result.score)} /><span className="text-2xl">%</span>
              </p>
              <p className="text-sm mb-3 font-bold" style={{ color: 'rgba(58,50,38,0.8)' }}>
                {result.score >= 80 ? 'You know this material well.' : result.score >= 60 ? 'Close. Review the misses below.' : 'Worth another pass through the basics.'}
              </p>
              {xpEarned > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(58,50,38,0.18)', color: '#3A3226' }}>
                  <Trophy size={13} /> +{xpEarned} XP earned
                </span>
              )}
              <div className="flex gap-3 justify-center flex-wrap mt-2">
                <button onClick={reset} className="btn-secondary" style={{ background: '#FBF6EA', color: '#3A3226', border: '1px solid rgba(58,50,38,0.15)' }}>
                  <RotateCcw size={15} /> New quiz
                </button>
                <button onClick={downloadPDF} className="btn-secondary" style={{ background: 'rgba(251,246,234,0.5)', border: '1px solid rgba(58,50,38,0.2)', color: '#3A3226' }}>
                  <Download size={15} /> Download PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {quiz && !result && (
          <div className="space-y-4">
            <div className="card p-4 flex items-center justify-between gap-4 sticky top-0 z-10">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold truncate" style={{ color: 'var(--text-hi)' }}>{quiz.title}</p>
                <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--text-lo)' }}>{answered} of {quiz.total_questions} answered</p>
              </div>
              <div className="w-24 xp-track flex-shrink-0" style={{ height: 8 }}>
                <motion.div className="xp-fill h-full" animate={{ width: `${(answered / quiz.total_questions) * 100}%` }} transition={{ ease: EASE }} />
              </div>
            </div>

            {quiz.questions.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: EASE }} className="card p-5">
                <p className="text-sm font-bold mb-4 flex gap-3" style={{ color: 'var(--text-hi)' }}>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-extrabold flex-shrink-0" style={{ background: ACCENTS.violet, color: '#3A3226' }}>{i + 1}</span>
                  <span className="min-w-0 pt-0.5">{q.question_text}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(q.options).map(([key, val]) => {
                    const selected = answers[q.id] === key
                    return (
                      <button
                        key={key}
                        onClick={() => setAnswers((p) => ({ ...p, [q.id]: key }))}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-left transition-colors"
                        style={{ background: selected ? ACCENTS.violet : 'var(--surface-2)', border: `1px solid ${selected ? ACCENTS.violet : 'var(--border-soft)'}`, color: selected ? '#3A3226' : 'var(--text-mid)' }}
                      >
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold flex-shrink-0" style={{ background: selected ? '#3A3226' : 'var(--border-bold)', color: selected ? ACCENTS.violet : 'var(--text-mid)' }}>{key}</span>
                        <span className="flex-1 min-w-0">{val}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}

            <div className="flex gap-3 pt-1">
              <button onClick={onSubmit} disabled={submitting || answered < quiz.total_questions} className="btn-primary flex-1">
                {submitting ? <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(58,50,38,0.3)', borderTopColor: '#3A3226' }} /> : 'Submit answers'}
              </button>
              <button onClick={reset} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {result && quiz && (
          <div className="space-y-4 mt-8">
            <h2 className="text-[11px] font-extrabold uppercase mb-1" style={{ letterSpacing: '0.18em', color: 'var(--text-lo)' }}>Review</h2>
            {result.questions.map((q, i) => {
              const accent = q.is_correct ? ACCENTS.mint : ACCENTS.rose
              return (
                <motion.div key={q.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease: EASE }} className="card p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent }}>
                      {q.is_correct ? <Check size={13} color="#3A3226" strokeWidth={3} /> : <X size={13} color="#3A3226" strokeWidth={3} />}
                    </span>
                    <p className="text-sm font-bold min-w-0" style={{ color: 'var(--text-hi)' }}>{q.question_text}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {Object.entries(q.options).map(([key, val]) => {
                      const isAnswer = key === q.correct_answer
                      const wasPicked = key === q.user_answer && !q.is_correct
                      const optAccent = isAnswer ? ACCENTS.mint : wasPicked ? ACCENTS.rose : null
                      return (
                        <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold" style={{ background: optAccent ?? 'var(--surface-2)', border: `1px solid ${optAccent ?? 'var(--border-soft)'}`, color: optAccent ? '#3A3226' : 'var(--text-lo)' }}>
                          <span className="font-extrabold flex-shrink-0">{key}</span>
                          <span className="min-w-0">{val}</span>
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <div className="flex gap-2.5 p-3 rounded-xl" style={{ background: `${ACCENTS.amber}30`, border: `1px solid ${ACCENTS.amber}66` }}>
                      <Lightbulb size={13} style={{ color: '#8B5A2B' }} className="flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed font-semibold" style={{ color: 'var(--text-mid)' }}>{q.explanation}</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {!quiz && (
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {SUBJECTS.slice(0, 8).map((s) => {
              const meta = subjectMeta(s)
              const Icon = meta.icon
              return (
                <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold" style={{ background: meta.accent, color: '#3A3226' }}>
                  <Icon size={11} strokeWidth={2.5} /> {s}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
