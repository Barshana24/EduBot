import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import Mascot from '@/components/ui/Mascot'
import CountUp from '@/components/ui/CountUp'
import Confetti from '@/components/ui/Confetti'
import { C, EASE } from '@/lib/design'
import { useCue } from '@/lib/hooks'

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

/** A quiz EduBot wrote inline, answered right in the chat bubble. */
export default function QuizCard({ content }: { content: string }) {
  const cue = useCue()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [burst, setBurst] = useState(0)

  const questions = parseQuiz(content)
  if (!questions) return null

  const correct = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : 0
  const pct = Math.round((correct / questions.length) * 100)
  const answered = Object.keys(answers).length

  const submit = () => {
    setSubmitted(true)
    cue(pct >= 60 ? 'correct' : 'wrong')
    if (pct >= 60) setBurst((b) => b + 1)
  }

  return (
    <div className="w-full min-w-0 relative">
      <Confetti burstKey={burst} />
      <p className="t-cap mb-3">Quick quiz · {questions.length} questions</p>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          className="flex items-center gap-3 p-3 mb-4 rounded-[var(--r-md)]"
          style={{ background: pct >= 60 ? 'var(--mint-soft)' : 'var(--coral-soft)' }}
        >
          <Mascot size={48} mood={pct >= 60 ? 'happy' : 'oops'} still />
          <div className="min-w-0">
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--ink)' }}>
              <CountUp value={pct} />% · {correct}/{questions.length}
            </p>
            <p className="t-small">
              {pct >= 80 ? 'Nailed it!' : pct >= 60 ? 'Nice work!' : "Not yet — you're close."}
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="font-display font-semibold mb-2.5" style={{ color: 'var(--ink)' }}>
              {i + 1}. {q.question}
            </p>

            <div className="space-y-1.5">
              {Object.entries(q.options).map(([key, val]) => {
                const picked = answers[i] === key
                const isRight = key === q.correct

                let bg = 'var(--card-soft)'
                let border = 'var(--line)'
                let fg = 'var(--ink-soft)'
                if (!submitted && picked) { bg = 'var(--brand-soft)'; border = 'var(--brand)'; fg = 'var(--ink)' }
                else if (submitted && isRight) { bg = 'var(--mint-soft)'; border = 'var(--mint)'; fg = 'var(--ink)' }
                else if (submitted && picked) { bg = 'var(--coral-soft)'; border = 'var(--coral)'; fg = 'var(--ink)' }

                return (
                  <button
                    key={key}
                    disabled={submitted}
                    onClick={() => setAnswers((p) => ({ ...p, [i]: key }))}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left disabled:cursor-default font-body font-bold text-sm"
                    style={{ background: bg, border: `2px solid ${border}`, borderRadius: 'var(--r-md)', color: fg }}
                  >
                    <span
                      className="shrink-0 grid place-items-center font-display text-xs"
                      style={{
                        width: 24, height: 24, borderRadius: 8,
                        background: border === 'var(--line)' ? 'var(--line)' : border,
                        // Only the brand violet is dark enough for white text.
                        color: border === 'var(--line)' ? 'var(--ink-soft)'
                          : border === 'var(--brand)' ? '#fff' : 'var(--on-accent)',
                      }}
                    >
                      {key}
                    </span>
                    <span className="flex-1 min-w-0">{val}</span>
                    {submitted && isRight && <Check size={16} color={C.mint} strokeWidth={3} className="shrink-0" />}
                    {submitted && picked && !isRight && <X size={16} color={C.coral} strokeWidth={3} className="shrink-0" />}
                  </button>
                )
              })}
            </div>

            {submitted && q.explanation && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, ease: EASE }}
                className="t-small mt-2 px-3 py-2 rounded-[var(--r-sm)]"
                style={{ background: 'var(--sun-soft)' }}
              >
                💡 {q.explanation}
              </motion.p>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={submit}
          disabled={answered < questions.length}
          className="btn btn-primary btn-sm w-full mt-4"
        >
          {answered < questions.length ? `${questions.length - answered} left` : 'Check answers'}
        </button>
      )}
    </div>
  )
}
