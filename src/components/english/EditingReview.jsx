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
import EditingPassage from './EditingPassage'
import EditingLineSheet from './EditingLineSheet'

/**
 * EditingReview — the marked paper, literally.
 *
 * The passage the student just worked on, with the marking written onto it:
 * their circled word, their correction in the margin, a tick or a cross, and
 * under each line they lost, what it should have been and why. Which is why
 * there is no separate line-by-line list any more — it said exactly these
 * things again, in a different order and out of context.
 *
 * Below the paper, and only below it, the two things the annotations can't
 * show because they are about the paper as a whole: the SHAPE of the misses
 * (not seeing an error is a different problem from seeing it and writing the
 * wrong fix, and the two need different teaching), and which error types
 * this passage tested.
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
    uid, title, difficulty, score, total, percentage, mode, rewarded,
    words_found: wordsFound, words_total: wordsTotal,
    results = [], by_error_code: byCode = [], miss_types: missTypes = {},
    xp_delta: xpDelta = 0, gems_delta: gemsDelta = 0,
    daily_progress: daily,
    // Carried over by the player: the API marks lines but never returns
    // their words, so the paper itself has to travel with the result.
    exercise, answers = {},
  } = result || {}

  // The passage wants marking keyed by line, not a list.
  const byLine = useMemo(
    () => Object.fromEntries(results.map((r) => [r.line_no, r])),
    [results],
  )

  // On a phone the paper fits at around 7px, so a line has to be openable
  // to be read. Read-only here: the marking is done.
  const [openLine, setOpenLine] = useState(null)
  const lines = exercise?.lines || []
  const openIdx = openLine == null ? -1 : lines.findIndex((l) => l.line_no === openLine)

  const tone = percentage >= 80 ? 'ok' : percentage >= 50 ? 'warn' : 'bad'
  const headline =
    percentage === 100 ? 'Perfect paper.'
      : percentage >= 80 ? 'Strong work.'
      : percentage >= 50 ? 'Getting there.'
      : 'Worth a second look.'

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

        {/* The marked paper. Everything per-line lives here, in context:
            what they circled, what they wrote, and on a line they lost, the
            correction and the reason. */}
        {exercise && (
          <StaggerItem>
            <SectionLabel className="mb-2 px-1">Your marked paper</SectionLabel>
            <Card className="mb-4 p-3 sm:p-4">
              <EditingPassage
                exercise={exercise}
                answers={answers}
                results={byLine}
                locked
                noteWhen="wrong"
                onOpenLine={setOpenLine}
              />
            </Card>
          </StaggerItem>
        )}

        {openIdx >= 0 && (
          <EditingLineSheet
            open
            onClose={() => setOpenLine(null)}
            uid={uid}
            lineNo={lines[openIdx].line_no}
            total={lines.length}
            tokens={lines[openIdx].tokens}
            answer={answers[lines[openIdx].line_no] || {}}
            onChange={() => {}}
            result={byLine[lines[openIdx].line_no] || null}
            locked
            onPrev={openIdx > 0 ? () => setOpenLine(lines[openIdx - 1].line_no) : null}
            onNext={openIdx < lines.length - 1 ? () => setOpenLine(lines[openIdx + 1].line_no) : null}
          />
        )}

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
