interface Blob {
  size: number
  color: string
  top?: string
  left?: string
  right?: string
  bottom?: string
  opacity: number
  anim: string
  delay: string
}

const BLOBS: Blob[] = [
  { size: 460, color: '#E0A85C', top: '-10%',  left: '-8%',  opacity: 0.22, anim: 'drift-slow 18s ease-in-out infinite',     delay: '0s'  },
  { size: 380, color: '#8FAE7D', top: '-4%',   right: '-6%', opacity: 0.2,  anim: 'drift 14s ease-in-out infinite reverse',  delay: '-4s' },
  { size: 340, color: '#D98F72', bottom: '-12%', right: '6%', opacity: 0.18, anim: 'drift-slow 20s ease-in-out infinite',    delay: '-9s' },
  { size: 300, color: '#B4A3D6', bottom: '-8%', left: '8%',   opacity: 0.16, anim: 'drift 16s ease-in-out infinite reverse', delay: '-6s' },
]

/** A soft, dreamy field of warm blurred clouds — quiet enough to sit behind cream cards. */
export default function Aurora({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="cloud-blob"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            opacity: dimmed ? b.opacity * 0.6 : b.opacity,
            top: b.top, left: b.left, right: b.right, bottom: b.bottom,
            animation: b.anim,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}
