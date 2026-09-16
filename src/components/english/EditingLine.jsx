import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ease, dur } from '../../motion'
import Icon from '../ui/Icon'

/**
 * EditingLine — one printed line of an editing passage, as it appears in
 * the passage itself.
 *
 * The passage is fit-to-width: each printed line stays on ONE line and the
 * type shrinks until the longest one fits (see `.ed-passage` in index.css and
 * the fit effect in EditingPlayer). That makes the words far too small to tap,
 * so this row is a *reader*, not an editor — tapping anywhere on it opens the
 * line enlarged in EditingLineSheet, which is where words get circled and
 * corrections typed.
 *
 * What the row still shows at a glance: the number in the gutter, the circled
 * word ringed in the prose, and the margin blank carrying either a tick or the
 * correction — the same three things you'd see on the paper.
 *
 * Props
 *   lineNo    1..10, printed in the gutter
 *   tokens    [{index, word, before, after}] from the backend
 *   answer    {noError, wordIndex, correction}
 *   result    marking for this line, or null
 *   locked    true once the line is marked (practice) or submitted
 *   onOpen    () => void — open this line in the sheet
 */
export default function EditingLine({
  lineNo,
  tokens = [],
  answer = {},
  result = null,
  locked = false,
  onOpen,
}) {
  const { noError = false, wordIndex = null, correction = '' } = answer
  const circling = wordIndex !== null
  const answered = noError || circling

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

  // Read aloud as the line plus what's been put against it, since the visible
  // text is far below a comfortable reading size.
  const plain = tokens.map((t) => `${t.before}${t.word}${t.after}`).join('')
  const said = noError
    ? 'ticked, no error'
    : circling
      ? `${tokens.find((t) => t.index === wordIndex)?.word} circled, correction ${correction || 'blank'}`
      : 'not answered'

  return (
    <motion.div layout className={cn('ed-line transition-colors', rowTint)}>
      <span className={cn('ed-no font-head font-extrabold', accent)}>{lineNo}</span>

      <button
        type="button"
        onClick={onOpen}
        disabled={locked}
        aria-label={`Line ${lineNo}: ${plain} — ${said}. Tap to answer.`}
        className={cn('ed-body font-sans text-quiz-text', noError && 'opacity-60')}
      >
        <span className="ed-measure">
          {tokens.map((t) => (
            <span key={t.index}>
              {t.before}
              <span
                className={cn(
                  'ed-word',
                  wordIndex === t.index && 'outline outline-1 outline-quiz-red text-quiz-red',
                )}
              >
                {t.word}
              </span>
              {t.after}
            </span>
          ))}
        </span>
      </button>

      {/* The margin slot reports the answer; it's edited in the sheet. On
          paper a line gets a tick or a word, never both. */}
      <div className="ed-slot">
        <button
          type="button"
          onClick={onOpen}
          disabled={locked}
          tabIndex={-1}
          aria-hidden
          className={cn(
            'ed-blank',
            noError ? 'border-quiz-green text-quiz-green' : cn(rule, circling ? 'text-quiz-text' : accent),
          )}
        >
          {noError
            ? <Icon name="check" className="mx-auto h-3 w-3" />
            : circling ? correction : null}
        </button>
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
