import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

interface Props {
  value: number
  duration?: number
  suffix?: string
}

/** Animates a number counting up from 0 (or its previous value) to `value`. */
export default function CountUp({ value, duration = 1, suffix = '' }: Props) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, duration])

  return <>{display}{suffix}</>
}
