import { useCallback, useEffect, useRef } from 'react'
import EditingLine from './EditingLine'

// Fit-to-width bounds. The passage is measured at REF and then scaled until
// its longest line exactly fills the column. MIN is the floor, below which a
// passage would be a grey smear rather than small text; MAX is the ceiling,
// because past it a "passage" reads as a list of sentences. On a phone the
// result lands near the floor and on a laptop near the ceiling — same
// mechanism, which is why no breakpoints appear anywhere in here.
const FIT_REF_PX = 15
const FIT_MIN_PX = 6
const FIT_MAX_PX = 18

// At or above this fitted size a word is a realistic tap target, so the line
// is answered where it sits. Below it the row turns into one big target that
// opens the line enlarged instead. A laptop is always above it; a phone in
// portrait, with a full exam line to fit, is always below.
const FIT_INLINE_PX = 12

const BLANK = { noError: false, wordIndex: null, correction: '' }

/**
 * EditingPassage — the twelve printed lines, as one block of prose.
 *
 * Every printed line stays on ONE line, the way it does on the paper, and
 * the type shrinks until the longest line in this passage fits the column it
 * is given. That is measured, not guessed from a breakpoint, so the same
 * code gives ~7px on a phone in portrait and ~18px on a laptop.
 *
 * Shared by the player and the review, which is the point: the marked paper
 * a student reads afterwards should BE the paper they worked on, with the
 * marking written onto it, not a separate list of rows that says the same
 * things in a different order.
 *
 * Props
 *   exercise    {intro_line, outro_line, lines:[{line_no, tokens}]}
 *   answers     {[line_no]: {noError, wordIndex, correction}}
 *   results     {[line_no]: marking} — annotates the lines
 *   locked      nothing on the passage is editable
 *   noteWhen    'always' (practice, as each line is checked) or 'wrong'
 *               (the review: a green tick says "correct" on its own, and ten
 *               explanations at once is a wall nobody reads)
 *   showCheck   practice mode — offer the per-line Check chip
 *   onChange, onCheck, onOpenLine
 */
export default function EditingPassage({
  exercise,
  answers = {},
  results = {},
  locked = false,
  noteWhen = 'always',
  showCheck = false,
  onChange,
  onCheck,
  onOpenLine,
}) {
  const ref = useRef(null)
  const lines = exercise?.lines || []

  const fit = useCallback(() => {
    const el = ref.current
    if (!el) return
    const bodies = el.querySelectorAll('.ed-body')
    if (!bodies.length) return

    // Measure the inner .ed-measure span, never .ed-body itself: .ed-body is
    // a <button>, and a button's scrollWidth is clamped to its client width,
    // so measuring it reports "it fits" at every size.
    const measure = (size) => {
      el.style.setProperty('--ed-fs', `${size}px`)
      let widest = 0
      let avail = Infinity
      bodies.forEach((b) => {
        const span = b.querySelector('.ed-measure')
        widest = Math.max(widest, span ? span.getBoundingClientRect().width : b.scrollWidth)
        avail = Math.min(avail, b.clientWidth)
      })
      return { widest, avail }
    }

    // Iterative, because the gutter and margin scale with the type too: a
    // smaller size frees width, which then allows a larger size. It settles
    // in three or four passes from either direction.
    let fs = FIT_REF_PX
    for (let pass = 0; pass < 6; pass += 1) {
      const { widest, avail } = measure(fs)
      if (!widest || !Number.isFinite(avail) || avail <= 0) return
      // avail - 1 leaves a hair for the circling ring, which sits outside
      // the box model but still needs room at the end of a line.
      const ideal = Math.min(FIT_MAX_PX, Math.max(FIT_MIN_PX, (fs * (avail - 1)) / widest))
      const settled = Math.abs(ideal - fs) < 0.05
      fs = ideal
      if (settled) break
    }

    // Land on a size measured to fit rather than one predicted to: the
    // estimate is linear, the layout it feeds is not quite.
    for (let guard = 0; guard < 10; guard += 1) {
      const { widest, avail } = measure(fs)
      if (widest <= avail - 1 || fs <= FIT_MIN_PX) break
      fs = Math.max(FIT_MIN_PX, fs * 0.97)
    }

    el.style.setProperty('--ed-fs', `${fs.toFixed(2)}px`)
    // Which answering mode this size can support. A class rather than state:
    // this runs on every resize, and re-rendering twelve lines to flip one
    // boolean would be wasted work.
    el.classList.toggle('ed-tap-to-zoom', fs < FIT_INLINE_PX)
  }, [])

  useEffect(() => {
    if (!exercise) return undefined
    fit()
    // Web fonts land after first paint and change every measurement.
    document.fonts?.ready?.then(fit).catch(() => {})
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    // Only the column width matters. Guarding on it also keeps the observer
    // from chasing its own tail: changing --ed-fs changes height, not width.
    let lastWidth = 0
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      if (w === lastWidth) return
      lastWidth = w
      fit()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [exercise, fit])

  if (!exercise) return null

  return (
    <div className="ed-passage" ref={ref}>
      <FixedLine text={exercise.intro_line} />

      {lines.map((l) => {
        const result = results[l.line_no] || null
        return (
          <EditingLine
            key={l.line_no}
            lineNo={l.line_no}
            tokens={l.tokens}
            answer={answers[l.line_no] || BLANK}
            onChange={onChange ? (patch) => onChange(l.line_no, patch) : undefined}
            result={result}
            showNote={!!result && (noteWhen === 'always' || !result.is_correct)}
            locked={locked || !!result}
            showCheck={showCheck}
            onCheck={onCheck ? () => onCheck(l.line_no) : undefined}
            onOpen={onOpenLine ? () => onOpenLine(l.line_no) : undefined}
          />
        )
      })}

      <FixedLine text={exercise.outro_line} />

      {/* Only shown when the passage actually shrank past the point of
          being readable at arm's length — see .ed-zoom-hint. */}
      {onOpenLine && (
        <p className="ed-zoom-hint mt-2 text-center text-[11px] font-bold text-quiz-muted-soft">
          {locked ? 'Tap a line to enlarge it' : 'Tap a line to enlarge it and answer'}
        </p>
      )}
    </div>
  )
}

/**
 * The first and last lines: always correct, so they carry no number and no
 * blank, exactly as on the paper.
 */
function FixedLine({ text }) {
  if (!text) return null
  return (
    <div className="ed-line">
      <span className="ed-no" aria-hidden />
      <p className="ed-body font-sans text-quiz-muted">
        <span className="ed-measure">{text}</span>
      </p>
      <span className="ed-slot" aria-hidden />
    </div>
  )
}

export { BLANK }
