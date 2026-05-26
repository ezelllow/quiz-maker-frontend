import { cn } from '../../lib/cn'
import Card from './Card'
import SectionLabel from './SectionLabel'

/**
 * StatTile — eyebrow + big value + optional sublabel, in a solid card.
 * Used for the Streak / Rank / Crystals / Longest grids on Home,
 * Settings, and Dashboard.
 *
 *   label:    eyebrow text ("Streak", "Rank")
 *   value:    main value (string | number | ReactNode — leave a <CountUp/> here for live ticking)
 *   icon:     leading emoji or element shown next to the value
 *   sub:      small footer line (e.g. "Longest 12d · 2 freezes")
 *   tone:     visual accent of the value text (default | accent | ok | warn | bad | purple | cyan)
 *   compact:  reduce padding for dense grids
 */
const VALUE_TONES = {
  default: 'text-white',
  accent:  'text-quiz-blue',
  ok:      'text-quiz-green',
  warn:    'text-quiz-yellow',
  bad:     'text-quiz-red',
  purple:  'text-quiz-purple',
  cyan:    'text-quiz-cyan',
  orange:  'text-quiz-orange',
}

export default function StatTile({
  label,
  value,
  icon,
  sub,
  tone = 'default',
  compact = false,
  className,
}) {
  return (
    <Card variant="solid" className={cn(compact ? '!p-3 sm:!p-4' : '!p-4 sm:!p-5', className)}>
      {label && <SectionLabel as="div">{label}</SectionLabel>}
      <div className={cn('flex items-center gap-1.5 mt-0.5 font-black', VALUE_TONES[tone] || VALUE_TONES.default)}>
        {icon && <span className="text-2xl sm:text-3xl leading-none">{icon}</span>}
        <span className="text-2xl sm:text-3xl leading-none">{value}</span>
      </div>
      {sub && <div className="text-[11px] text-quiz-muted mt-1 font-bold">{sub}</div>}
    </Card>
  )
}
