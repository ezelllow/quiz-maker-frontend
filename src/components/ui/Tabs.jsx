import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'

/**
 * Tabs — segmented tab bar with a sliding shared-element indicator
 * (via `layoutId`). Used on the Leaderboard period selector and
 * anywhere else daily/weekly/all-time style switching shows up.
 *
 *   tabs:     [{ id, label, icon? }]
 *   value:    selected id
 *   onChange: (id) => void
 *   variant:  'pill' (default — single capsule with sliding fill)
 *             'underline' (bottom border indicator)
 */
export default function Tabs({ tabs = [], value, onChange, variant = 'pill', className }) {
  const indicatorId = useId()
  const isUnderline = variant === 'underline'

  if (isUnderline) {
    return (
      <div className={cn('flex gap-2 border-b border-quiz-border', className)} role="tablist">
        {tabs.map((t) => {
          const active = value === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange?.(t.id)}
              className={cn(
                'relative px-3 py-2 text-sm font-black transition-colors',
                active ? 'text-white' : 'text-quiz-muted hover:text-white',
              )}
            >
              {t.icon && <span className="mr-1">{t.icon}</span>}
              {t.label}
              {active && (
                <motion.span
                  layoutId={indicatorId}
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-quiz-blue to-quiz-purple rounded-full"
                  transition={ease.spring}
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // pill variant
  return (
    <div
      className={cn(
        'relative inline-flex gap-1 p-1 rounded-pill bg-gray-50 border border-quiz-border',
        className,
      )}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(t.id)}
            className={cn(
              'relative px-3 py-1.5 text-xs font-black rounded-pill transition-colors',
              active ? 'text-white' : 'text-quiz-muted hover:text-white',
            )}
          >
            {active && (
              <motion.span
                layoutId={indicatorId}
                className="absolute inset-0 rounded-pill bg-gradient-to-r from-quiz-blue/40 to-quiz-purple/40 border border-quiz-blue/60"
                transition={ease.spring}
              />
            )}
            <span className="relative inline-flex items-center gap-1">
              {t.icon && <span>{t.icon}</span>}
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
