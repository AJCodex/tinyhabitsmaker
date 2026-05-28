import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function StarCounter({ value }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (value === display) return
    const start = display
    const end = value
    const duration = 600
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    prev.current = value
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 px-4 py-2 text-white shadow-pop">
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">Stars</div>
      <div className="flex items-baseline gap-1 text-2xl font-bold leading-none">
        <AnimatePresence mode="popLayout">
          <motion.span
            key="star"
            animate={{ rotate: value > prev.current ? [0, -20, 20, 0] : 0 }}
            transition={{ duration: 0.5 }}
          >
            ⭐
          </motion.span>
        </AnimatePresence>
        <span>{display}</span>
      </div>
    </div>
  )
}
