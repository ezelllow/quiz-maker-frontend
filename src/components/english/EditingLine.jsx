import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease, dur } from '../../motion'
import Icon from '../ui/Icon'

// One canvas for the whole passage. Measuring the correction with a real
// text metric beats guessing from character count: "lll" and "www" are the
// same length and nowhere near the same width.
let metricsCtx = null

/**
 * Shrink a correction until it fits its blank.
 *
 * The margin blank is narrow by design — it's the margin of an exam paper,
 * not a form field — so a long correction used to scroll sideways inside it
 * and show neither end. Nothing is ever clipped now; it just gets smaller,
 * down to half size, which is where a word stops being worth reading and
 * scrolling is the lesser evil.
 */
function fitCorrection(el) {
  if (!el) return
  // Clear first, so this reads the size the CSS wants rather than whatever
  // the last run left behind — that's also what makes it correct after the
  // passage itself rescales.
  el.style.fontSize = ''
  const text = el.value
  if (!text) return
  const cs = getComputedStyle(el)
  const base = parseFloat(cs.fontSize)
  const room = el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0) - 1
  if (!base || !(room > 0)) return
  if (!metricsCtx) metricsCtx = document.createElement('canvas').getContext('2d')
  metricsCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const width = metricsCtx.measureText(text).width
  if (width > room) el.style.fontSize = `${Math.max(base * 0.5, (base * room) / width)}px`
}

/**
 * EditingLine — one printed line of an editing passage.
 *
 * Rendered as a row of the continuous passage (see `.ed-line` in index.css),
 * not as a card: the number hangs in the left gutter and the ruled blank sits
 * in the right margin, so ten of these stacked read as one block of prose,
 * the way the paper does.
 *
 * Tapping a word draws a ring round it — the paper's "circle the incorrect
 * word" — and turns the margin blank into the correction field. Until then
 * the blank is a tick toggle, because on paper a line gets a tick or a word,
 * never both.
 *
 * The passage fits its type to the column it is given, so on a narrow screen
 * the words can come out too small to aim at. The row therefore also carries
 * a full-size hit layer that opens the line enlarged (EditingLineSheet).
 * CSS decides which is live: the fit loop puts `.ed-tap-to-zoom` on the
 * passage below the size where tapping a word is realistic, and only then
 * does the hit layer take pointer events. Above it, everything here is
 * directly editable and the layer is inert — so a laptop, or a phone in
 * landscape, never has to open a sheet to answer a line.
 *
 * Props
 *   lineNo    1..10, printed in the gutter
 *   tokens    [{index, word, before, after}] from the backend
 *   answer    {noError, wordIndex, correction}
 *   onChange  (patch) => void — merged into the answer by the parent
 *   result    marking for this line, or null
 *   locked    true once the line is marked (practice) or submitted
 *   showNote  whether to print the marking note under the line. The parent
 *             decides: as each line is checked in practice it's the whole
 *             point, but on a finished paper a green tick already says
 *             "correct" and ten explanations at once is a wall nobody reads.
 *   onCheck   practice mode — mark this line now
 *   onOpen    open this line enlarged (used by the hit layer)
 */
