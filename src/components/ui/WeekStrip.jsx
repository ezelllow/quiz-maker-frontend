import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease, dur } from '../../motion'
import Icon from './Icon'

/**
 * WeekStrip — 7-day strip showing Mon→Sun streak status, lifted from
 * HomePage so Settings and Dashboard can reuse it.
 *
 *   days:        [{ date, weekday, status, is_today }]
 *                  status: 'completed' | 'freeze_used' | 'today' | 'missed' | 'upcoming'
 *   loading:     when true, renders placeholder cells
 *   showLegend:  default true — shows the "done · freeze · upcoming · missed" legend row
 */
// WeekStrip chips always sit INSIDE a colored gradient card (orange in
// light theme, purple→pink→cyan in dark theme). They must keep these
// "for-gradient" colors in BOTH themes — so we use arbitrary-value
// Tailwind classes (bg-[#ffffff]) instead of `bg-white`. That escapes
// the global dark-mode `.bg-white → navy` override, which otherwise
// turns completed-day chips invisible against the rainbow.
const STYLES = {
  completed:   'bg-[#ffffff] text-purple-700 border-[#ffffff] shadow-md',
  freeze_used: 'bg-cyan-200 text-cyan-900 border-cyan-300',
  today:       'bg-[rgba(255,255,255,0.30)] text-white border-[#ffffff] border-dashed scale-105',
  missed:      'bg-red-500/40 text-white border-red-400/60',
  upcoming:    'bg-[rgba(255,255,255,0.10)] text-white/70 border-[rgba(255,255,255,0.15)]',
}
const ICONS = {
  completed:   <Icon name="flame" className="w-4 h-4" />,
  freeze_used: <Icon name="snowflake" className="w-4 h-4" />,
  today:       '·',
  missed:      <Icon name="x" className="w-4 h-4" />,
  upcoming:    '○',
}

export default function WeekStrip({ days, loading = false, showLegend = true, className }) {
  return (
    <div className={cn(className)}>
      <div className="grid grid-cols-7 gap-1.5">
        {loading || !days
          ? [0, 1, 2, 3, 4, 5, 6].map((d) => (
              <div key={d} className="aspect-square rounded-xl bg-gray-100" />
            ))
          : days.map((day, i) => (
              <WeekCell key={day.date || i} day={day} delay={i * 0.04} />
            ))}
      </div>
      {showLegend && (
        <div className="flex items-center justify-center gap-3 mt-2 text-[10px] font-bold text-white/80">
          <span className="inline-flex items-center gap-1"><Icon name="flame" className="w-3 h-3" /> done</span>
          <span className="inline-flex items-center gap-1"><Icon name="snowflake" className="w-3 h-3" /> freeze</span>
          <span>○ upcoming</span>
          <span className="inline-flex items-center gap-1"><Icon name="x" className="w-3 h-3" /> missed</span>
        </div>
      )}
    </div>
  )
}

function WeekCell({ day, delay = 0 }) {
  const isToday = day.is_today || day.status === 'today'
  const cls = cn(
    'aspect-square rounded-xl flex flex-col items-center justify-center font-black border-2',
    STYLES[day.status] || STYLES.upcoming,
    isToday && 'ring-2 ring-white/70',
  )
  return (
    <motion.div
      className={cls}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: dur.md, ease: ease.out, delay }}
    >
      <div className="text-[9px] uppercase tracking-widest opacity-80 leading-none">{day.weekday}</div>
      <div className="text-sm leading-none mt-1">{ICONS[day.status] || '○'}</div>
    </motion.div>
  )
}
