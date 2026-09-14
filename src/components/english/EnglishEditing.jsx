import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from '../ui/Screen'
import Card from '../ui/Card'
import Icon from '../ui/Icon'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import SectionLabel from '../ui/SectionLabel'
import Button3d from '../ui/Button3d'
import ProgressBar from '../ui/ProgressBar'
import { Stagger, StaggerItem } from '../ui/Motion'
import { cn } from '../../lib/cn'
import { ease } from '../../motion'
import EditingPlayer from './EditingPlayer'
import EditingReview from './EditingReview'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Difficulty drives each card's cover colour. Only classes that the dark
// theme's override list knows about are used here — anything else keeps its
// light value and glares on a dark card.
const DIFF_STYLE = {
  Easy:   { cover: 'bg-quiz-green/15',  text: 'text-quiz-green'  },
  Medium: { cover: 'bg-quiz-orange/15', text: 'text-quiz-orange' },
  Hard:   { cover: 'bg-quiz-red/15',    text: 'text-quiz-red'    },
}
const DIFF_FALLBACK = { cover: 'bg-quiz-bg-2', text: 'text-quiz-muted' }
const DIFF_ORDER = ['Easy', 'Medium', 'Hard']

/** Easy → Medium → Hard, with anything unrecognised last. */
function byDifficulty(list) {
  const seen = list.filter((d) => DIFF_ORDER.includes(d))
  const rest = list.filter((d) => !DIFF_ORDER.includes(d))
  return [...DIFF_ORDER.filter((d) => seen.includes(d)), ...rest]
}

/**
 * EnglishEditing — the English subject hub.
 *
 *   hub    pick a mode and an exercise
 *   play   EditingPlayer
 *   review EditingReview
 *
 * Mounted from PracticePage, so it inherits that screen's back-to-picker
 * navigation and the App-level "leave a live quiz?" guard.
 */
