import { cn } from '../../lib/cn'

/**
 * PageHeading — the friendly, consistent title block used at the top of a
 * page or major section. Part of the 2026-07 "clean + friendly" pass:
 * replaces the scattered `!text-2xl font-black` + tiny UPPERCASE eyebrow
 * chains with one Baloo (font-head) sentence-case treatment that themes
 * correctly in both light and dark mode.
 *
 *   title    — main heading text (string or node)
 *   subtitle — optional supporting line under the title
 *   eyebrow  — optional tiny label ABOVE the title (kept small + muted)
 *   icon     — optional leading <Icon/> node rendered in a tinted chip
 *   right    — optional node pinned to the right (actions, pills)
 *   size     — 'md' (default) | 'sm' | 'lg'
 */
const TITLE_SIZE = {
  sm: 'text-xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
}

export default function PageHeading({
  title,
  subtitle,
  eyebrow,
  icon,
  right,
  size = 'md',
  className,
  ...rest
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4 sm:mb-5', className)} {...rest}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-11 h-11 rounded-2xl grid place-items-center border shrink-0 text-quiz-blue bg-quiz-blue/15 border-quiz-blue/40">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-black uppercase tracking-wide text-quiz-muted">
              {eyebrow}
            </div>
          )}
          <h1 className={cn('font-head font-extrabold leading-tight text-quiz-text', TITLE_SIZE[size] || TITLE_SIZE.md)}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-bold text-quiz-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
