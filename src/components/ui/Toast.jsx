import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast as toastVariant } from '../../motion'
import { cn } from '../../lib/cn'

/**
 * Toast — auto-dismissing top-right notification. Single-toast model
 * (no stack queue) — caller controls visibility via `open`.
 *
 *   open:     boolean
 *   onClose:  called when the toast dismisses itself or is tapped
 *   tone:     ok (default) | warn | bad | accent
 *   icon:     leading icon (default depends on tone)
 *   title:    bold first line
 *   body:     optional second-line description
 *   duration: ms before auto-dismiss (default 3500). Pass 0 to disable.
 */
const TONES = {
  ok:     { ring: 'border-quiz-green/50 bg-quiz-green/15 text-quiz-green', icon: '✅' },
  warn:   { ring: 'border-quiz-yellow/50 bg-quiz-yellow/15 text-quiz-yellow', icon: '⚠️' },
  bad:    { ring: 'border-quiz-red/50    bg-quiz-red/15    text-quiz-red',    icon: '❌' },
  accent: { ring: 'border-quiz-blue/50   bg-quiz-blue/15   text-quiz-blue',   icon: 'ℹ️' },
}

export default function Toast({
  open,
  onClose,
  tone = 'ok',
  icon,
  title,
  body,
  duration = 3500,
  className,
}) {
  useEffect(() => {
    if (!open || !duration) return
    const t = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(t)
  }, [open, duration, onClose])

  const t = TONES[tone] || TONES.ok

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-xs"
          variants={toastVariant}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'qq-card-solid !p-3 flex items-start gap-3 border-2 text-left',
              t.ring,
              className,
            )}
            role="status"
            aria-live="polite"
          >
            <span className="text-xl leading-none shrink-0">{icon ?? t.icon}</span>
            <div className="min-w-0">
              {title && <div className="font-black text-sm leading-snug">{title}</div>}
              {body && <div className="text-xs font-bold text-quiz-muted mt-0.5 leading-snug">{body}</div>}
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
