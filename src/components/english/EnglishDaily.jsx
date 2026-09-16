import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from '../ui/Screen'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import SectionLabel from '../ui/SectionLabel'
import Skeleton from '../ui/Skeleton'
import { Stagger, StaggerItem } from '../ui/Motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'
import EditingPlayer from './EditingPlayer'
import EditingReview from './EditingReview'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Easy -> Medium -> Hard, anything unrecognised last. The backend returns
// its levels alphabetically, which puts Hard before Medium.
const DIFF_ORDER = ['Easy', 'Medium', 'Hard']

// Same icons and colours the physics difficulty grid uses, so a level means
// the same thing in both subjects. Hover classes are written out in full:
// Tailwind scans for literal strings, so a class built by interpolation is
// never generated.
const DIFF_STYLE = {
  Easy:   { icon: 'seedling', chip: 'bg-quiz-green text-white',  hover: 'hover:border-quiz-green',  blurb: 'Gentler passages — the error stands out.' },
  Medium: { icon: 'flame',    chip: 'bg-quiz-orange text-white', hover: 'hover:border-quiz-orange', blurb: 'Exam standard, the usual mix.' },
  Hard:   { icon: 'skull',    chip: 'bg-quiz-red text-white',    hover: 'hover:border-quiz-red',    blurb: 'Subtle errors and trickier traps.' },
}
const DIFF_FALLBACK = { icon: 'book', chip: 'bg-quiz-bg-2 text-quiz-muted', hover: 'hover:border-quiz-line-soft', blurb: '' }

/** "×1.25", and nothing at all for a level that just pays face value. */
function multLabel(mult) {
  if (typeof mult !== 'number' || !(mult > 1)) return null
  return `×${Number(mult.toFixed(2))}`
}

function byDifficulty(list) {
  const known = DIFF_ORDER.filter((d) => list.includes(d))
  return [...known, ...list.filter((d) => !DIFF_ORDER.includes(d))]
}

/**
 * EnglishDaily — today's editing passage as the Daily Challenge.
 *
 * The student picks a level first, the way the physics daily does. Within
 * that level the backend still chooses the passage — weighted toward the
 * error codes this student gets wrong, and seeded on user+date+level so it
 * is the same passage all day rather than a reroll on every visit. So the
 * choice here is how hard, never which one: rerolling the passage until an
 * easy one came up would make a daily meaningless.
 *
 * One passage is exactly ten marks, which is the daily target.
 */
export default function EnglishDaily({
  authToken,
  onExit,
  onHome,
  onProgressionChange,
  onGemsChange,
  onQuizActiveChange,
}) {
  const [daily, setDaily] = useState(null)   // null = still choosing a level
  const [levels, setLevels] = useState(DIFF_ORDER)
  const [mults, setMults] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Asked without a level, purely to learn which levels the bank has — the
  // passage it comes back with is thrown away. Cheap, and it means the
  // picker offers what actually exists rather than a hardcoded three.
  const probe = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/english/daily`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.difficulties) && data.difficulties.length) {
        setLevels(byDifficulty(data.difficulties))
      }
      // Read rather than hardcoded: the badge should say what the level
      // actually pays, not what a constant in this file remembers.
      if (data.difficulty_multipliers) setMults(data.difficulty_multipliers)
    } catch {
      /* the hardcoded order is a fine fallback */
    }
  }, [authToken])

  useEffect(() => { probe() }, [probe])

  const load = useCallback(async (level) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/english/daily?difficulty=${encodeURIComponent(level)}`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      )
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).detail
          || "Could not load today's passage")
      }
      setDaily(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  const backToPicker = () => { setDaily(null); setResult(null) }

  if (result) {
    return (
      <EditingReview
        result={result}
        onHome={onHome || onExit}
        onRetry={() => setResult(null)}
      />
    )
  }

  if (daily) {
    return (
      <EditingPlayer
        authToken={authToken}
        uid={daily.uid}
        mode="exam"
        daily
        onExit={backToPicker}
        onFinished={(payload) => {
          setResult(payload)
          if (payload?.progression) onProgressionChange?.(payload.progression)
          if (typeof payload?.gems_total === 'number') onGemsChange?.(payload.gems_total)
        }}
        onActiveChange={onQuizActiveChange}
      />
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
            <SectionLabel>English · Daily Challenge</SectionLabel>
            <h1 className="mt-1 font-head !text-3xl !font-extrabold tracking-tight">
              How hard today?
            </h1>
            <p className="mt-1 text-sm font-semibold text-quiz-muted">
              One editing passage, 10 marks — a whole day&rsquo;s goal. Harder
              passages are worth more.
            </p>
          </header>
        </StaggerItem>

        {error && (
          <StaggerItem>
            <Card className="mb-3 p-4 text-center">
              <p className="font-bold text-quiz-red">{error}</p>
            </Card>
          </StaggerItem>
        )}

        <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-3">
          {levels.map((level) => {
            const style = DIFF_STYLE[level] || DIFF_FALLBACK
            const mult = multLabel(mults[level])
            return (
              <StaggerItem key={level}>
                <motion.button
                  type="button"
                  disabled={loading}
                  onClick={() => load(level)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={ease.spring}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-md border-2 border-quiz-line bg-white p-4 text-left transition-colors disabled:opacity-60 sm:flex-col sm:items-stretch sm:gap-2',
                    !loading && style.hover,
                  )}
                >
                  <span className={cn('flex h-10 w-10 flex-none items-center justify-center rounded-full', style.chip)}>
                    <Icon name={style.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-head text-lg font-extrabold leading-tight text-quiz-text">
                        {level}
                      </span>
                      {mult && <Badge tone="ok">{mult} XP</Badge>}
                    </span>
                    {style.blurb && (
                      <span className="mt-0.5 block text-[13px] font-semibold text-quiz-muted">
                        {style.blurb}
                      </span>
                    )}
                  </span>
                </motion.button>
              </StaggerItem>
            )
          })}
        </div>

        {loading && (
          <StaggerItem>
            <Card className="space-y-2 p-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
          </StaggerItem>
        )}

        <StaggerItem>
          <p className="px-1 text-[12px] font-bold text-quiz-muted-soft">
            The passage itself is picked for you, aimed at the mistakes you
            make most — and it&rsquo;s the same one all day, so there&rsquo;s
            nothing to reroll.
          </p>
        </StaggerItem>
      </Stagger>
    </Screen>
  )
}
