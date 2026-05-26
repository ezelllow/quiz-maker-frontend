import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ease, dur } from '../../motion'
import { cn } from '../../lib/cn'
import ProgressBar from './ProgressBar'
import CountUp from './CountUp'

/**
 * XPBar — level + XP-to-next progress bar with a "+N XP" floater that
 * appears briefly when the XP value increases.
 *
 *   xp:         current XP (absolute)
 *   level:      current level (for the "Lv N" label)
 *   xpInLevel:  XP earned inside the current level
 *   xpForLevel: XP required to clear the current level (denominator)
 *   nextName:   next rank name to display under the bar (optional)
 *   showDelta:  set false to hide the +N XP floater
 */
export default function XPBar({
  xp = 0,
  level,
  xpInLevel,
  xpForLevel,
  nextName,
  showDelta = true,
  className,
}) {
  const pct = xpForLevel > 0 ? Math.max(0, Math.min(100, (xpInLevel / xpForLevel) * 100)) : 0

  // Track the most recent positive XP delta so we can flash "+N" above the bar.
  // `prev` is only read inside the effect, never during render — keeps the
  // react-hooks/refs rule happy.
  const prev = useRef(xp)
  const deltaKey = useRef(0)
  const [delta, setDelta] = useState(null)
  useEffect(() => {
    const d = xp - prev.current
    prev.current = xp
    if (showDelta && d > 0) {
      deltaKey.current += 1
      setDelta({ amount: d, id: deltaKey.current })
      const t = setTimeout(() => setDelta(null), 1600)
      return () => clearTimeout(t)
    }
  }, [xp, showDelta])

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-quiz-muted mb-1">
        <span>{level != null ? `Lv ${level}` : 'Level'}</span>
        <span className="text-quiz-blue">
          <CountUp value={xpInLevel ?? 0} /> / {xpForLevel ?? '?'} XP
        </span>
      </div>
      <ProgressBar value={pct} tone="accent" height="md" shimmer />
      {nextName && (
        <div className="text-[10px] font-bold text-quiz-muted mt-1 text-right">
          Next: {nextName}
        </div>
      )}
      <AnimatePresence>
        {delta != null && (
          <motion.span
            key={`delta-${delta.id}`}
            className="absolute -top-5 right-0 text-xs font-black text-quiz-purple pointer-events-none"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: -8, transition: { duration: dur.md, ease: ease.out } }}
            exit={{ opacity: 0, y: -16, transition: { duration: dur.md, ease: ease.out } }}
          >
            +{delta.amount} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
