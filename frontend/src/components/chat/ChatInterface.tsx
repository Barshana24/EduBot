import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, Download, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useChatStore, useAuthStore } from '@/store'
import { chatAPI, notesAPI, API_BASE } from '@/services/api'
import { EASE } from '@/lib/design'
import { useCue } from '@/lib/hooks'
import Mascot from '@/components/ui/Mascot'
import Composer from './Composer'
import Welcome from './Welcome'
import type { Message, Subject } from '@/types'

// Markdown, KaTeX and the highlighter only load once there's an answer.
const UserBubble      = lazy(() => import('./Bubbles').then((m) => ({ default: m.UserBubble })))
const BotBubble       = lazy(() => import('./Bubbles').then((m) => ({ default: m.BotBubble })))
const StreamingBubble = lazy(() => import('./Bubbles').then((m) => ({ default: m.StreamingBubble })))

function Thinking() {
  return (
    <div className="flex gap-2.5 mb-5 items-center">
      <Mascot size={38} mood="thinking" still />
      <div className="card px-4 py-3.5 flex gap-1.5" style={{ borderRadius: '6px 22px 22px 22px' }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--brand)' }}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ChatInterface() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cue = useCue()
  const {
    activeSessionId, setActiveSession, messages, setMessages, addMessage,
    streamingContent, setStreamingContent, appendStreamingContent,
    isStreaming, setIsStreaming, clearStreaming,
    selectedSubject, setSubject, selectedLanguage, selectedLevel, selectedMode, useDocuments,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showJump, setShowJump] = useState(false)

  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const currentSessionId = sessionId ? parseInt(sessionId) : activeSessionId

  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['session-messages', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return null
      const res = await chatAPI.getSessionMessages(currentSessionId)
      return res.data
    },
    enabled: !!currentSessionId,
  })

  useEffect(() => {
    if (sessionData) {
      setActiveSession(sessionData.session.id)
      setMessages(sessionData.session.id, sessionData.messages)
    }
  }, [sessionData, setActiveSession, setMessages])

  const currentMessages = currentSessionId ? (messages[currentSessionId] || []) : []
  const hasMessages = currentMessages.length > 0

  const scrollToBottom = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    if (currentMessages.length > 0) scrollToBottom(false)
  }, [currentMessages.length, scrollToBottom])

  useEffect(() => {
    if (isStreaming) scrollToBottom()
  }, [streamingContent, isStreaming, scrollToBottom])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 240)
  }

  /** The one path that talks to the streaming endpoint. */
  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    cue('send')
    setInput('')

    const userMsg: Message = {
      id: Date.now(),
      session_id: currentSessionId || 0,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }

    if (currentSessionId) addMessage(currentSessionId, userMsg)

    setIsStreaming(true)
    setStreamingContent('')
    abortRef.current = new AbortController()

    try {
      const response = await fetch(`${API_BASE}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          message: trimmed,
          session_id: currentSessionId,
          subject: selectedSubject,
          language: selectedLanguage,
          level: selectedLevel,
          mode: selectedMode,
          use_documents: useDocuments,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              accumulated += data.content
              appendStreamingContent(data.content)
            }
            if (data.done) {
              const botMsg: Message = {
                id: data.message_id || Date.now() + 1,
                session_id: data.session_id,
                role: 'assistant',
                content: accumulated,
                created_at: new Date().toISOString(),
              }
              const sid = data.session_id
              if (!currentSessionId && sid) {
                setActiveSession(sid)
                navigate(`/chat/${sid}`, { replace: true })
                addMessage(sid, userMsg)
                addMessage(sid, botMsg)
              } else if (currentSessionId) {
                addMessage(currentSessionId, botMsg)
              }
            }
          } catch {
            /* partial frame — the next chunk completes it */
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['progress-overview'] })
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error("Couldn't reach EduBot. Check your connection.")
      }
    } finally {
      clearStreaming()
    }
  }

  const askStarter = (question: string, subject: Subject) => {
    setSubject(subject)
    send(question)
  }

  const downloadPDF = async () => {
    if (!currentSessionId) return
    try {
      const res = await notesAPI.downloadSessionPDF(currentSessionId)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `edubot-notes-${currentSessionId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Saved as PDF!')
    } catch {
      toast.error("Couldn't build the PDF")
    }
  }

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      toast.error('This browser has no speech recognition')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (event) => {
      setInput(Array.from(event.results).map((r) => r[0].transcript).join(''))
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const speak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const clean = text.replace(/[#*`_~]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 0.95
    utterance.onend = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // Stop any audio when leaving chat.
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const newChat = () => {
    setActiveSession(null)
    navigate('/chat')
  }

  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'var(--hud-top)', paddingBottom: 'var(--tabs-bottom)' }}>
      {hasMessages && (
        <div className="shrink-0 flex items-center gap-2 px-[var(--gutter)] py-2">
          <div className="max-w-[46rem] mx-auto w-full flex items-center gap-2">
            <button onClick={newChat} className="btn btn-soft btn-sm">
              <Plus size={16} strokeWidth={3} /> New chat
            </button>
            <span className="flex-1" />
            <button onClick={downloadPDF} className="icon-btn" aria-label="Save chat as PDF">
              <Download size={18} />
            </button>
          </div>
        </div>
      )}

      <div onScroll={handleScroll} className="flex-1 min-h-0 scroll-y px-[var(--gutter)]">
        {/* An empty chat centres itself; a thread starts at the top. */}
        <div
          className={`max-w-[46rem] mx-auto pb-4 ${
            !hasMessages && !loadingSession && !isStreaming
              ? 'min-h-full flex flex-col justify-center'
              : ''
          }`}
        >
          {!hasMessages && !loadingSession && !isStreaming && <Welcome onAsk={askStarter} />}

          {loadingSession && (
            <div className="py-16 grid place-items-center">
              <Mascot size={64} mood="thinking" />
            </div>
          )}

          <Suspense fallback={hasMessages ? <Thinking /> : null}>
            {currentMessages.map((msg, i) =>
              msg.role === 'user' ? (
                <UserBubble key={msg.id} content={msg.content} />
              ) : (
                <BotBubble
                  key={msg.id}
                  message={msg}
                  onSpeak={() => speak(msg.content)}
                  isSpeaking={isSpeaking}
                  // The question this answers is whatever the student said last.
                  question={
                    [...currentMessages.slice(0, i)].reverse()
                      .find((m) => m.role === 'user')?.content
                  }
                  subject={msg.subject ?? selectedSubject}
                />
              )
            )}
            {isStreaming && streamingContent && <StreamingBubble content={streamingContent} />}
          </Suspense>

          {isStreaming && !streamingContent && <Thinking />}

          <div ref={endRef} />
        </div>
      </div>

      <AnimatePresence>
        {showJump && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={() => scrollToBottom()}
            className="btn btn-soft fixed left-1/2 -translate-x-1/2 !min-h-[42px] !w-[42px] !p-0 !rounded-full z-30"
            style={{ bottom: 'calc(var(--tabs-bottom) + 6.5rem)' }}
            aria-label="Jump to latest"
          >
            <ArrowDown size={18} strokeWidth={2.6} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="shrink-0">
        <Composer
          value={input}
          onChange={setInput}
          onSend={() => send(input)}
          onStop={() => { abortRef.current?.abort(); clearStreaming() }}
          isStreaming={isStreaming}
          isListening={isListening}
          onToggleVoice={toggleVoice}
          placeholder="Ask me anything…"
        />
      </div>
    </div>
  )
}
