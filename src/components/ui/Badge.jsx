import { cn } from '../../lib/cn'

/**
 * Badge — rounded chip with a tone variant. Replaces the inline pill
 * pattern repeated across HomePage, Layout, PracticePage, QuizMaker
 * (the long "px-2 py-0.5 rounded-full text-[11px] font-black ..."
 * class chain wrapping a number or label).
 *
 *   tone:  accent | ok | warn | bad | purple | cyan | orange | yellow | muted
 *   size:  sm | md
 *   icon:  optional leading icon (emoji or element)
 */
const TONES = {
  accent: 'bg-quiz-blue/15   border-quiz-blue/40   text-quiz-blue',
  ok:     'bg-quiz-green/15  border-quiz-green/40  text-quiz-green',
  warn:   'bg-quiz-yellow/15 border-quiz-yellow/40 text-quiz-yellow',
  bad:    'bg-quiz-red/15    border-quiz-red/40    text-quiz-red',
  purple: 'bg-quiz-purple/15 border-quiz-purple/40 text-quiz-purple',
  cyan:   'bg-quiz-cyan/15   border-quiz-cyan/40   text-quiz-cyan',
  orange: 'bg-quiz-orange/15 border-quiz-orange/40 text-quiz-orange',
  yellow: 'bg-quiz-yellow/15 border-quiz-yellow/40 text-quiz-yellow',
  muted:  'bg-white/5        border-quiz-border    text-quiz-muted',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

export default function Badge({ tone = 'muted', size = 'sm', icon, className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-black',
        TONES[tone] || TONES.muted,
        SIZES[size] || SIZES.sm,
        className,
      )}
      {...rest}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}
