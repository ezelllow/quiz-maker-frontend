import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from '../ui/Screen'
import Card from '../ui/Card'
import Button3d from '../ui/Button3d'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import Modal from '../ui/Modal'
import ProgressBar from '../ui/ProgressBar'
import Skeleton from '../ui/Skeleton'
import { ease } from '../../motion'
import EditingLineSheet from './EditingLineSheet'
import EditingPassage, { BLANK } from './EditingPassage'
import useWideFrame from '../../hooks/useWideFrame'
import { usePublishReportTarget } from '../../lib/reportTarget'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function PlayerScreen({ children }) {
  return <Screen>{children}</Screen>
}


/**
 * EditingPlayer — work through one editing exercise.
 *
 * Two modes, chosen on the hub:
 *   exam      mark at the end, exam conditions
 *   practice  mark each line as you go, with the explanation
 *
 * Neither pays out: XP, crystals and the streak come from the Daily
 * Challenge (`daily`), exactly like physics. The Practice section is 60
 * replayable passages, so paying it would make XP farmable.
 *
 * Answers are graded on the server in both modes. The client never receives
 * the answer key, so a curious student reading the network tab learns
 * nothing they haven't already earned.
 */
export default function EditingPlayer({
  authToken,
  uid,
  mode = 'exam',
  daily = false,
  onExit,
  onFinished,
  onActiveChange,
}) {
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [lineResults, setLineResults] = useState({})   // practice mode only
  const [submitting, setSubmitting] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [openLine, setOpenLine] = useState(null)   // line_no shown enlarged

  const startedAt = useRef(0)

  // The passage fits its type to the column, so the whole window is worth
  // more here than it is on a quiz screen.
  useWideFrame()

  // So the header's report button names this passage.
  usePublishReportTarget(
    () => ({ subject: 'English', uid, screen: 'quiz' }),
    [uid],
  )
  const isPractice = mode === 'practice'

  // ── load ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API_BASE_URL}/api/english/exercises/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Could not load this exercise')
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setExercise(data)
        setAnswers(Object.fromEntries(data.lines.map((l) => [l.line_no, { ...BLANK }])))
        startedAt.current = Date.now()
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [uid, authToken])

  // Tell App a quiz is live so navigating away asks first.
  useEffect(() => {
    startedAt.current = Date.now()
    onActiveChange?.(true)
    return () => onActiveChange?.(false)
  }, [onActiveChange])

  // ── timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || error) return undefined
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [loading, error])

  const patchAnswer = useCallback((lineNo, patch) => {
    setAnswers((prev) => ({ ...prev, [lineNo]: { ...prev[lineNo], ...patch } }))
  }, [])

  const lines = exercise?.lines || []
  const total = lines.length

  // A line counts as done when it is ticked, or a word is circled AND a
  // correction typed. A circled word with an empty box is still in progress.
  const isDone = (a) => !!a && (a.noError || (a.wordIndex !== null && a.correction.trim() !== ''))
  const doneCount = useMemo(
    () => (exercise?.lines || []).filter((l) => isDone(answers[l.line_no])).length,
    [exercise, answers],
  )
  const checkedCount = Object.keys(lineResults).length
  // Derived, so Prev/Next only ever has to move the line number.
  const openIdx = openLine == null ? -1 : lines.findIndex((l) => l.line_no === openLine)
  const allDone = total > 0 && doneCount === total
  const readyToSubmit = isPractice ? checkedCount === total : allDone

  // ── practice: mark one line ─────────────────────────────────────────
  const checkLine = async (lineNo) => {
    const a = answers[lineNo]
    if (!isDone(a) || lineResults[lineNo]) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/english/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          uid,
          line_no: lineNo,
          no_error: a.noError,
          word_index: a.wordIndex,
          correction: a.correction,
        }),
      })
      if (!res.ok) throw new Error('Could not check that line')
      const marked = await res.json()
      setLineResults((prev) => ({ ...prev, [lineNo]: marked }))
    } catch (e) {
      setError(e.message)
    }
  }

  // ── submit ──────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true)
    setConfirmSubmit(false)
    try {
      const res = await fetch(`${API_BASE_URL}/api/english/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          uid,
          mode,
          daily,
          time_spent_seconds: Math.floor((Date.now() - startedAt.current) / 1000),
          answers: lines.map((l) => ({
            line_no: l.line_no,
            no_error: answers[l.line_no]?.noError || false,
            word_index: answers[l.line_no]?.wordIndex ?? null,
            correction: answers[l.line_no]?.correction || '',
          })),
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not submit')
      const data = await res.json()
      onActiveChange?.(false)
      // The review draws the marked paper, and the API returns marking per
      // line but never the line's words — so the passage and the student's
      // own answers travel with the result.
      onFinished?.({ ...data, exercise, answers })
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  // ── render ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PlayerScreen>
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Card className="space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </Card>
      </PlayerScreen>
    )
  }

  if (error && !exercise) {
    return (
      <PlayerScreen>
        <Card className="p-6 text-center">
          <p className="font-bold text-quiz-red">{error}</p>
          <Button3d variant="white" className="mt-4" onClick={onExit}>Back</Button3d>
        </Card>
      </PlayerScreen>
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <PlayerScreen>
      {/* Header */}
      <header className="mb-4 pt-1">
        <button
          type="button"
          onClick={onExit}
          className="mb-2 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-orange"
        >
          <Icon name="x" className="h-3.5 w-3.5" /> Leave
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-head !text-2xl !font-extrabold tracking-tight">{exercise.title}</h1>
          <div className="flex items-center gap-2">
            <Badge tone={isPractice ? 'accent' : 'purple'}>
              {isPractice ? 'Practice' : 'Exam'}
            </Badge>
            <Badge tone="muted" icon={<Icon name="clock" className="h-3 w-3" />}>
              {mm}:{ss}
            </Badge>
          </div>
        </div>
      </header>

      {/* Instructions */}
      <Card className="mb-4 p-4">
        <p className="text-sm font-semibold leading-relaxed text-quiz-muted">
          {exercise.instructions}
        </p>
        {isPractice && (
          <p className="mt-2 text-[13px] font-bold text-quiz-orange">
            Practice mode marks each line as you go, so take your time.
          </p>
        )}
      </Card>

      {/* Progress */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-quiz-muted">
            {isPractice ? `${checkedCount} of ${total} checked` : `${doneCount} of ${total} answered`}
          </span>
          <span className="text-[11px] font-black text-quiz-muted">{exercise.difficulty}</span>
        </div>
        <ProgressBar
          value={((isPractice ? checkedCount : doneCount) / (total || 1)) * 100}
          tone={isPractice ? 'accent' : 'ok'}
          height="sm"
        />
      </div>

      {/* The passage — one continuous block; the lines butt together
          rather than sitting in separate cards. */}
      <Card className="p-3 sm:p-4">
        <EditingPassage
          exercise={exercise}
          answers={answers}
          results={lineResults}
          locked={submitting}
          showCheck={isPractice}
          onChange={patchAnswer}
          onCheck={checkLine}
          onOpenLine={setOpenLine}
        />
      </Card>

      {/* Answering happens here: at passage size the words are too small to
          aim at, so a tap opens the line big enough to work on. */}
      {openIdx >= 0 && (
        <EditingLineSheet
          open
          onClose={() => setOpenLine(null)}
          uid={uid}
          lineNo={lines[openIdx].line_no}
          total={total}
          tokens={lines[openIdx].tokens}
          answer={answers[lines[openIdx].line_no] || BLANK}
          onChange={(patch) => patchAnswer(lines[openIdx].line_no, patch)}
          result={lineResults[lines[openIdx].line_no] || null}
          locked={!!lineResults[lines[openIdx].line_no] || submitting}
          showCheck={isPractice}
          onCheck={() => checkLine(lines[openIdx].line_no)}
          onPrev={openIdx > 0 ? () => setOpenLine(lines[openIdx - 1].line_no) : null}
          onNext={openIdx < lines.length - 1 ? () => setOpenLine(lines[openIdx + 1].line_no) : null}
        />
      )}

      {error && (
        <p className="mt-3 text-center text-sm font-bold text-quiz-red">{error}</p>
      )}

      {/* Submit */}
      <motion.div
        className="sticky bottom-3 z-20 mt-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ease.smooth}
      >
        <Button3d
          full
          size="lg"
          variant={readyToSubmit ? 'green' : 'white'}
          loading={submitting}
          loadingLabel="Marking…"
          onClick={() => (readyToSubmit ? submit() : setConfirmSubmit(true))}
        >
          {readyToSubmit
            ? isPractice ? 'See my results' : 'Submit for marking'
            : `Submit — ${total - (isPractice ? checkedCount : doneCount)} left`}
        </Button3d>
      </motion.div>

      <Modal
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={submit}
        title="Submit unfinished?"
        body={`${total - (isPractice ? checkedCount : doneCount)} of ${total} lines are still blank. Blank lines are marked wrong.`}
        confirmLabel="Submit anyway"
        cancelLabel="Keep working"
        tone="red"
      />
    </PlayerScreen>
  )
}
