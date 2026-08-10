import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Volume2, VolumeX } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Logo from '@/components/ui/Logo'
import type { Message } from '@/types'
import QuizCard, { isQuizContent } from './QuizCard'

interface Props {
  message: Message
  onSpeak: () => void
  isSpeaking: boolean
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="icon-btn !p-1.5 !rounded-lg"
      aria-label={label || 'Copy'}
    >
      {copied
        ? <Check size={12} style={{ color: '#8FAE7D' }} />
        : <Copy size={12} />}
    </button>
  )
}

export function BotAvatar({ thinking = false }: { thinking?: boolean }) {
  return (
    <div
      className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-soft)' }}
    >
      <Logo size={24} thinking={thinking} />
    </div>
  )
}

export default function ChatMessage({ message, onSpeak, isSpeaking }: Props) {
  const isUser = message.role === 'user'
  const time = message.created_at ? format(new Date(message.created_at), 'h:mm a') : ''

  return (
    <div className={`flex gap-3 items-start group ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div
          className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-extrabold"
          style={{ background: '#8FAE7D', color: '#3A3226' }}
        >
          You
        </div>
      ) : (
        <BotAvatar />
      )}

      <div className={`flex flex-col gap-1.5 max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="message-user">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        ) : (
          <div className="message-bot min-w-0">
            {isQuizContent(message.content) ? (
              <QuizCard content={message.content} />
            ) : (
              <div className="prose-edubot text-sm min-w-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeStr = String(children).replace(/\n$/, '')

                      if (!match) {
                        return (
                          <code className="px-1.5 py-0.5 rounded-md text-xs font-mono font-bold"
                            style={{
                              background: 'rgba(143,174,125,0.2)',
                              color: '#5A7A4C',
                              border: '1px solid rgba(143,174,125,0.35)',
                            }}
                          >
                            {children}
                          </code>
                        )
                      }

                      return (
                        <div
                          className="relative rounded-2xl overflow-hidden my-3"
                          style={{ border: '1px solid var(--border-soft)' }}
                        >
                          <div
                            className="flex items-center justify-between px-3.5 py-2"
                            style={{ background: '#241E2E', borderBottom: '1px solid var(--border-soft)' }}
                          >
                            <span className="text-[10px] font-mono font-bold uppercase" style={{ letterSpacing: '0.1em', color: '#E0A85C' }}>
                              {match[1]}
                            </span>
                            <CopyButton text={codeStr} label="Copy code" />
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus as Record<string, React.CSSProperties>}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: 0,
                              fontSize: '12px',
                              background: '#241E2E',
                              padding: '14px',
                            }}
                          >
                            {codeStr}
                          </SyntaxHighlighter>
                        </div>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        <div
          className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
            isUser ? 'flex-row-reverse' : ''
          }`}
        >
          <span className="text-[10px] px-1" style={{ color: 'var(--text-lo)' }}>{time}</span>
          {!isUser && (
            <>
              <CopyButton text={message.content} label="Copy message" />
              <button
                onClick={onSpeak}
                className="icon-btn !p-1.5 !rounded-lg"
                aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
              >
                {isSpeaking ? <VolumeX size={12} style={{ color: '#D98F72' }} /> : <Volume2 size={12} />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
