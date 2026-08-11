import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { motion } from 'framer-motion'
import { Copy, Check, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import SyntaxHighlighter, { codeTheme } from './highlighter'
import Mascot from '@/components/ui/Mascot'
import { C, EASE } from '@/lib/design'
import QuizCard, { isQuizContent } from './QuizCard'
import InlineResources from '@/components/resources/InlineResources'
import type { Message } from '@/types'

/* Engineering answers are full of equations; without remark-math the
 * model's LaTeX renders as raw $$\sum I$$ noise. */
const REMARK = [remarkGfm, remarkMath]
const REHYPE = [rehypeKatex]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copied!')
        setTimeout(() => setCopied(false), 1600)
      }}
      className="icon-btn !w-8 !h-8"
      aria-label="Copy answer"
    >
      {copied ? <Check size={14} color={C.mint} /> : <Copy size={14} />}
    </button>
  )
}

const markdownComponents = {
  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || '')
    const code = String(children).replace(/\n$/, '')
    if (!match) return <code className={className}>{children}</code>

    return (
      <div
        className="my-3 overflow-hidden"
        style={{ border: '2px solid var(--line)', borderRadius: 'var(--r-md)' }}
      >
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ background: 'var(--card-soft)', borderBottom: '2px solid var(--line)' }}
        >
          <span className="t-cap">{match[1]}</span>
          <CopyButton text={code} />
        </div>
        <SyntaxHighlighter
          style={codeTheme}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0, borderRadius: 0, fontSize: '12.5px',
            background: 'var(--card-soft)', padding: '12px',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
  },
}

/** What the student said. */
export function UserBubble({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="flex justify-end mb-4"
    >
      <p
        className="max-w-[85%] px-4 py-3 font-body font-bold text-white whitespace-pre-wrap break-words"
        style={{
          background: C.brand,
          borderRadius: '22px 22px 6px 22px',
          boxShadow: '0 3px 0 var(--brand-dark)',
        }}
      >
        {content}
      </p>
    </motion.div>
  )
}

interface BotProps {
  message: Message
  onSpeak: () => void
  isSpeaking: boolean
  /** The question this answers, so the resource strip knows what to look up. */
  question?: string
  subject?: string | null
}

/** What Bo said back. */
export function BotBubble({ message, onSpeak, isSpeaking, question, subject }: BotProps) {
  const quiz = isQuizContent(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex gap-2.5 mb-5 group"
    >
      <div className="shrink-0 pt-1">
        <Mascot size={38} still />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="card px-4 py-3.5 min-w-0"
          style={{ borderRadius: '6px 22px 22px 22px' }}
        >
          {quiz ? (
            <QuizCard content={message.content} />
          ) : (
            <div className="answer min-w-0">
              <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Suggested videos and reading for whatever was just asked.
            Hidden for inline quizzes, where links would be a distraction. */}
        {question && !quiz && <InlineResources question={question} subject={subject} />}

        <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <CopyButton text={message.content} />
          <button
            onClick={onSpeak}
            className="icon-btn !w-8 !h-8"
            aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
          >
            {isSpeaking ? <VolumeX size={14} color={C.coral} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/** The answer as it arrives, before it becomes a stored message. */
export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5 mb-5">
      <div className="shrink-0 pt-1">
        <Mascot size={38} mood="thinking" still />
      </div>
      <div className="min-w-0 flex-1">
        <div className="card px-4 py-3.5 min-w-0" style={{ borderRadius: '6px 22px 22px 22px' }}>
          <div className="answer min-w-0">
            <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