export default function EnglishEditing({
  authToken,
  onBack,
  onProgressionChange,
  onGemsChange,
  onQuizActiveChange,
  onNavigate,
}) {
  const [step, setStep] = useState('hub')
  const [mode, setMode] = useState('exam')
  const [difficulty, setDifficulty] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeUid, setActiveUid] = useState(null)
  const [result, setResult] = useState(null)

  const loadHub = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/english/exercises`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).detail
          || 'Could not load the editing exercises')
      }
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { loadHub() }, [loadHub])

  const visible = useMemo(() => {
    const all = data?.exercises || []
    return difficulty === 'all' ? all : all.filter((e) => e.difficulty === difficulty)
  }, [data, difficulty])

  // One shelf per difficulty, Easy → Medium → Hard. The chips only decide
  // WHICH shelves are shown — the presentation is the same either way, so
  // browsing "Easy" looks like browsing everything.
  const shelves = useMemo(() => {
    const all = data?.exercises || []
    return byDifficulty([...new Set(all.map((e) => e.difficulty))])
      .filter((d) => difficulty === 'all' || d === difficulty)
      .map((d) => ({ difficulty: d, items: all.filter((e) => e.difficulty === d) }))
  }, [data, difficulty])

  const start = (uid) => { setActiveUid(uid); setResult(null); setStep('play') }

  const finish = (payload) => {
    setResult(payload)
    setStep('review')
    if (payload?.progression) onProgressionChange?.(payload.progression)
    if (typeof payload?.gems_total === 'number') onGemsChange?.(payload.gems_total)
    loadHub()   // refresh the cards' best scores behind the review
  }

  // "Next exercise" walks the shelves the student is currently looking at.
  const nextUid = () => {
    const i = visible.findIndex((e) => e.uid === activeUid)
    return visible[(i + 1) % (visible.length || 1)]?.uid || activeUid
  }

  // ── play / review ───────────────────────────────────────────────────
  if (step === 'play' && activeUid) {
    return (
      <EditingPlayer
        authToken={authToken}
        uid={activeUid}
        mode={mode}
        onExit={() => { setStep('hub'); onQuizActiveChange?.(false) }}
        onFinished={finish}
        onActiveChange={onQuizActiveChange}
      />
    )
  }

  if (step === 'review' && result) {
    return (
      <EditingReview
        result={result}
        onHome={() => {
          onQuizActiveChange?.(false)
          // Falls back to the hub when Practice wasn't given a router — the
          // review should never be a dead end.
          if (onNavigate) onNavigate('home')
          else setStep('hub')
        }}
        onRetry={() => start(activeUid)}
        onNext={() => start(nextUid())}
      />
    )
  }

  // byDifficulty, not the backend's alphabetical order — otherwise the chips
  // read All / Easy / Hard / Medium.
  const diffTabs = [
    { id: 'all', label: 'All' },
    ...byDifficulty(data?.difficulties || []).map((d) => ({ id: d, label: d })),
  ]

  return (
    <Screen>
      <Stagger delay={0.04} step={0.05}>
        <StaggerItem>
          <header className="mb-5 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-quiz-muted hover:text-quiz-orange"
            >
              <Icon name="compass" className="h-3.5 w-3.5" /> All subjects
            </button>
            <SectionLabel>English</SectionLabel>
            <h1 className="mt-1 font-head !text-3xl !font-extrabold tracking-tight">Editing</h1>
            <p className="mt-1 text-sm font-semibold text-quiz-muted">
              Find the error in each line, and fix it.
            </p>
          </header>
        </StaggerItem>

        {/* Mode picker — the choice that changes how the whole thing feels */}
        <StaggerItem>
          <SectionLabel className="mb-2 px-1">How do you want to work?</SectionLabel>
          <div
            className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Working mode"
          >
            <ModeCard
              active={mode === 'exam'}
              onClick={() => setMode('exam')}
              icon="flag"
              title="Exam mode"
              blurb="Marked at the end"
            />
            <ModeCard
              active={mode === 'practice'}
              onClick={() => setMode('practice')}
              icon="bulb"
              title="Practice mode"
              blurb="Marked as you go, with reasons"
            />
          </div>
          {/* Says the choice in words as well as colour, so it survives a
              glance, a colour-blind reader and a dim phone screen. */}
          <p className="mb-5 px-1 text-[13px] font-bold text-quiz-muted">
            Picking an exercise below starts it in{' '}
            <span className="text-quiz-orange">
              {mode === 'exam' ? 'Exam mode' : 'Practice mode'}
            </span>
            . Practise as much as you like here — XP, crystals and your streak
            come from the Daily Challenge.
          </p>
        </StaggerItem>

        {/* Difficulty filter */}
        {diffTabs.length > 2 && (
          <StaggerItem>
            <div
              className="mb-4 inline-flex gap-1 rounded-pill border border-quiz-line bg-white p-1"
              role="tablist"
              aria-label="Filter by difficulty"
            >
              {diffTabs.map((t) => {
                const active = difficulty === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDifficulty(t.id)}
                    className={cn(
                      'rounded-pill px-3.5 py-1.5 text-xs font-black transition-colors',
                      active
                        ? 'bg-quiz-orange text-white'
                        : 'text-quiz-muted hover:bg-quiz-orange/10 hover:text-quiz-orange-dark',
                    )}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </StaggerItem>
        )}

        {/* The library. One shelf per difficulty, whichever chips are
            active — so every view looks and behaves the same. */}
        {loading ? (
          <div className="ed-shelf">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-[168px] flex-none" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <p className="font-bold text-quiz-red">{error}</p>
            <Button3d variant="white" className="mt-4" onClick={loadHub}>Try again</Button3d>
          </Card>
        ) : visible.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            body="No editing exercises at this difficulty."
          />
        ) : (
          <div className="space-y-6 pb-4">
            {shelves.map((group) => (
              <Shelf key={group.difficulty} title={group.difficulty} count={group.items.length}>
                {group.items.map((ex) => (
                  <ExerciseCard key={ex.uid} ex={ex} onStart={() => start(ex.uid)} />
                ))}
              </Shelf>
            ))}
          </div>
        )}
      </Stagger>
    </Screen>
  )
}

function ModeCard({ active, onClick, icon, title, blurb }) {
  // One accent for "selected", not one colour per mode: in the light palette
  // quiz-purple and quiz-orange resolve to the SAME gold, so a colour-coded
  // pair would be indistinguishable there. The fill, border, filled icon chip
  // and coloured title carry the state — no badge needed to say so.
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      transition={ease.spring}
      role="radio"
      aria-checked={active}
      className={cn(
        'flex items-center gap-2.5 rounded-md border-2 p-3 text-left transition-colors',
        active
          ? 'border-quiz-orange bg-quiz-orange/15 shadow-md'
          : 'border-quiz-line bg-white hover:border-quiz-orange/50',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 flex-none items-center justify-center rounded-full transition-colors',
          active ? 'bg-quiz-orange text-white' : 'bg-quiz-bg-2 text-quiz-muted',
        )}
      >
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-head text-[15px] font-extrabold leading-tight',
            active ? 'text-quiz-orange' : 'text-quiz-text',
          )}
        >
          {title}
        </span>
        <span className="block text-[12px] font-semibold text-quiz-muted">{blurb}</span>
      </span>
    </motion.button>
  )
}



/**
 * Shelf — one horizontally scrolling row of the library.
 *
 * The row bleeds to the screen edges so a card at the boundary is visibly cut
 * off — that's what tells you it scrolls. The scrollbar is hidden; on a device
 * with a pointer, arrows fade in over the edges and step one card at a time.
 * On touch the arrows are gone and you just swipe.
 */
function Shelf({ title, count, children }) {
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    // 4px of slack so a sub-pixel scroll position doesn't leave an arrow
    // enabled at a end of the row.
    setEdges({
      start: el.scrollLeft > 4,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    // Measured on the next frame rather than in the effect body, so the
    // first paint has settled and this isn't a synchronous setState.
    const frame = requestAnimationFrame(measure)
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure, children])

  // ── Arrow proximity ─────────────────────────────────────────────────
  // An arrow shows only while the pointer is near its own edge. Done in JS
  // and toggled imperatively (no re-render per move) because a CSS hover
  // zone big enough to trigger this would sit on top of the end cards and
  // eat their clicks.
  const EDGE = 80

  const onWrapMove = (e) => {
    const wrap = wrapRef.current
    if (!wrap || e.pointerType === 'touch') return
    const { left, width } = wrap.getBoundingClientRect()
    const x = e.clientX - left
    wrap.classList.toggle('is-near-start', x < EDGE)
    wrap.classList.toggle('is-near-end', x > width - EDGE)
  }

  const onWrapLeave = () => {
    const wrap = wrapRef.current
    if (!wrap) return
    wrap.classList.remove('is-near-start', 'is-near-end')
  }

  // ── Drag to pan ─────────────────────────────────────────────────────
  // Mouse/pen only: touch already scrolls natively and taking that over
  // would fight the browser. Written straight to scrollLeft (and a class
  // toggled imperatively) rather than through state, so a drag doesn't
  // re-render the whole shelf on every pointer move.
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false })

  const onPointerDown = (e) => {
    const el = ref.current
    if (!el || e.pointerType === 'touch' || el.scrollWidth <= el.clientWidth) return
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
  }

  const onPointerMove = (e) => {
    const el = ref.current
    if (!el || !drag.current.active) return
    const dx = e.clientX - drag.current.startX
    // 4px of slack, so a slightly shaky click is still a click.
    if (!drag.current.moved && Math.abs(dx) > 4) {
      drag.current.moved = true
      // Capture only once this is genuinely a drag. Capturing on pointerdown
      // retargets the whole compatibility click to this element, which stops
      // the card underneath from ever receiving it — cards became unclickable.
      el.setPointerCapture?.(e.pointerId)
      el.classList.add('is-dragging')
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startLeft - dx
  }

  const endDrag = (e) => {
    const el = ref.current
    if (!el || !drag.current.active) return
    drag.current.active = false
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId)
    el.classList.remove('is-dragging')
    // Clear on the next task, so the click that follows this pointerup (if the
    // browser sends one) is still swallowed but the next real click is not.
    if (drag.current.moved) setTimeout(() => { drag.current.moved = false }, 0)
  }

  // Swallow the click that ends a drag, or letting go over a card would open it.
  const onClickCapture = (e) => {
    if (!drag.current.moved) return
    e.preventDefault()
    e.stopPropagation()
    drag.current.moved = false
  }

  // One card per press. Measured off the card itself so it stays right if the
  // card size ever changes.
  const step = (direction) => {
    const el = ref.current
    if (!el) return
    const card = el.firstElementChild
    const gap = parseFloat(getComputedStyle(el).columnGap) || 10
    const by = card ? card.offsetWidth + gap : el.clientWidth * 0.8
    el.scrollBy({ left: direction * by, behavior: 'smooth' })
  }

  const arrow = 'ed-arrow border border-quiz-line bg-white text-quiz-text shadow-md hover:bg-quiz-orange hover:text-white'

  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <SectionLabel>{title}</SectionLabel>
        <span className="text-[10px] font-black text-quiz-muted-soft">{count}</span>
      </div>

      <div
        ref={wrapRef}
        className="ed-shelf-wrap -mx-4 sm:-mx-6"
        onPointerMove={onWrapMove}
        onPointerLeave={onWrapLeave}
      >
        <div
          ref={ref}
          className="ed-shelf px-4 sm:px-6"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          {children}
        </div>

        {edges.start && (
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={`Scroll ${title} back`}
            className={cn(arrow, 'ed-arrow-l')}
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
        )}
        {edges.end && (
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={`Scroll ${title} forward`}
            className={cn(arrow, 'ed-arrow-r')}
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  )
}

/** One passage, as a card on the shelf. */
function ExerciseCard({ ex, onStart, className }) {
  const p = ex.progress
  const done = !!p
  const style = DIFF_STYLE[ex.difficulty] || DIFF_FALLBACK
  // Full marks is worth separating from merely attempted — a student coming
  // back wants to see which ones they haven't nailed yet, not just which ones
  // they've opened.
  const aced = done && p.total > 0 && p.best_score >= p.total

  return (
    <motion.button
      type="button"
      onClick={onStart}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={ease.spring}
      className={cn(
        'flex w-[168px] flex-none flex-col overflow-hidden rounded-md border border-quiz-line',
        'bg-white text-left transition-colors hover:border-quiz-orange/50 hover:shadow-lg',
        className,
      )}
    >
      {/* Cover — colour-coded by difficulty, with the oversized glyph a
          book spine would carry. */}
      <div className={cn('relative flex h-16 items-end px-2.5 pb-2', style.cover)}>
        {/* The spine glyph steps aside once a passage is done, so the
            completed tick doesn't land on top of it. */}
        {!done && (
          <Icon
            name="book"
            className={cn('pointer-events-none absolute -right-1 -top-1 h-12 w-12 opacity-20', style.text)}
            aria-hidden
          />
        )}
        <span className={cn('text-[9px] font-black uppercase tracking-widest', style.text)}>
          {ex.difficulty}
        </span>
        {done && (
          <span
            title={aced ? 'Full marks' : `Done — best ${p.best_score}/${p.total}`}
            className={cn(
              'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white',
              aced ? 'bg-quiz-green' : 'bg-quiz-orange',
            )}
          >
            <Icon name={aced ? 'check' : 'refresh'} className="h-3 w-3" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <span className="line-clamp-2 font-head text-sm font-extrabold leading-tight text-quiz-text">
          {ex.title}
        </span>
        <span
          className={cn(
            'mt-auto pt-2 text-[11px] font-bold',
            aced ? 'text-quiz-green' : 'text-quiz-muted',
          )}
        >
          {done
            ? `Best ${p.best_score}/${p.total} · ${p.attempts}${p.attempts === 1 ? ' try' : ' tries'}`
            : `${ex.total_marks} marks`}
        </span>
        {done && (
          <ProgressBar
            className="mt-1"
            value={p.best_percentage}
            tone={p.best_percentage >= 80 ? 'ok' : p.best_percentage >= 50 ? 'warn' : 'bad'}
            height="xs"
          />
        )}
      </div>
    </motion.button>
  )
}

