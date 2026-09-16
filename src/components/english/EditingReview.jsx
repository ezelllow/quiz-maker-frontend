import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from '../ui/Screen'
import Card from '../ui/Card'
import Button3d from '../ui/Button3d'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import SectionLabel from '../ui/SectionLabel'
import ProgressBar from '../ui/ProgressBar'
import CountUp from '../ui/CountUp'
import { Stagger, StaggerItem } from '../ui/Motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'
import useWideFrame from '../../hooks/useWideFrame'

/**
 * EditingReview — the marked paper.
 *
 * Beyond the score it answers the question a mark alone can't: WHERE the
 * student lost the mark. Circling the right word but writing the wrong fix
 * is a different problem from not seeing the error at all, and the two need
 * different teaching, so they are reported separately.
 */

const MISS_COPY = {
  missed_error:     { label: 'Missed the error',    hint: 'Ticked a line that had a mistake.' },
  wrong_word:       { label: 'Wrong word circled',  hint: 'Spotted something, but not the mistake.' },
  wrong_correction: { label: 'Right word, wrong fix', hint: 'Found it — the correction was off.' },
  over_corrected:   { label: 'Over-corrected',      hint: 'Changed a line that was already correct.' },
}

export default function EditingReview({ result, onHome, onRetry, onNext }) {
  // Same width as the player, so finishing a passage doesn't snap the page
  // from the full window back to a phone column.
  useWideFrame()
  const {
    title, difficulty, score, total, percentage, mode, rewarded,
    words_found: wordsFound, words_total: wordsTotal,
    results = [], by_error_code: byCode = [], miss_types: missTypes = {},
    xp_delta: xpDelta = 0, gems_delta: gemsDelta = 0, trap_note: trapNote,
    daily_progress: daily,
  } = result || {}

  const tone = percentage >= 80 ? 'ok' : percentage >= 50 ? 'warn' : 'bad'
  const headline =
    percentage === 100 ? 'Perfect paper.'
      : percentage >= 80 ? 'Strong work.'
      : percentage >= 50 ? 'Getting there.'
      : 'Worth a second look.'

  const [openRows, setOpenRows] = useState([])
  const allOpen = results.length > 0 && openRows.length === results.length

  const misses = useMemo(
    () => Object.entries(missTypes)
      .filter(([k]) => MISS_COPY[k])
      .sort((a, b) => b[1] - a[1]),
    [missTypes],
  )

  return (
    <Screen>
      <Stagger delay={0.04} step={0.05}>
        {/* Score */}
        <StaggerItem>
          <Card className="mb-4 p-5 text-center">
            <SectionLabel>{title}</SectionLabel>
            <motion.p
              className="mt-2 font-head text-5xl font-extrabold tracking-tight text-quiz-text"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={ease.bouncy}
            >
              <CountUp value={score} />
              <span className="text-quiz-muted">/{total}</span>
            </motion.p>
            <p className="mt-1 font-head text-lg font-extrabold text-quiz-orange">{headline}</p>

            <div className="mx-auto mt-4 max-w-xs">
              <ProgressBar value={percentage} tone={tone} height="lg" />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge tone="muted">{difficulty}</Badge>
              <Badge tone={rewarded ? 'orange' : mode === 'exam' ? 'purple' : 'accent'}>
                {rewarded
                  ? 'Daily Challenge'
                  : mode === 'exam' ? 'Exam mode' : 'Practice mode'}
              </Badge>
              {wordsTotal > 0 && (
                <Badge tone="muted" icon={<Icon name="target" className="h-3 w-3" />}>
                  {wordsFound}/{wordsTotal} errors spotted
                </Badge>
              )}
            </div>

            {/* Rewards */}
            {rewarded ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {xpDelta > 0 && (
                  <Badge tone="ok" size="md" icon={<Icon name="star" className="h-3.5 w-3.5" />}>
                    +{xpDelta} XP
                  </Badge>
                )}
                {gemsDelta > 0 && (
                  <Badge tone="cyan" size="md" icon={<Icon name="gem" className="h-3.5 w-3.5" />}>
                    +{gemsDelta}
                  </Badge>
                )}
                {daily?.streak_awarded && (
                  <Badge tone="orange" size="md" icon={<Icon name="flame" className="h-3.5 w-3.5" />}>
                    {daily.current_streak}-day streak
                  </Badge>
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs font-bold text-quiz-muted">
                Practice doesn't pay out — XP, crystals and your streak come
                from the Daily Challenge.
              </p>
            )}

            {daily && !daily.passed_today && (
              <p className="mt-3 text-xs font-bold text-quiz-muted">
                {daily.today_correct}/{daily.target} correct today — keep going for the streak.
              </p>
            )}
          </Card>
        </StaggerItem>

        {/* Where the marks went */}
        {misses.length > 0 && (
          <StaggerItem>
            <SectionLabel className="mb-2 px-1">Where the marks went</SectionLabel>
            <Card className="mb-4 divide-y divide-quiz-line p-0">
              {misses.map(([key, count]) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-quiz-red/10 font-head text-sm font-extrabold text-quiz-red">
                    {count}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-quiz-text">{MISS_COPY[key].label}</p>
                    <p className="text-xs font-semibold text-quiz-muted">{MISS_COPY[key].hint}</p>
                  </div>
                </div>
              ))}
            </Card>
          </StaggerItem>
        )}

        {/* Error types tested */}
        {byCode.length > 0 && (
          <StaggerItem>
            <SectionLabel className="mb-2 px-1">Error types in this passage</SectionLabel>
            <Card className="mb-4 flex flex-wrap gap-2 p-4">
              {byCode.map((c) => {
                const all = c.correct === c.total
                return (
                  <span
                    key={c.code}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-black',
                      all
                        ? 'border-quiz-green/40 bg-quiz-green/10 text-quiz-green'
                        : 'border-quiz-red/40 bg-quiz-red/10 text-quiz-red',
                    )}
                  >
                    <Icon name={all ? 'check' : 'x'} className="h-3 w-3" />
                    {c.name}
                    <span className="opacity-70">{c.correct}/{c.total}</span>
                  </span>
                )
              })}
            </Card>
          </StaggerItem>
        )}

        {/* Line by line — the marked answer column. One row per line, the
            reasoning on tap: showing ten explanations at once turned this
            into a wall nobody reads. */}
        <StaggerItem>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <SectionLabel>Line by line</SectionLabel>
            <button
              type="button"
              onClick={() => setOpenRows(allOpen ? [] : results.map((r) => r.line_no))}
              className="text-[11px] font-black uppercase tracking-wider text-quiz-orange hover:text-quiz-orange-dark"
            >
              {allOpen ? 'Hide why' : 'Show why'}
            </button>
          </div>
        </StaggerItem>
        <Card className="mb-4 divide-y divide-quiz-line p-0">
          {results.map((r) => (
            <ReviewRow
              key={r.line_no}
              r={r}
              open={openRows.includes(r.line_no)}
              onToggle={() => setOpenRows((prev) =>
                prev.includes(r.line_no)
                  ? prev.filter((n) => n !== r.line_no)
                  : [...prev, r.line_no])}
            />
          ))}
        </Card>

        {/* Teacher's note from the sheet */}
        {trapNote && (
          <StaggerItem>
            <Card className="mb-4 border-l-4 border-l-quiz-orange p-4">
              <SectionLabel className="mb-1">The trap in this one</SectionLabel>
              <p className="text-sm font-semibold leading-snug text-quiz-muted">{trapNote}</p>
            </Card>
          </StaggerItem>
        )}

        {/* Actions — one primary. Finishing a review means you're done, so
            Done goes back to Home; carrying on is a quiet link. */}
        <StaggerItem>
          <div className="pb-4">
            <Button3d variant="green" full size="lg" onClick={onHome}>
              Done
            </Button3d>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-orange"
              >
                Try again
              </button>
              {/* Omitted in the Daily Challenge, where there is no next one. */}
              {onNext && (
                <>
                  <span className="text-quiz-muted-soft" aria-hidden>·</span>
                  <button
                    type="button"
                    onClick={onNext}
                    className="text-xs font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-orange"
                  >
                    Next exercise
                  </button>
                </>
              )}
            </div>
          </div>
        </StaggerItem>
      </Stagger>
    </Screen>
  )
}

