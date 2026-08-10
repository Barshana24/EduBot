import { MessageSquare, Brain, MessagesSquare, Layers, Sigma, FileText, FolderSearch } from 'lucide-react'
import { useChatStore } from '@/store'
import { SUBJECTS, LANGUAGES, LEVELS, LANGUAGE_GLYPH, subjectMeta, ACCENTS } from '@/lib/design'
import type { Subject, Language, ExplanationLevel, ChatMode } from '@/types'
import type { LucideIcon } from 'lucide-react'

const MODES: { value: ChatMode; label: string; icon: LucideIcon }[] = [
  { value: 'chat',      label: 'Chat',      icon: MessageSquare },
  { value: 'quiz',      label: 'Quiz',      icon: Brain },
  { value: 'interview', label: 'Interview', icon: MessagesSquare },
  { value: 'flashcard', label: 'Cards',     icon: Layers },
  { value: 'formula',   label: 'Formula',   icon: Sigma },
  { value: 'summary',   label: 'Summary',   icon: FileText },
]

export default function ChatToolbar() {
  const {
    selectedSubject, setSubject,
    selectedLanguage, setLanguage,
    selectedLevel, setLevel,
    selectedMode, setMode,
    useDocuments, setUseDocuments,
  } = useChatStore()

  const meta = subjectMeta(selectedSubject)
  const activeMode = MODES.find((m) => m.value === selectedMode) ?? MODES[0]

  return (
    <div
      className="flex-shrink-0 px-4 py-2 flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-thin"
      style={{ borderBottom: '1px solid var(--border-soft)' }}
    >
      <div className="relative">
        <activeMode.icon size={12} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: ACCENTS.amber }} />
        <select
          value={selectedMode}
          onChange={(e) => setMode(e.target.value as ChatMode)}
          className="select-field !py-1.5 !pl-8 !pr-7 !rounded-full !text-[11px] !w-auto"
          aria-label="Mode"
        >
          {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="relative">
        <meta.icon size={12} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: selectedSubject ? meta.accent : 'var(--text-lo)' }} />
        <select
          value={selectedSubject || ''}
          onChange={(e) => setSubject((e.target.value as Subject) || null)}
          className="select-field !py-1.5 !pl-8 !pr-7 !rounded-full !text-[11px] !w-auto"
          aria-label="Subject"
        >
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[11px] font-extrabold" style={{ color: ACCENTS.cyan }}>
          {LANGUAGE_GLYPH[selectedLanguage]}
        </span>
        <select
          value={selectedLanguage}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="select-field !py-1.5 !pl-9 !pr-7 !rounded-full !text-[11px] !w-auto"
          aria-label="Language"
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <select
        value={selectedLevel}
        onChange={(e) => setLevel(e.target.value as ExplanationLevel)}
        className="select-field !py-1.5 !pl-3 !pr-7 !rounded-full !text-[11px] !w-auto"
        aria-label="Depth"
      >
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      <button
        onClick={() => setUseDocuments(!useDocuments)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold ml-auto"
        style={{
          background: useDocuments ? ACCENTS.mint : 'var(--surface-2)',
          border: `1px solid ${useDocuments ? ACCENTS.mint : 'var(--border-soft)'}`,
          color: useDocuments ? '#3A3226' : 'var(--text-mid)',
        }}
        aria-pressed={useDocuments}
        title="Answer from my uploaded notes"
      >
        <FolderSearch size={12} strokeWidth={2.5} />
        <span className="hidden sm:inline">My notes</span>
      </button>
    </div>
  )
}
