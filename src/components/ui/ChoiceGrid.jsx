import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'
import Icon from './Icon'

/**
 * ChoiceGrid — generic "pick one of N" grid. Replaces the bespoke pickers
 * in PracticePage (Subject), QuizMaker (Difficulty, Count, Topic chips).
 *
 *   options:  [{ id, label, emoji?, sub?, disabled?, locked? }]
 *   value:    currently selected option id
 *   onChange: (id) => void
 *   columns:  1 | 2 | 3 | 4 (grid columns)
 *   layout:   'tile'   — large emoji on top, label + sub below (default)
 *             'row'    — emoji + label + chevron in a horizontal row
 *             'chip'   — compact rounded-full pills (single line, no sub)
 */
const COL_CLASS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }

export default function ChoiceGrid({
  options = [],
  value,
  onChange,
  columns = 3,
  layout = 'tile',
  className,
}) {
  if (layout === 'chip') {
    return (
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {options.map((opt) => {
          const active = value === opt.id
          const inactive = opt.disabled || opt.locked
          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={inactive}
              onClick={() => !inactive && onChange?.(opt.id)}
              whileTap={inactive ? undefined : { scale: 0.96 }}
              transition={ease.spring}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                active
                  ? 'bg-quiz-blue/25 border-quiz-blue text-quiz-orange-deep'
                  : 'bg-white border-quiz-border text-quiz-text hover:border-quiz-blue/60',
                inactive && 'opacity-40 cursor-not-allowed',
              )}
            >
              {opt.emoji && <span>{opt.emoji}</span>}
              {opt.label}
              {active && <Icon name="check" className="inline-block w-[1em] h-[1em] align-[-0.15em] ml-1" />}
            </motion.button>
          )
        })}
      </div>
    )
  }

  if (layout === 'row') {
    return (
      <div className={cn('space-y-3', className)}>
        {options.map((opt) => {
          const active = value === opt.id
          const inactive = opt.disabled || opt.locked
          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={inactive}
              onClick={() => !inactive && onChange?.(opt.id)}
              whileTap={inactive ? undefined : { scale: 0.98 }}
              whileHover={inactive ? undefined : { y: -1 }}
              transition={ease.spring}
              className={cn(
                'qq-card-solid !p-4 w-full text-left flex items-center gap-4',
                active && 'border-quiz-blue',
                inactive && 'opacity-50 cursor-not-allowed',
              )}
              style={opt.accent ? { borderLeft: `6px solid ${opt.accent}` } : undefined}
            >
              {opt.emoji && <div className="text-4xl shrink-0">{opt.emoji}</div>}
              <div className="flex-1 min-w-0">
                <div className="font-black text-lg">{opt.label}</div>
                {opt.sub && <div className="text-xs font-bold text-quiz-muted">{opt.sub}</div>}
              </div>
              <div className="text-quiz-muted text-2xl shrink-0">
                {opt.locked ? <Icon name="lock" className="w-5 h-5" /> : active ? <Icon name="check" className="w-5 h-5" /> : '›'}
              </div>
            </motion.button>
          )
        })}
      </div>
    )
  }

  // layout === 'tile'
  return (
    <div className={cn('grid gap-2', COL_CLASS[columns] || COL_CLASS[3], className)}>
      {options.map((opt) => {
        const active = value === opt.id
        const inactive = opt.disabled || opt.locked
        return (
          <motion.button
            key={opt.id}
            type="button"
            disabled={inactive}
            onClick={() => !inactive && onChange?.(opt.id)}
            whileTap={inactive ? undefined : { scale: 0.97 }}
            whileHover={inactive ? undefined : { y: -2 }}
            transition={ease.spring}
            className={cn(
              'p-3 rounded-2xl border-2 font-black text-center transition-colors',
              inactive
                ? 'opacity-40 pointer-events-none border-quiz-border bg-white text-quiz-muted'
                : active
                  ? 'border-quiz-blue bg-quiz-blue/20 text-quiz-orange-deep shadow-lg'
                  : 'border-quiz-border bg-white text-quiz-text hover:border-quiz-blue/60 hover:bg-gray-50',
            )}
          >
            {opt.emoji && <div className="text-2xl">{opt.emoji}</div>}
            <div className="text-xs mt-1">{opt.label}</div>
            {opt.sub && <div className="text-[11px] mt-0.5 font-black text-quiz-yellow">{opt.sub}</div>}
          </motion.button>
        )
      })}
    </div>
  )
}