/**
 * Describe what the student actually did on a line, in words that survive a
 * half-finished answer. Concatenating word and correction blindly produced
 * things like "— → I \\" when one half was missing.
 */
function describeAnswer(r) {
  if (r.user_no_error) return 'no error'
  const word = (r.user_word || '').trim()
  const fix = (r.user_correction || '').trim()
  if (word && fix) return `${word} \u2192 ${fix}`
  if (word) return `circled ${word}, no correction`
  if (fix) return fix
  return 'left blank'
}

/**
 * One marked line, collapsed to a single row: the correct edit, and — when
 * they missed it — what they put instead. The explanation expands on tap.
 */
function ReviewRow({ r, open, onToggle }) {
  const right = r.is_correct
  const answer = r.expected_no_error
    ? 'No error'
    : `${r.incorrect_word} \u2192 ${r.correct_word}`

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-2 px-3 py-2 text-left"
      >
        <Icon
          name={right ? 'check' : 'x'}
          className={cn('mt-0.5 h-4 w-4 flex-none', right ? 'text-quiz-green' : 'text-quiz-red')}
        />
        <span className="mt-0.5 w-4 flex-none text-right font-head text-xs font-extrabold tabular-nums text-quiz-muted">
          {r.line_no}
        </span>

        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm font-bold', right ? 'text-quiz-text' : 'text-quiz-green')}>
            {answer}
          </span>
          {/* Only worth showing when it differs from the answer. */}
          {!right && (
            <span className="mt-0.5 block text-xs font-semibold text-quiz-muted">
              you: {describeAnswer(r)}
            </span>
          )}
        </span>

        {r.explanation && (
          <Icon
            name="chevronRight"
            className={cn(
              'mt-1 h-3.5 w-3.5 flex-none text-quiz-muted-soft transition-transform',
              open && 'rotate-90',
            )}
          />
        )}
      </button>

      {open && r.explanation && (
        <p className="px-3 pb-2.5 pl-[3.25rem] text-[13px] font-semibold leading-snug text-quiz-muted">
          {r.error_name && (
            <span className="mr-1.5 text-[10px] font-black uppercase tracking-wider text-quiz-muted-soft">
              {r.error_name}
            </span>
          )}
          {r.explanation}
        </p>
      )}
    </div>
  )
}
