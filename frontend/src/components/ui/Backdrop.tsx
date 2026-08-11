import { C, tint } from '@/lib/design'

/**
 * Four soft colour washes painted as radial gradients on a single layer.
 * Gradients cost one paint and then ride along on a composited transform,
 * which is why this replaced the blurred-circle version.
 */
const WASH = [
  `radial-gradient(38vmax 38vmax at 6% 4%,   ${tint(C.brand, 0.20)}, transparent 62%)`,
  `radial-gradient(32vmax 32vmax at 88% 8%,  ${tint(C.sun,   0.20)}, transparent 62%)`,
  `radial-gradient(34vmax 34vmax at 4% 88%,  ${tint(C.mint,  0.20)}, transparent 62%)`,
  `radial-gradient(34vmax 34vmax at 92% 82%, ${tint(C.sky,   0.18)}, transparent 62%)`,
].join(', ')

/** Small shapes drifting upward. Deterministic so they don't reshuffle on re-render. */
const FLOATIES = [
  { left: '9%',  size: 14, colour: C.brand, duration: 27, delay: -3,  radius: '50%' },
  { left: '26%', size: 9,  colour: C.sun,   duration: 35, delay: -15, radius: '4px' },
  { left: '44%', size: 12, colour: C.mint,  duration: 30, delay: -22, radius: '50%' },
  { left: '63%', size: 15, colour: C.coral, duration: 32, delay: -8,  radius: '50%' },
  { left: '79%', size: 10, colour: C.sky,   duration: 37, delay: -27, radius: '4px' },
  { left: '92%', size: 12, colour: C.brand, duration: 29, delay: -18, radius: '50%' },
]

/**
 * The living background. Sits behind every page at low opacity; cards are
 * opaque, so text on top of them is unaffected.
 */
export default function Backdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <span className="wash" style={{ background: WASH }} />
      <span className="dots" />

      {FLOATIES.map((f, i) => (
        <span
          key={i}
          className="floaty"
          style={{
            left: f.left,
            bottom: 0,
            width: f.size,
            height: f.size,
            borderRadius: f.radius,
            background: f.colour,
            opacity: 0.22,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
