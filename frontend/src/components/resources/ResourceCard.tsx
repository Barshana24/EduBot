import { Play, ListVideo, BookOpen, ExternalLink } from 'lucide-react'
import { C } from '@/lib/design'
import type { LearningResource } from '@/types'
import type { LucideIcon } from 'lucide-react'

const KIND: Record<string, { icon: LucideIcon; colour: string; soft: string }> = {
  video:     { icon: Play,      colour: C.coral, soft: 'var(--coral-soft)' },
  playlist:  { icon: ListVideo, colour: C.sun,   soft: 'var(--sun-soft)' },
  reference: { icon: BookOpen,  colour: C.sky,   soft: 'var(--sky-soft)' },
}

interface Props {
  resource: LearningResource
  compact?: boolean
}

/** Opens in a new tab — a student mid-conversation shouldn't lose their thread. */
export default function ResourceCard({ resource, compact = false }: Props) {
  const kind = KIND[resource.kind] ?? KIND.reference
  const Icon = kind.icon

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`card card-tap flex items-center gap-3 ${compact ? 'p-2.5' : 'p-3.5'}`}
    >
      <span
        className="shrink-0 grid place-items-center"
        style={{
          width: compact ? 34 : 42,
          height: compact ? 34 : 42,
          borderRadius: compact ? 12 : 14,
          background: kind.soft,
        }}
      >
        <Icon size={compact ? 16 : 19} style={{ color: kind.colour }} strokeWidth={2.4} />
      </span>

      <span className="flex-1 min-w-0">
        <span
          className="block font-display font-semibold truncate"
          style={{ color: 'var(--ink)', fontSize: compact ? '0.9rem' : '1rem' }}
        >
          {resource.platform}
        </span>
        <span className="block t-small truncate" style={{ fontSize: compact ? '0.75rem' : undefined }}>
          {compact ? resource.title : resource.blurb}
        </span>
      </span>

      <ExternalLink size={15} style={{ color: 'var(--ink-faint)' }} className="shrink-0" />
    </a>
  )
}
