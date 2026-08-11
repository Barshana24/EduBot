import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Mic, MicOff, Square, SlidersHorizontal, FolderSearch } from 'lucide-react'
import { useChatStore } from '@/store'
import { SUBJECTS, LANGUAGES, LEVELS, subjectMeta, EASE } from '@/lib/design'
import type { Subject, Language, ExplanationLevel, ChatMode } from '@/types'

const MODES: { value: ChatMode; label: string }[] = [
  { value: 'chat',      label: 'Explain it' },
  { value: 'quiz',      label: 'Quiz me' },
  { value: 'interview', label: 'Interview me' },
  { value: 'flashcard', label: 'Make cards' },
  { value: 'formula',   label: 'Formulas' },
  { value: 'summary',   label: 'Summarise' },
]

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  isStreaming: boolean
  isListening: boolean
  onToggleVoice: () => void
  placeholder: string
}

/**
 * One input, one send button. The settings live behind a single toggle
 * so the default screen stays a text box and nothing else.
 */
export default function Composer({
  value, onChange, onSend, onStop, isStreaming,
  isListening, onToggleVoice, placeholder,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [showSettings, setShowSettings] = useState(false)

  const {
    selectedSubject, setSubject,
    selectedLanguage, setLanguage,
    selectedLevel, setLevel,
    selectedMode, setMode,
    useDocuments, setUseDocuments,
  } = useChatStore()

  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px'
  }, [value])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const meta = subjectMeta(selectedSubject)
  const activeMode = MODES.find((m) => m.value === selectedMode) ?? MODES[0]
  // Anything other than a plain explanation is worth surfacing on the button.
  const tweaked = !!selectedSubject || selectedMode !== 'chat' || useDocuments

  return (
    <div className="px-[var(--gutter)] pb-3 pt-2">
      <div className="max-w-[46rem] mx-auto">
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="card p-3.5 mb-2.5 grid grid-cols-2 gap-2.5">
                <label className="col-span-2 sm:col-span-1">
                  <span className="t-cap block mb-1.5">How should I answer?</span>
                  <select
                    value={selectedMode}
                    onChange={(e) => setMode(e.target.value as ChatMode)}
                    className="field field-select !min-h-[46px] !py-2"
                  >
                    {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </label>

                <label className="col-span-2 sm:col-span-1">
                  <span className="t-cap block mb-1.5">Subject</span>
                  <select
                    value={selectedSubject || ''}
                    onChange={(e) => setSubject((e.target.value as Subject) || null)}
                    className="field field-select !min-h-[46px] !py-2"
                  >
                    <option value="">Any subject</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label>
                  <span className="t-cap block mb-1.5">Language</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="field field-select !min-h-[46px] !py-2"
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>

                <label>
                  <span className="t-cap block mb-1.5">Level</span>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setLevel(e.target.value as ExplanationLevel)}
                    className="field field-select !min-h-[46px] !py-2"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>

                <button
                  onClick={() => setUseDocuments(!useDocuments)}
                  aria-pressed={useDocuments}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-[var(--r-md)] py-2.5 font-display font-semibold text-sm"
                  style={{
                    background: useDocuments ? 'var(--mint-soft)' : 'var(--card-soft)',
                    border: `2px solid ${useDocuments ? 'var(--mint)' : 'var(--line)'}`,
                    color: useDocuments ? 'var(--mint-dark)' : 'var(--ink-soft)',
                  }}
                >
                  <FolderSearch size={16} />
                  {useDocuments ? 'Answering from my notes' : 'Use my uploaded notes'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="card flex items-end gap-1.5 p-2"
          style={{ borderRadius: 'var(--r-xl)' }}
        >
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="icon-btn shrink-0 relative"
            aria-label="Answer settings"
            aria-expanded={showSettings}
            style={showSettings ? { background: 'var(--brand-soft)', color: 'var(--brand)' } : undefined}
          >
            <SlidersHorizontal size={19} />
            {tweaked && !showSettings && (
              <span
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                style={{ background: meta.colour, border: '2px solid var(--card)' }}
              />
            )}
          </button>

          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={isStreaming}
            rows={1}
            aria-label="Ask EduBot"
            className="flex-1 bg-transparent resize-none focus:outline-none min-w-0 font-body font-semibold px-1 py-2.5"
            style={{ color: 'var(--ink)', fontSize: '1rem', lineHeight: 1.45, maxHeight: 150 }}
          />

          <button
            onClick={onToggleVoice}
            className="icon-btn shrink-0"
            aria-label={isListening ? 'Stop listening' : 'Ask by voice'}
            style={isListening ? { background: 'var(--coral-soft)', color: 'var(--coral-text)' } : undefined}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          {isStreaming ? (
            <button
              onClick={onStop}
              className="btn btn-soft shrink-0 !min-h-[46px] !w-[46px] !p-0 !rounded-full"
              aria-label="Stop"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <motion.button
              onClick={onSend}
              disabled={!value.trim()}
              whileTap={value.trim() ? { scale: 0.9 } : undefined}
              className="btn btn-primary shrink-0 !min-h-[46px] !w-[46px] !p-0 !rounded-full"
              aria-label="Send"
            >
              <ArrowUp size={20} strokeWidth={3} />
            </motion.button>
          )}
        </div>

        {tweaked && !showSettings && (
          <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
            {selectedMode !== 'chat' && <span className="chip">{activeMode.label}</span>}
            {selectedSubject && (
              <span className="chip" style={{ background: `${meta.colour}22`, color: 'var(--ink)' }}>
                <meta.icon size={12} strokeWidth={2.5} style={{ color: meta.colour }} /> {meta.short}
              </span>
            )}
            {useDocuments && (
              <span className="chip" style={{ background: 'var(--mint-soft)', color: 'var(--ink)' }}>
                My notes
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
