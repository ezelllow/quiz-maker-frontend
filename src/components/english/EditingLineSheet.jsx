import { useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import Button3d from '../ui/Button3d'
import Icon from '../ui/Icon'
import { cn } from '../../lib/cn'
import { LineFeedback } from './EditingLine'

/**
 * EditingLineSheet — one line of the passage, enlarged enough to work on.
 *
 * The passage itself is fit-to-width, so a printed line renders at whatever
 * size makes the longest line fit — far too small to hit a single word. This
 * is the other half of that trade: tap a line there, answer it here, at a
 * size where words are comfortably tappable and the blank is a real field.
 *
 * Prev/Next move along the passage without closing, so a student can work
 * straight down all ten lines from inside the sheet.
 *
 * Props
 *   open, onClose
 *   lineNo, total     which line, out of how many
 *   tokens            [{index, word, before, after}]
 *   answer            {noError, wordIndex, correction}
 *   onChange          (patch) => void
 *   result            marking for this line, or null
 *   locked            true once marked (practice) or submitting
 *   showCheck         practice mode — offer "Check this line"
 *   onCheck           mark it now
 *   onPrev, onNext    move along the passage (null at the ends)
 */
export default function EditingLineSheet({
  open,
  onClose,
  lineNo,
  total,
  tokens = [],
  answer = {},
  onChange,
  result = null,
  locked = false,
  showCheck = false,
  onCheck,
  onPrev,
  onNext,
}) {
  const inputRef = useRef(null)
  const { noError = false, wordIndex = null, correction = '' } = answer
  const circling = wordIndex !== null
  const answered = noError || circling

  // Focus the blank the moment a word is circled, so a student can
  // tap-then-type without a second tap on the field.
  const prevWord = useRef(wordIndex)
  useEffect(() => {
    if (!open) { prevWord.current = wordIndex; return }
    if (circling && prevWord.current === null && !locked) inputRef.current?.focus()
    prevWord.current = wordIndex
  }, [open, wordIndex, circling, locked])

  const tapWord = (i) => {
    if (locked) return
    if (wordIndex === i) onChange({ wordIndex: null, correction: '' })
    else onChange({ wordIndex: i, noError: false })
  }

  const toggleTick = () => {
    if (locked) return
    onChange({ noError: !noError, wordIndex: null, correction: '' })
  }

  const rule = result
    ? (result.is_correct ? 'border-quiz-green' : 'border-quiz-red')
    : answered ? 'border-quiz-orange' : 'border-quiz-line'

  return (
    <Modal open={open} onClose={onClose} hideButtons className="max-w-md">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-quiz-muted">
          Line {lineNo} of {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-quiz-muted hover:text-quiz-orange"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-[12px] font-bold text-quiz-muted">
        {locked
          ? 'Already marked.'
          : 'Tap the word that is wrong, then type the correction. No mistake on this line? Tick it.'}
      </p>

      {/* The line itself, big enough to aim at. */}
      <p className={cn('ed-zoom mt-3 font-sans text-quiz-text', noError && 'opacity-60')}>
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
                    ? 'outline outline-2 outline-offset-2 outline-quiz-red font-extrabold text-quiz-red'
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

      {/* Correction, or the tick. A line gets one or the other, never both. */}
      <div className="mt-4">
        {circling ? (
          <>
            <span className="text-[11px] font-black uppercase tracking-wider text-quiz-muted">
              Correction
            </span>
            <input
              ref={inputRef}
              type="text"
              value={correction}
              disabled={locked}
              onChange={(e) => onChange({ correction: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || locked) return
                e.preventDefault()
                if (showCheck && answered) onCheck?.()
                else if (onNext) onNext()
                else onClose?.()
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="type the right word"
              aria-label={`Correction for line ${lineNo}`}
              className={cn('ed-zoom-blank mt-1 text-quiz-text', rule)}
            />
          </>
        ) : (
          <Button3d
            full
            variant={noError ? 'green' : 'white'}
            disabled={locked}
            onClick={toggleTick}
          >
            {noError ? 'No error — ticked' : 'Tick: no error on this line'}
          </Button3d>
        )}
      </div>

      {result && <div className="mt-3"><LineFeedback result={result} /></div>}

      {/* Practice mode marks it here, so the answer and the reason for it
          stay in the same place. */}
      {showCheck && !locked && answered && (
        <div className="mt-3">
          <Button3d full variant="orange" onClick={onCheck}>Check this line</Button3d>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button3d variant="white" disabled={!onPrev} onClick={onPrev} className="flex-1">
          <span className="inline-flex items-center gap-1">
            <Icon name="chevronLeft" className="h-4 w-4" /> Prev
          </span>
        </Button3d>
        <Button3d variant="white" onClick={onClose} className="flex-1">Done</Button3d>
        <Button3d variant="white" disabled={!onNext} onClick={onNext} className="flex-1">
          <span className="inline-flex items-center gap-1">
            Next <Icon name="chevronRight" className="h-4 w-4" />
          </span>
        </Button3d>
      </div>
    </Modal>
  )
}
