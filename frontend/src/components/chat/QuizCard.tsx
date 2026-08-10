import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Lightbulb, Brain, Trophy } from 'lucide-react'
import ConfettiBurst from '@/components/ui/ConfettiBurst'
import CountUp from '@/components/ui/CountUp'
import { ACCENTS, BOUNCE } from '@/lib/design'

interface Question {
  question: string
  options: Record<string, string>
  correct: string
  explanation?: string
}

function parseQuiz(content: string): Question[] | null {
  try {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    const parsed = JSON.parse(content.slice(start, end + 1))
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return null
    return parsed.questions
  } catch {
    return null
  }
}

export function isQuizContent(content: string): boolean {
  return parseQuiz(content) !== null
}

export default function QuizCard({ content }: { content: string }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [burst, setBurst] = useState(0)

  const questions = parseQuiz(content)
  if (!questions) return null

  const correct = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : 0
  const pct = Math.round((correct / questions.length) * 100)
  const answered = Object.keys(answers).length
  const xpEarned = correct * 15

  const verdict =
    pct >= 80 ? { text: 'Strong grasp of this topic.', accent: ACCENTS.mint }
    : pct >= 60 ? { text: 'Solid, with gaps worth another pass.', accent: ACCENTS.amber }
    : { text: 'Worth reviewing the fundamentals here.', accent: ACCENTS.rose }

  const handleSubmit = () => {
    setSubmitted(true)
    if (pct >= 60) setBurst((b) => b + 1)
  }

  return (
    <div className="space-y-3.5 w-full min-w-0 relative">
      <ConfettiBurst burstKey={burst} />

      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: ACCENTS.violet }}>
          <Brain size={13} color="#3A3226" strokeWidth={2.5} />
        </span>
        <span className="font-display text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>Quiz</span>
        <span className="text-[11px] font-bold" style={{ color: 'var(--text-lo)' }}>{questions.length} questions</span>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={BOUNCE}
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: verdict.accent }}
        >
          <div className="flex items-baseline gap-0.5">
            <span className="font-display text-2xl font-semibold" style={{ color: '#3A3226' }}><CountUp value={pct} /></span>
            <span className="text-xs font-extrabold" style={{ color: '#3A3226' }}>%</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold" style={{ color: '#3A3226' }}>{correct} of {questions.length} correct</p>
            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: 'rgba(58,50,38,0.75)' }}>{verdict.text}</p>
          </div>
          {xpEarned > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(58,50,38,0.18)', color: '#3A3226' }}>
              <Trophy size={12} /> +{xpEarned} XP
            </span>
          )}
        </motion.div>
      )}

      {questions.map((q, i) => (
        <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
          <p className="text-sm font-bold mb-3 flex gap-2.5" style={{ color: 'var(--text-hi)' }}>
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold flex-shrink-0 mt-0.5"
              style={{ background: ACCENTS.violet, color: '#3A3226' }}
            >
              {i + 1}
            </span>
            <span className="min-w-0">{q.question}</span>
          </p>

          <div className="space-y-1.5">
            {Object.entries(q.options).map(([key, val]) => {
              const isSelected = answers[i] === key
              const isCorrect = key === q.correct

              let bg = 'var(--surface)'
              let border = 'var(--border-soft)'
              let fg = 'var(--text-mid)'
              let badgeBg = 'var(--border-bold)'
              let badgeFg = 'var(--text-mid)'

              if (!submitted && isSelected) {
                bg = ACCENTS.violet; border = ACCENTS.violet; fg = '#3A3226'; badgeBg = '#3A3226'; badgeFg = ACCENTS.violet
              } else if (submitted && isCorrect) {
                bg = ACCENTS.mint; border = ACCENTS.mint; fg = '#3A3226'; badgeBg = '#3A3226'; badgeFg = ACCENTS.mint
              } else if (submitted && isSelected) {
                bg = ACCENTS.rose; border = ACCENTS.rose; fg = '#3A3226'; badgeBg = '#3A3226'; badgeFg = ACCENTS.rose
              }

              return (
                <button
                  key={key}
                  disabled={submitted}
                  onClick={() => setAnswers((p) => ({ ...p, [i]: key }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors disabled:cursor-default"
                  style={{ background: bg, border: `1px solid ${border}`, color: fg }}
                >
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold flex-shrink-0" style={{ background: badgeBg, color: badgeFg }}>
                    {key}
                  </span>
                  <span className="flex-1 min-w-0">{val}</span>
                  {submitted && isCorrect && <Check size={13} strokeWidth={3} className="flex-shrink-0" />}
                  {submitted && isSelected && !isCorrect && <X size={13} strokeWidth={3} className="flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {submitted && q.explanation && (
            <div className="flex gap-2.5 mt-3 p-3 rounded-xl" style={{ background: `${ACCENTS.amber}30`, border: `1px solid ${ACCENTS.amber}66` }}>
              <Lightbulb size={13} style={{ color: '#8B5A2B' }} className="flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-semibold" style={{ color: 'var(--text-mid)' }}>{q.explanation}</p>
            </div>
          )}
        </div>
      ))}

      {!submitted && (
        <button onClick={handleSubmit} disabled={answered < questions.length} className="btn-primary w-full py-2.5 text-[13px]">
          {answered < questions.length ? `${questions.length - answered} left to answer` : 'Check answers'}
        </button>
      )}
    </div>
  )
}