export default function EditingLine({
  lineNo,
  tokens = [],
  answer = {},
  onChange,
  result = null,
  showNote = true,
  locked = false,
  onCheck,
  showCheck = false,
  onOpen,
}) {
  const inputRef = useRef(null)
  const { noError = false, wordIndex = null, correction = '' } = answer
  const circling = wordIndex !== null
  const answered = noError || circling

  // Focus the blank the moment a word is circled, so a student can
  // tap-then-type without a second tap on the margin.
  const prevWord = useRef(wordIndex)
  useEffect(() => {
    if (circling && prevWord.current === null && !locked) inputRef.current?.focus()
    prevWord.current = wordIndex
  }, [wordIndex, circling, locked])

  // Re-fit on every keystroke, and whenever the blank itself changes width —
  // which is how it keeps up with the passage rescaling, since that happens
  // in the DOM rather than through React.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return undefined
    fitCorrection(el)
    if (typeof ResizeObserver === 'undefined') return undefined
    // Only width matters; the font-size this sets changes height, so
    // watching height would be watching its own tail.
    let lastWidth = 0
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      if (w === lastWidth) return
      lastWidth = w
      fitCorrection(el)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [correction, circling])

  const tapWord = (i) => {
    if (locked) return
    if (wordIndex === i) onChange({ wordIndex: null, correction: '' })
    else onChange({ wordIndex: i, noError: false })
  }

  const toggleTick = () => {
    if (locked) return
    onChange({ noError: !noError, wordIndex: null, correction: '' })
  }

  const state = result ? (result.is_correct ? 'right' : 'wrong') : answered ? 'active' : 'idle'

  // The row tint is the only state chrome — no border, so the lines still
  // butt together as one passage.
  const rowTint = {
    idle: '',
    active: 'bg-quiz-orange/10',
    right: 'bg-quiz-green/10',
    wrong: 'bg-quiz-red/10',
  }[state]

  const accent = {
    idle: 'text-quiz-muted-soft',
    active: 'text-quiz-orange',
    right: 'text-quiz-green',
    wrong: 'text-quiz-red',
  }[state]

  const rule = {
    idle: 'border-quiz-line',
    active: 'border-quiz-orange',
    right: 'border-quiz-green',
    wrong: 'border-quiz-red',
  }[state]

  // Read aloud as the line plus what's been put against it: when the hit
  // layer is live the visible text is far below a comfortable reading size.
  const plain = tokens.map((t) => `${t.before}${t.word}${t.after}`).join('')
  const said = noError
    ? 'ticked, no error'
    : circling
      ? `${tokens.find((t) => t.index === wordIndex)?.word} circled, correction ${correction || 'blank'}`
      : 'not answered'

  return (
    <motion.div layout className={cn('ed-line transition-colors', rowTint)}>
      <span className={cn('ed-no font-head font-extrabold', accent)}>{lineNo}</span>

      <p className={cn('ed-body font-sans text-quiz-text', noError && 'opacity-60')}>
        {/* .ed-body is the column; this is what actually gets measured —
            see the note on .ed-measure in index.css. */}
        <span className="ed-measure">
          {tokens.map((t) => {
            const circled = wordIndex === t.index
            return (
              <span key={t.index}>
                {t.before}
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => tapWord(t.index)}
                  aria-pressed={circled}
                  aria-label={`Select the word ${t.word}`}
                  className={cn(
                    'ed-word',
                    circled
                      ? 'outline outline-1 outline-quiz-red font-extrabold text-quiz-red'
                      : !locked && 'hover:bg-quiz-orange/20',
                  )}
                >
                  {t.word}
                </button>
                {t.after}
              </span>
            )
          })}
        </span>
      </p>

      {/* The margin slot: correction field once a word is circled, tick
          toggle until then — on paper a line gets a tick or a word, never
          both — with the practice-mode Check chip tucked underneath. */}
      <div className="ed-slot">
        {circling ? (
          <input
            ref={inputRef}
            type="text"
            value={correction}
            disabled={locked}
            onChange={(e) => onChange({ correction: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showCheck && answered && !locked) {
                e.preventDefault()
                onCheck?.()
              }
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={`Correction for line ${lineNo}`}
            className={cn('ed-blank text-quiz-text', rule)}
          />
        ) : (
          <button
            type="button"
            onClick={toggleTick}
            disabled={locked}
            aria-pressed={noError}
            aria-label={`Mark line ${lineNo} as having no error`}
            title="No error on this line"
            className={cn(
              'ed-blank',
              noError ? 'border-quiz-green text-quiz-green' : cn(rule, accent),
            )}
          >
            {/* Empty until they actually tick it — on paper the blank starts
                blank, and a ghost tick read as "already ticked". The ruled
                blank itself is the target. */}
            {noError && <Icon name="check" className="mx-auto h-3 w-3" />}
          </button>
        )}

        {/* Practice mode: mark this line. Only on a line that has an answer
            and hasn't been marked yet, so at most a couple are ever on
            screen — and it never sits in the prose. */}
        {showCheck && !locked && answered && (
          <button
            type="button"
            onClick={onCheck}
            className="ed-check rounded-pill bg-quiz-orange font-black uppercase tracking-wider text-white transition-colors hover:bg-quiz-orange-dark"
          >
            Check
          </button>
        )}
      </div>

      {/* Inert until the passage is too small to READ directly, at which
          point CSS gives it pointer events and it swallows the whole row.
          Present on a locked line too: a marked line at 7px still has to be
          openable, or the marking is unreadable on a phone. */}
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          tabIndex={-1}
          aria-label={`Line ${lineNo}: ${plain} — ${said}. Open larger.`}
          className="ed-zoom-hit"
        />
      )}

      <AnimatePresence initial={false}>
        {result && showNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: dur.md, ease: ease.out }}
            className="ed-note overflow-hidden"
          >
            <LineFeedback result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * The marking note. A left accent rule rather than a card, so it reads as an
 * annotation on the passage instead of breaking it into boxes.
 */
export function LineFeedback({ result }) {
  const right = result.is_correct
  // "Right word, wrong fix" is worth calling out on its own — the student did
  // the hard half and shouldn't read it as a plain miss.
  const nearMiss = !right && result.miss_type === 'wrong_correction'

  return (
    <div
      className={cn(
        'mb-1 mt-0.5 border-l-2 pl-2 text-[12.5px] leading-snug',
        right ? 'border-quiz-green' : 'border-quiz-red',
      )}
    >
      <span
        className={cn(
          'font-black uppercase tracking-wider',
          right ? 'text-quiz-green' : 'text-quiz-red',
        )}
      >
        {right ? 'Correct' : nearMiss ? 'Right word' : 'Not quite'}
      </span>

      {!right && (
        <span className="ml-1.5 font-bold">
          {result.expected_no_error ? (
            <span className="text-quiz-green">no error here</span>
          ) : (
            <>
              <span className="text-quiz-red line-through">{result.incorrect_word}</span>
              <span className="mx-1 text-quiz-muted">&rarr;</span>
              <span className="text-quiz-green">{result.correct_word}</span>
            </>
          )}
        </span>
      )}

      {result.error_name && (
        <span className="ml-1.5 text-[11px] font-black uppercase tracking-wider text-quiz-muted-soft">
          {result.error_name}
        </span>
      )}

      {result.explanation && (
        <p className="mt-0.5 font-semibold text-quiz-muted">{result.explanation}</p>
      )}
    </div>
  )
}
