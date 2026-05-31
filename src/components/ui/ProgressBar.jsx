import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease, dur } from '../../motion'

/**
 * ProgressBar — animated gradient progress bar.
 *
 *   value:    0..100 (clamped)
 *   tone:     accent | ok | warn | bad | streak | rainbow
 *   height:   xs (4px) | sm (6px) | md (8px) | lg (12px)
 *   animated: when true, width tweens to its target on mount + on prop change
 *   shimmer:  when true, overlays a sweeping highlight (use on hero bars)
 *
 * Track: bg-gray-50 keeps the empty portion subtle (matches the rest of the
 * app's bars). A visible outer border (border-quiz-border-bright) draws a
 * clear pill outline so the bar's start + end are obvious even when the
 * fill is small.
 */
const TONES = {
  accent:  'bg-gradient-to-r from-quiz-blue   via-quiz-cyan   to-quiz-blue',
  ok:      'bg-gradient-to-r from-quiz-green  via-quiz-lime   to-quiz-green',
  warn:    'bg-quiz-yellow',
  bad:     'bg-gradient-to-r from-quiz-red    to-quiz-orange',
  streak:  'bg-gradient-to-r from-quiz-orange to-quiz-yellow',
  rainbow: 'bg-gradient-to-r from-quiz-green  via-quiz-cyan   to-quiz-blue',
}
const HEIGHTS = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

export default function ProgressBar({
  value = 0,
  tone = 'accent',
  height = 'md',
  animated = true,
  shimmer = false,
  className,
  trackClassName,
}) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div
      className={cn(
        'w-full rounded-full bg-gray-50 overflow-hidden border border-quiz-border-bright',
        HEIGHTS[height] || HEIGHTS.md,
        trackClassName,
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn('h-full relative', TONES[tone] || TONES.accent)}
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: dur.lg, ease: ease.out }}
      >
        {shimmer && (
          <motion.span
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '300%' }}
            transition={{ duration: 1.6, ease: ease.out, repeat: Infinity, repeatDelay: 1.2 }}
          />
        )}
      </motion.div>
    </div>
  )
}
