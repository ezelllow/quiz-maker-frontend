import { lazy, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Icon from './ui/Icon'
import SectionLabel from './ui/SectionLabel'
import { Stagger, StaggerItem } from './ui/Motion'
import { cn } from '../lib/cn'
import { ease } from '../motion'
import DailyChallenge from './DailyChallenge'

const EnglishDaily = lazy(() => import('./english/EnglishDaily'))

/**
 * DailyPicker — the Daily Challenge now has two ways to clear it.
 *
 * Physics gives the usual weak-topic-weighted question set; English gives one
 * editing passage, which is exactly ten marks and therefore a full daily goal
 * in one sitting. Either clears the day: both credit the same daily tally, so
 * there is one goal and one streak whatever the student picks.
 */
export default function DailyPicker({
  authToken,
  onExit,
  onProgressionChange,
  onGemsChange,
  onQuizActiveChange,
}) {
  const [choice, setChoice] = useState(null)

  if (choice === 'physics') {
    return <DailyChallenge authToken={authToken} subject="Physics" onExit={onExit} />
  }

  if (choice === 'english') {
    return (
      <Suspense fallback={null}>
        <EnglishDaily
          authToken={authToken}
          onExit={onExit}
          onProgressionChange={onProgressionChange}
          onGemsChange={onGemsChange}
          onQuizActiveChange={onQuizActiveChange}
        />
      </Suspense>
    )
  }

  return (
    <Screen>
      <Stagger delay={0.04} step={0.06}>
        <StaggerItem>
          <header className="mb-5 pt-2">
            <button
              type="button"
              onClick={onExit}
              className="mb-2 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-orange"
            >
              <Icon name="x" className="h-3.5 w-3.5" /> Back
            </button>
            <SectionLabel>Daily Challenge</SectionLabel>
            <h1 className="mt-1 font-head !text-3xl !font-extrabold tracking-tight">
              Pick today&rsquo;s challenge
            </h1>
            <p className="mt-1 text-sm font-semibold text-quiz-muted">
              Either one clears today&rsquo;s goal and keeps your streak.
            </p>
          </header>
        </StaggerItem>

        <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
          <StaggerItem>
            <DailyOption
              onClick={() => setChoice('physics')}
              icon="atom"
              title="Physics"
              blurb="Questions picked from your weakest topics."
              tone="green"
            />
          </StaggerItem>
          <StaggerItem>
            <DailyOption
              onClick={() => setChoice('english')}
              icon="book"
              title="English"
              blurb="One editing passage, 10 marks — a whole day's goal."
              tone="orange"
            />
          </StaggerItem>
        </div>
      </Stagger>
    </Screen>
  )
}

function DailyOption({ onClick, icon, title, blurb, tone }) {
  // Green and orange, because the light palette collapses purple/blue/yellow
  // into the same gold — those two are the only pair that stay distinct in
  // both themes.
  const accent = tone === 'green'
    ? { chip: 'bg-quiz-green text-white', ring: 'hover:border-quiz-green' }
    : { chip: 'bg-quiz-orange text-white', ring: 'hover:border-quiz-orange' }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={ease.spring}
      className={cn(
        'flex w-full items-start gap-3 rounded-md border-2 border-quiz-line bg-white p-4 text-left transition-colors',
        accent.ring,
      )}
    >
      <span className={cn('flex h-10 w-10 flex-none items-center justify-center rounded-full', accent.chip)}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-head text-lg font-extrabold leading-tight text-quiz-text">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] font-semibold text-quiz-muted">{blurb}</span>
      </span>
    </motion.button>
  )
}
