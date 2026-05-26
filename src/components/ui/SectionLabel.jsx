import { cn } from '../../lib/cn'

/**
 * SectionLabel — the small uppercase eyebrow text used above section
 * headings. Replaces the
 *   "text-[10px] font-black uppercase tracking-widest text-quiz-muted"
 * chain that appears across 8 files.
 *
 *   tone:    muted (default) | accent | yellow | white
 *   size:    xs (10px, default) | sm (11px) | md (12px)
 */
const TONES = {
  muted:  'text-quiz-muted',
  accent: 'text-quiz-blue',
  yellow: 'text-quiz-yellow',
  white:  'text-white',
}
const SIZES = {
  xs: 'text-[10px]',
  sm: 'text-[11px]',
  md: 'text-xs',
}

export default function SectionLabel({
  as: Tag = 'div',
  tone = 'muted',
  size = 'xs',
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        'font-black uppercase tracking-widest',
        TONES[tone] || TONES.muted,
        SIZES[size] || SIZES.xs,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
