import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, Mic, MicOff, Volume2, VolumeX, Download,
  Square, PanelLeftOpen, ChevronDown,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useChatStore, useAuthStore, useUIStore } from '@/store'
import { chatAPI, notesAPI, API_BASE } from '@/services/api'
import ChatMessage, { BotAvatar } from './ChatMessage'
import ChatToolbar from './ChatToolbar'
import WelcomeScreen from './WelcomeScreen'
import { subjectMeta, EASE, ACCENTS } from '@/lib/design'
import type { Message } from '@/types'

export default function ChatInterface() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    activeSessionId, setActiveSession, messages, setMessages, addMessage,
    streamingContent, setStreamingContent, appendStreamingContent,
    isStreaming, setIsStreaming, clearStreaming,
    selectedSubject, selectedLanguage, selectedLevel, selectedMode, useDocuments,
  } = useChatStore()
  const { toggleSidebar, isSidebarOpen } = useUIStore()

  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const currentSessionId = sessionId ? parseInt(sessionId) : activeSessionId
  const meta = subjectMeta(selectedSubject)

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

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    if (currentMessages.length > 0) scrollToBottom(false)
  }, [currentMessages.length])

  useEffect(() => {
    if (isStreaming) scrollToBottom()
  }, [streamingContent, isStreaming, scrollToBottom])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200)
  }

  const autoResizeTextarea = () => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

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

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
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
            } catch {}
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error("Couldn't reach the tutor. Check that Ollama is running.")
      }
    } finally {
      clearStreaming()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDownloadPDF = async () => {
    if (!currentSessionId) return
    try {
      const res = await notesAPI.downloadSessionPDF(currentSessionId)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `edubot-notes-${currentSessionId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch {
      toast.error("Couldn't build the PDF")
    }
  }

  const startVoiceInput = () => {
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

  const speakText = (text: string) => {
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

  const hasMessages = currentMessages.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-soft)' }}
      >
        {!isSidebarOpen && (
          <button onClick={toggleSidebar} className="icon-btn" aria-label="Open sidebar">
            <PanelLeftOpen size={17} />
          </button>
        )}

        <BotAvatar thinking={isStreaming} />

        <div className="flex-1 min-w-0">
          <h2 className="font-display text-sm font-bold leading-none" style={{ color: 'var(--text-hi)' }}>
            EduBot
          </h2>
          <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isStreaming ? ACCENTS.amber : ACCENTS.mint,
                boxShadow: `0 0 8px ${isStreaming ? ACCENTS.amber : ACCENTS.mint}`,
              }}
            />
            {isStreaming ? 'Composing an answer' : 'Ready'}
          </p>
        </div>

        {selectedSubject && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold"
            style={{ background: meta.accent, color: '#3A3226' }}
          >
            <meta.icon size={12} strokeWidth={2.5} />
            {selectedSubject}
          </span>
        )}

        {hasMessages && (
          <div className="flex items-center gap-1">
            <button onClick={handleDownloadPDF} className="icon-btn" aria-label="Download as PDF">
              <Download size={16} />
            </button>
            <button
              onClick={() => isSpeaking && window.speechSynthesis.cancel()}
              className="icon-btn"
              aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX size={16} style={{ color: ACCENTS.violet }} /> : <Volume2 size={16} />}
            </button>
          </div>
        )}
      </header>

      <ChatToolbar />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-5 space-y-5 relative"
        onScroll={handleScroll}
      >
        {!hasMessages && !loadingSession && !isStreaming && <WelcomeScreen />}

        {loadingSession && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-9 h-9 rounded-full animate-spin"
              style={{ border: '3px solid var(--border-soft)', borderTopColor: ACCENTS.rose }}
            />
            <p className="text-sm" style={{ color: 'var(--text-mid)' }}>Loading conversation</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {currentMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <ChatMessage
                message={msg}
                onSpeak={() => speakText(msg.content)}
                isSpeaking={isSpeaking}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && streamingContent && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
            <BotAvatar thinking />
            <div className="message-bot max-w-[85%]">
              <div className="prose-edubot text-sm whitespace-pre-wrap break-words">
                {streamingContent}
                <span
                  className="inline-block w-[2px] h-4 ml-0.5 align-middle animate-pulse rounded-full"
                  style={{ background: ACCENTS.violet }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-3 items-center">
            <BotAvatar thinking />
            <div className="message-bot flex gap-1.5 items-center !py-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: ACCENTS.violet }}
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              onClick={() => scrollToBottom()}
              className="fixed bottom-32 right-8 p-2.5 rounded-full z-20"
              style={{
                background: 'linear-gradient(135deg, #E0A85C, #D98F72)',
                boxShadow: '0 6px 16px -6px rgba(217,143,114,0.6)',
                color: '#3A3226',
              }}
              aria-label="Scroll to latest"
            >
              <ChevronDown size={17} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <div
          className="flex gap-2 items-end p-2 rounded-3xl transition-all"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              autoResizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedSubject
                ? `Ask about ${selectedSubject}`
                : 'Ask about any engineering concept'
            }
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm focus:outline-none px-3 py-2.5 max-h-44 min-h-[40px]"
            style={{ color: 'var(--text-hi)' }}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
            <button
              onClick={startVoiceInput}
              className="icon-btn"
              style={isListening ? { color: '#3A3226', background: ACCENTS.rose } : undefined}
              aria-label={isListening ? 'Stop listening' : 'Speak your question'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {isStreaming ? (
              <button
                onClick={() => { abortRef.current?.abort(); clearStreaming() }}
                className="p-2.5 rounded-2xl"
                style={{ background: ACCENTS.rose, color: '#3A3226' }}
                aria-label="Stop generating"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <motion.button
                onClick={handleSend}
                disabled={!input.trim()}
                whileTap={input.trim() ? { scale: 0.94 } : undefined}
                className="p-2.5 rounded-2xl disabled:opacity-35 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #E0A85C, #D98F72)',
                  color: '#3A3226',
                  boxShadow: input.trim() ? '0 4px 12px -4px rgba(217,143,114,0.6)' : 'none',
                }}
                aria-label="Send message"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </motion.button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] mt-2.5" style={{ color: 'var(--text-lo)' }}>
          EduBot can be wrong. Check anything you plan to rely on.
        </p>
      </div>
    </div>
  )
}
