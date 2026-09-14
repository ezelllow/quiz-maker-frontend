import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease, dur } from '../../motion'
import Icon from '../ui/Icon'

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
 * Props
 *   lineNo    1..10, printed in the gutter
 *   tokens    [{index, word, before, after}] from the backend
 *   answer    {noError, wordIndex, correction}
 *   onChange  (patch) => void — merged into the answer by the parent
 *   result    marking for this line, or null
 *   locked    true once the line is marked (practice) or submitted
 *   onCheck   practice mode — mark this line now
 */
export default function EditingLine({
  lineNo,
  tokens = [],
  answer = {},
  onChange,
  result = null,
  locked = false,
  onCheck,
  showCheck = false,
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

  return (
    <motion.div layout className={cn('ed-line transition-colors', rowTint)}>
      <span className={cn('ed-no font-head text-[11px] font-extrabold leading-[1.95]', accent)}>
        {lineNo}
      </span>

      <p
        className={cn(
          'ed-body font-sans text-[15px] leading-[1.95] text-quiz-text',
          noError && 'opacity-60',
        )}
      >
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
                    ? 'outline outline-2 outline-offset-1 outline-quiz-red font-extrabold text-quiz-red'
                    : !locked && 'hover:bg-quiz-orange/20',
                )}
              >
                {t.word}
              </button>
              {t.after}
            </span>
          )
        })}
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
            {noError && <Icon name="check" className="mx-auto h-3.5 w-3.5" />}
          </button>
        )}

        {/* Practice mode: mark this line. Only on a line that has an answer
            and hasn't been marked yet, so at most a couple are ever on
            screen — and it never sits in the prose. */}
        {showCheck && !locked && answered && (
          <button
            type="button"
            onClick={onCheck}
            className="rounded-pill bg-quiz-orange px-1 py-0.5 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-quiz-orange-dark"
          >
            Check
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {result && (
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
function LineFeedback({ result }) {
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
