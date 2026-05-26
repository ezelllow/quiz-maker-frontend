# HabitGo Frontend Level-Up Plan

**Repo:** `C:\School\quiz-maker-frontend`
**Stack already in place:** React 19, Vite 8, Tailwind 3.4 (Nunito + custom `quiz-*` palette), Framer Motion 12 (with `MotionConfig reducedMotion="user"`), recharts, Google OAuth.
**Date:** 2026-05-26

---

## TL;DR

You already have a Kurzgesagt-flavoured dark-glass theme, four solid primitives (`Button3d`, `Card`, `Screen`, `Motion`), and Framer Motion installed at the root. The next leap is **less about adding stuff and more about systematising what's there**, then layering a coherent motion language on top.

This plan lands in **four phases**, each shippable on its own:

1. **Foundation** — finish the design-token consolidation, freeze a motion vocabulary, add the missing primitives (`Badge`, `Pill`, `Chip`, `ProgressBar`, `StatTile`, `ChoiceGrid`, `EmptyState`, `Toast`, `Modal`, `SectionLabel`, `IconButton`, `Skeleton`).
2. **Motion system** — one `motion.js` file with all variants + transitions, then upgrade every screen to use it. Page transitions, question reveal, option select/check, button press, streak/rank-up, XP count-up.
3. **Gamification UI polish** — streak fire that breathes, XP bar that ticks, badge unlock that earns the screen, rank-up that's a moment, weak-topic indicator that doesn't shame the user.
4. **Cleanup** — delete legacy CSS, kill duplicate class soup, codify tokens in `tailwind.config.js`, prune `index.css`.

You can stop after Phase 1 + 2 and the app already feels twice as alive. Phases 3–4 turn it into a portfolio piece.

---

## 1. Audit findings (what's good, what's hurting)

### Strengths to preserve
- **Phone-width frame** (`max-w-md mx-auto`) used consistently across Layout/Screen → already mobile-first.
- **Nunito + dark cosmic background + starfield** is a strong, ownable aesthetic. Don't break it.
- **Token system in `src/index.css`** is comprehensive (radii, shadows, ease curves, spacing scale). It's the right shape; just needs deduping.
- **`Stagger`/`StaggerItem`/`FadeInUp`** already pay for themselves on HomePage. Pattern is good — needs more variants.
- **`MotionConfig reducedMotion="user"` in `main.jsx`** is the right accessibility default. Don't lose it.
- **Per-question check flow** (`checked[i]` + locked option styling in QuizMaker) is solid UX — animate it, don't rewrite it.

### Things to fix
| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | Two parallel token systems (`--green` and `--bg`/`--accent`) in `index.css` | `src/index.css:14–103` | Drift between screens; bigger CSS bundle |
| 2 | Inline Tailwind class soup repeated for the same chip/pill/section-label (8 files use the eyebrow chain, more use the chip chain) | `Layout.jsx`, `HomePage.jsx`, `QuizMaker.jsx`, `PracticePage.jsx`, `Dashboard.jsx` | Hard to retheme; visual drift; bloated JSX |
| 3 | No `AnimatePresence` anywhere → modals/overlays pop in/out without exit anim | `App.jsx` page switch, `StreakCelebration`, Layout profile menu | Feels cheap on dismiss |
| 4 | Page switches via `currentPage` state are instant — no route transition | `App.jsx:204–232` | Loses sense of place |
| 5 | StreakCelebration uses raw CSS `@keyframes` instead of Framer Motion variants | `StreakCelebration.jsx`, `index.css:289–315` | Can't reuse, can't compose, harder to tune |
| 6 | Option select/check uses CSS class swap only — no spring, no wrong-shake, no correct-pop | `QuizMaker.jsx:852–864` | Biggest moment in the app, least animated |
| 7 | Progress bars use `transition-all duration-500` but no shimmer/no count-up | `HomePage.jsx:119–127`, `QuizMaker.jsx:784–792` | Static feeling |
| 8 | XP / gem / streak pills don't count up, don't flash on increment | `Layout.jsx:55–80`, `HomePage.jsx:86–89` | Reward feedback is muted |
| 9 | Three pickers (Subject / Difficulty / Count) reinvent "choose one of N" with different code | `PracticePage.jsx`, `QuizMaker.jsx:552–650` | DRY opportunity |
| 10 | Bottom nav active state is `bg + scale-105` only — no shared-element underline/glow | `Layout.jsx:148–166` | Easy quick win |
| 11 | Per-page `.css` files (`Dashboard.css`, `Settings.css`, etc.) still exist next to Tailwind | `src/components/*.css` (11 of them) | Splits the source of truth |
| 12 | Loading states are bespoke ad-hoc divs, not a Skeleton primitive | `Dashboard.jsx:33`, `SubjectHub` in `PracticePage.jsx:183–187` | Inconsistent |
| 13 | `WeekCell`, accuracy bars, mini-stats are inline components rather than primitives | `HomePage.jsx:240–263`, `Dashboard.jsx` | Reuse blocked |
| 14 | `window.confirm` used as the "leave quiz?" modal and shop redeem confirm | `App.jsx:177–181`, `ShopPage.jsx:86` | Breaks the immersive style |
| 15 | No reduced-motion variants documented — relies entirely on the global config | All screens | A few specific animations (long stagger) probably want shorter durations explicitly |

---

## 2. Design tokens — single source of truth

Goal: tokens live in `tailwind.config.js` (so they're available as utilities) **and** in `src/index.css` `:root` (so raw CSS can use them). The two must stay aligned. We collapse the parallel "legacy" set.

### Colour scale (consolidated)
Keep the existing `quiz.*` palette in `tailwind.config.js` and treat it as the only palette. Then **add** these semantic aliases — they're the names the UI should use most of the time:

```js
// tailwind.config.js — under theme.extend.colors
colors: {
  quiz: { /* existing literal palette stays */ },
  bg:      { DEFAULT: '#0a0a1f', soft: '#14142b', card: '#1a1a35', glass: 'rgba(30,30,60,0.65)' },
  border:  { DEFAULT: 'rgba(140,140,220,0.25)', bright: 'rgba(180,180,255,0.45)' },
  ink:     { DEFAULT: '#e9e9ff', muted: '#9d9dbf', soft: '#7c7ca0' },
  accent:  { DEFAULT: '#38bdf8', hover: '#7dd3fc', active: '#0ea5e9' },
  ok:      { DEFAULT: '#4ade80', soft: 'rgba(74,222,128,0.18)' },
  warn:    { DEFAULT: '#fbbf24', soft: 'rgba(251,191,36,0.18)' },
  bad:     { DEFAULT: '#fb7185', soft: 'rgba(251,113,133,0.18)' },
}
```

This lets us write `bg-card`, `text-ink-muted`, `border-border-bright` instead of the long literal classes. Existing `quiz-*` classes keep working for back-compat during the migration.

### Radii / shadows / spacing
Already covered well in `index.css:79–94`. Mirror into Tailwind:

```js
borderRadius: { xs:'6px', sm:'10px', md:'14px', lg:'20px', xl:'28px', pill:'999px' },
boxShadow: {
  xs:  '0 1px 2px rgba(0,0,0,0.30)',
  sm:  '0 4px 14px rgba(0,0,0,0.30)',
  md:  '0 12px 32px rgba(0,0,0,0.36)',
  lg:  '0 24px 60px rgba(0,0,0,0.50)',
  glow:'0 0 24px rgba(56,189,248,0.45), 0 0 60px rgba(56,189,248,0.15)',
},
```

### Typography
Nunito is in. Add a typography scale:
```js
fontSize: {
  'eyebrow': ['10px',  { lineHeight: '1', letterSpacing: '0.12em', fontWeight: '900' }],
  'micro':   ['11px',  { lineHeight: '1.3' }],
  'mini':    ['12px',  { lineHeight: '1.4' }],
  // …existing sm/base/lg/xl etc. stay
}
```
The `eyebrow` token replaces every `text-[10px] font-black uppercase tracking-widest text-quiz-muted` chain in the codebase (used in 8 files).

---

## 3. Motion system — one variants file, used everywhere

Create `src/motion/index.js` (or expand `src/components/ui/Motion.jsx`) with **all** the variants, transitions, and easings. Every component imports from here. No bespoke tweens in screens.

```js
// src/motion/index.js
export const ease = {
  out:    [0.22, 1, 0.36, 1],          // signature easing — already used
  inOut:  [0.65, 0, 0.35, 1],
  spring: { type: 'spring', stiffness: 380, damping: 28, mass: 0.7 },
  bouncy: { type: 'spring', stiffness: 280, damping: 14 },
}

export const dur = { xs: 0.12, sm: 0.18, md: 0.28, lg: 0.42, xl: 0.65 }

// ── Page transitions ────────────────────────────────────────────────
export const page = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.md, ease: ease.out } },
  exit:    { opacity: 0, y: -8, transition: { duration: dur.sm, ease: ease.out } },
}

// ── Stagger primitives (already exist, just formalise) ──────────────
export const stagger = (delay = 0.04, step = 0.06) => ({
  hidden: {},
  show:   { transition: { delayChildren: delay, staggerChildren: step } },
})
export const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: dur.md, ease: ease.out } },
}

// ── Question reveal ─────────────────────────────────────────────────
export const questionEnter = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: dur.md, ease: ease.out } },
  exit:    { opacity: 0, x: -24, transition: { duration: dur.sm, ease: ease.out } },
}

// ── Option button ───────────────────────────────────────────────────
export const optionTap = { whileTap: { scale: 0.97 }, whileHover: { y: -1 } }
export const correctPop = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.06, 1],
    transition: { duration: dur.lg, times: [0, 0.4, 1], ease: ease.out },
  },
}
export const wrongShake = {
  initial: { x: 0 },
  animate: {
    x: [-8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45, ease: ease.inOut },
  },
}

// ── Reward count-up helper (used by CountUp component) ──────────────
export const countUpTransition = { duration: 0.9, ease: ease.out }

// ── Streak / rank-up celebration ────────────────────────────────────
export const burst = {
  initial: { scale: 0, rotate: -30, opacity: 0 },
  animate: {
    scale: [0, 1.25, 0.92, 1],
    rotate: [-30, 8, -3, 0],
    opacity: [0, 1, 1, 1],
    transition: { duration: dur.xl, ease: ease.out, times: [0, 0.5, 0.7, 1] },
  },
}

// ── Modal / sheet ───────────────────────────────────────────────────
export const backdrop = {
  initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
}
export const sheet = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: ease.spring },
  exit:    { opacity: 0, y: 16, scale: 0.97, transition: { duration: dur.sm } },
}
```

### Where each variant lands
| Variant | Component / screen | What it replaces |
|---|---|---|
| `page` (in `<AnimatePresence mode="wait">`) | `App.jsx` page switch | Instant `currentPage` swap |
| `stagger` + `item` | Already on HomePage; extend to Dashboard, Settings, Leaderboard, PracticePage hub | Bespoke per-section animations |
| `questionEnter` | QuizMaker quiz-taking screen, on `currentQuestionIndex` change | Cuts/no-anim today |
| `optionTap` + `correctPop` + `wrongShake` | QuizMaker option buttons | CSS-only class swap |
| `correctPop` | Progress bar fill on per-question check | n/a |
| `burst` | `StreakCelebration`, new `RankUpCelebration` overlay | CSS keyframes |
| `backdrop` + `sheet` | New `Modal` primitive replacing `window.confirm` calls | n/a |

### Reduced motion
`MotionConfig reducedMotion="user"` is already in `main.jsx` — keep it. For longer staggers (HomePage opening), add an explicit guard so the screen finishes drawing fast:

```jsx
import { useReducedMotion } from 'framer-motion'
const reduce = useReducedMotion()
<Stagger step={reduce ? 0 : 0.06} delay={reduce ? 0 : 0.04}>
```

---

## 4. Component restructure — shadcn-style primitives

Goal: every recurring visual pattern becomes a tiny composable component in `src/components/ui/`. Keep them logic-thin — no fetching, no business state.

### New primitives to add
| File | What | Why |
|---|---|---|
| `ui/Badge.jsx` | Rounded chip with tone variants (`accent`, `ok`, `warn`, `bad`, `purple`, `cyan`). Replaces the inline rounded-full pills everywhere. | 8+ duplicated class chains |
| `ui/Pill.jsx` | Stat pill (`💎 12` style) — icon + value, optional tap-to-action | Used in nav, home, results |
| `ui/IconButton.jsx` | Square 36/44px button with icon — for back, close, refresh | Replaces inline `<button className="…">` |
| `ui/ProgressBar.jsx` | Gradient bar with optional shimmer + animated width via `motion.div` | Used 4+ places, each slightly different |
| `ui/StatTile.jsx` | 2×2 grid card (Streak / Rank / etc.) — eyebrow label + big value + sublabel | HomePage, Settings, Dashboard |
| `ui/ChoiceGrid.jsx` | Generic "pick one of N" grid with active/disabled/locked states | Replaces three picker patterns |
| `ui/SectionLabel.jsx` | The eyebrow-text section header | 8 files |
| `ui/EmptyState.jsx` | Big-emoji + heading + body + optional CTA | 5+ duplicated patterns |
| `ui/Skeleton.jsx` | Pulsing placeholder (single line, card-shaped) | Replaces "Loading…" text |
| `ui/Modal.jsx` | `<AnimatePresence>` backdrop + centred sheet; confirm/dismiss footer | Replaces `window.confirm` |
| `ui/Toast.jsx` | Auto-dismissing top-right toast, sliding in from the right | Used in Shop redeem, etc. |
| `ui/WeekStrip.jsx` | The 7-cell streak strip from HomePage | Reusable on Settings, Dashboard |
| `ui/CountUp.jsx` | Number that animates from prev → new on prop change (uses `useMotionValue` + `animate`) | XP, gems, streak |
| `ui/XPBar.jsx` | Level / XP-to-next bar with bouncy spring fill and `+XP` floater on increment | Big upgrade vs the current static line |
| `ui/Tabs.jsx` | The Leaderboard daily/weekly/alltime style tabs, with shared-element underline | Leaderboard, Dashboard sections |

### Existing primitives — light refactor
- **`Button3d`** — add `whileTap` motion props internally (currently CSS-only `:active`). Add `loading` prop (replaces inline `'⏳ …'` strings). Wrap children in `<AnimatePresence>` so the label can swap smoothly when loading toggles.
- **`Card`** — add `interactive` boolean (adds `whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}` and renders as `motion.div`).
- **`Screen`** — wrap children in `motion.div` keyed by route so `AnimatePresence` in App.jsx can drive page transitions.
- **`Motion.jsx`** — keep `Stagger`/`StaggerItem`/`FadeInUp`, switch internals to import variants from the new `motion/index.js`.

### Component API conventions (shadcn-inspired)
- One default export per file.
- Accept `className` for Tailwind overrides; merge with `cn()` helper (add `src/lib/cn.js` — tiny `clsx`-style join).
- Tone/variant via a single `tone` or `variant` prop with a string-keyed object → cls map.
- Forward `ref` where it matters (buttons, inputs).
- No `useState` unless the component owns interaction (e.g. Tabs); otherwise controlled by props.

---

## 5. Gamification UI — the moments that matter

The whole product is "form a habit by chasing dopamine ticks". Five moments deserve their own animation:

### 5.1 Per-question check
Today: option turns green/red instantly.
**New:**
- Correct: `correctPop` on the chosen option + a brief `pulseGlow` ring + a `+1 🎯` floater above the question count.
- Wrong: `wrongShake` on the chosen option, correct option pulses softly to draw the eye.
- Progress bar at the top tweens its width with a spring (currently `transition-all duration-300`).
- Daily progress bar (results screen) fires the same `correctPop` if today's count crossed a multiple of 5.

### 5.2 Streak fire (HomePage + nav pill)
Today: emoji + number.
**New:**
- Replace 🔥 emoji with `motion.span` whose scale loops 1 → 1.08 → 1 on a 1.4s repeat, but only while `currentStreak > 0`. Halve amplitude on long streaks (≥ 30) so it doesn't feel manic.
- Number uses `<CountUp />` so day-N → day-(N+1) ticks.

### 5.3 XP / Gems
Today: static text.
**New:**
- `<XPBar />` on Home Rank card animates the level fill on mount and on every `progression.xp` change. Float `+47 XP` above it briefly when delta detected.
- Nav `💎` pill flashes (cyan glow + bounce) when `gems` increments. Track previous value via `useRef`.

### 5.4 Streak celebration
Today: full-screen CSS-keyframe burst.
**New:** keep the design, port the choreography to Framer Motion:
- Backdrop fade in / out via `AnimatePresence`.
- Icon: `burst` variant.
- Number: counts from 0 → final streak across 600ms (instead of bursting into the final number).
- Sparkles: now 16 `motion.span` particles with randomised `transition.delay` + `transition.duration`, sprayed via `whileInView` so they trigger reliably.
- New "milestone" variant (every 7th day): adds a confetti layer (small absolutely-positioned `motion.div`s flying outward) and a `🌟 7-day streak!` banner.

### 5.5 Rank-up
Today: small banner card on the results screen.
**New:** dedicated `<RankUpOverlay />` overlay component — same shape as `StreakCelebration` but in purple/yellow, fires from results screen when `rankUp` is true, **before** the results card animates in. Reuses `burst` + sparkle particles, adds the rank icon scaling in from 0 and the rank name typewriter-revealing letter-by-letter via staggered chars.

### 5.6 Weak-topic indicator (Dashboard)
Today: red bar.
**New:** add a "needs work" Badge with a subtle pulse (`opacity: [1, 0.7, 1]`) and a `→ Practice this` link that pre-fills the practice form. Not punishing — directional.

---

## 6. Layout & micro-IA tweaks

A few small structural moves the audit surfaced:

- **Bottom nav active state**: replace the instant `scale-105 bg-gradient` with a Framer Motion `layoutId="navIndicator"` pill that slides between tabs (free with `layout` prop). Adds shared-element continuity.
- **Profile menu** (Layout.jsx): wrap in `AnimatePresence` with `sheet` variant. Dismiss when tapping a backdrop layer rather than only the doc.
- **Results screen sequencing**: stagger the result cards (score → rank-up → rewards → daily progress) so each lands ~150ms after the previous. Right now they all show at once.
- **Quiz "leave?" confirm**: replace `window.confirm` with the new `<Modal />` — same wording, different vibe.
- **PracticePage SubjectPicker**: lock state on "Math" gets a 🔒 icon and a subtle `whileTap={{ x: [0, -3, 3, 0] }}` shake when tapped — currently it's just disabled.

---

## 7. File-by-file change list (Phase 1 + 2)

Phases ordered so each commit boundary leaves the app fully working.

### Phase 1 — Foundation (touches tokens + adds primitives, no screen rewrites)
1. **`tailwind.config.js`** — add semantic colour aliases (`bg`, `ink`, `accent`, `ok`, `warn`, `bad`, `border`), radii, shadows, `fontSize.eyebrow`.
2. **`src/index.css`** — collapse legacy `--bg`/`--accent` tokens into the `--quiz-*` set (single source). Keep keyframes for back-compat; nothing else.
3. **`src/lib/cn.js`** *(new)* — `export const cn = (...xs) => xs.filter(Boolean).join(' ')`.
4. **`src/motion/index.js`** *(new)* — variants from §3.
5. **`src/components/ui/`** — add `Badge.jsx`, `Pill.jsx`, `IconButton.jsx`, `ProgressBar.jsx`, `StatTile.jsx`, `ChoiceGrid.jsx`, `SectionLabel.jsx`, `EmptyState.jsx`, `Skeleton.jsx`, `Modal.jsx`, `Toast.jsx`, `WeekStrip.jsx`, `CountUp.jsx`, `XPBar.jsx`, `Tabs.jsx`.
6. **`src/components/ui/Motion.jsx`** — re-export from `src/motion/index.js`; keep `Stagger`/`StaggerItem`/`FadeInUp` API stable.
7. **`src/components/ui/Button3d.jsx`** — add `loading` prop, internal `motion.button` with `whileTap`/`whileHover`.
8. **`src/components/ui/Card.jsx`** — add `interactive` prop with motion.

> After Phase 1: no visual regressions, no screen needs editing yet. Verify by `npm run build`.

### Phase 2 — Motion system rollout (screen-by-screen)
9. **`src/App.jsx`** — wrap `renderPage()` in `<AnimatePresence mode="wait">` keyed by `currentPage`; `Screen` becomes a `motion.div` driven by `page` variant.
10. **`src/components/Layout.jsx`** — replace nav active state with `layoutId="navIndicator"` motion pill; wrap profile menu in `AnimatePresence`; replace inline pills with `<Badge />` / `<Pill />`.
11. **`src/components/HomePage.jsx`** — replace `WeekCell` with `<WeekStrip />`; rank card uses `<XPBar />` + `<CountUp />`; streak chip uses pulsing 🔥; quick actions use `<Card interactive>`.
12. **`src/components/PracticePage.jsx`** — Subject/Hub use `<EmptyState />` + `<ChoiceGrid />`; back link is `<IconButton />`.
13. **`src/components/QuizMaker.jsx`** — quiz-taking screen wraps question in `<AnimatePresence mode="wait">` keyed by `currentQuestionIndex`; options become `<OptionButton />` (new) with `correctPop` / `wrongShake`; results screen staggered with `<Stagger>`; "leave quiz?" confirm becomes `<Modal />`.
14. **`src/components/StreakCelebration.jsx`** — ported to Framer Motion variants (`burst`, `backdrop`); add `CountUp` for the streak number; new milestone variant on multiples of 7.
15. **`src/components/Dashboard.jsx`** — accuracy bars use `<ProgressBar animated>`; mini stats use `<StatTile />`; weak-topic bar gets the new Badge + Practice link.
16. **`src/components/Settings.jsx`** — stats grid uses `<StatTile />`; daily-goal picker uses `<ChoiceGrid />`.
17. **`src/components/LeaderboardPage.jsx`** — tabs use `<Tabs />` (shared-element underline); podium tops animate with `burst`.
18. **`src/components/ShopPage.jsx`** — redeem confirm uses `<Modal />`; toasts use `<Toast />`.

### Phase 3 — Gamification polish
19. **`src/components/RankUpOverlay.jsx`** *(new)* — celebration overlay (§5.5).
20. **QuizMaker results** — fire `<RankUpOverlay />` before the results card stagger.
21. **Layout 💎 pill** — flash on increment (track prev via `useRef`).
22. **Streak milestone** — confetti layer on 7/14/30/100-day streaks.

### Phase 4 — Cleanup
23. Delete the 11 per-page `.css` files (`AuthPage.css`, `DailyChallenge.css`, `Dashboard.css`, `History.css`, `Layout.css`, `Placement.css`, `Progress.css`, `QuizHistory.css`, `QuizMaker.css`, `SavedQuizzes.css`, `Settings.css`) — port any remaining rules into Tailwind utilities or `@layer components` in `index.css`. (Do this *after* the screens are migrated, not as part of the move — easier to spot regressions.)
24. Sweep for `text-[10px] font-black uppercase tracking-widest text-quiz-muted` → replace all with `<SectionLabel />` or `text-eyebrow text-ink-muted`.
25. Sweep for the long `px-2 py-0.5 rounded-full text-[11px] font-black bg-quiz-*/15 border border-quiz-*/40 text-quiz-*` chip chains → `<Badge tone="…" />`.
26. Remove `newFrontend/index.html` if it's truly archival (it's a 75 KB single-file reference that's no longer wired up).

---

## 8. Concrete file sketches

### `src/components/ui/Badge.jsx`
```jsx
import { cn } from '../../lib/cn'
const tones = {
  accent:  'bg-quiz-blue/15   border-quiz-blue/40   text-quiz-blue',
  ok:      'bg-quiz-green/15  border-quiz-green/40  text-quiz-green',
  warn:    'bg-quiz-yellow/15 border-quiz-yellow/40 text-quiz-yellow',
  bad:     'bg-quiz-red/15    border-quiz-red/40    text-quiz-red',
  purple:  'bg-quiz-purple/15 border-quiz-purple/40 text-quiz-purple',
  cyan:    'bg-quiz-cyan/15   border-quiz-cyan/40   text-quiz-cyan',
  muted:   'bg-white/5        border-quiz-border    text-quiz-muted',
}
const sizes = { sm: 'px-2 py-0.5 text-[11px]', md: 'px-2.5 py-1 text-xs' }
export default function Badge({ tone='muted', size='sm', icon, className, children, ...rest }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border font-black', tones[tone], sizes[size], className)} {...rest}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}
```

### `src/components/ui/CountUp.jsx`
```jsx
import { useEffect } from 'react'
import { useMotionValue, useTransform, animate, motion } from 'framer-motion'
import { dur, ease } from '../../motion'
export default function CountUp({ value, duration = dur.lg, format = (v) => Math.round(v), className }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, format)
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: ease.out })
    return () => controls.stop()
  }, [value, mv, duration])
  return <motion.span className={className}>{text}</motion.span>
}
```

### `src/components/ui/Modal.jsx`
```jsx
import { AnimatePresence, motion } from 'framer-motion'
import { backdrop, sheet } from '../../motion'
import Button3d from './Button3d'
export default function Modal({ open, onClose, title, body, confirmLabel='Confirm', cancelLabel='Cancel', tone='blue', onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    variants={backdrop} initial="initial" animate="animate" exit="exit"
                    onClick={onClose}>
          <motion.div className="qq-card-solid w-full max-w-sm relative" variants={sheet}
                      initial="initial" animate="animate" exit="exit" onClick={(e) => e.stopPropagation()}>
            {title && <div className="text-lg font-black mb-2">{title}</div>}
            <div className="text-sm text-quiz-muted mb-5 whitespace-pre-line">{body}</div>
            <div className="flex gap-2">
              <Button3d variant="white" full onClick={onClose}>{cancelLabel}</Button3d>
              <Button3d variant={tone} full onClick={() => { onConfirm?.(); onClose?.() }}>{confirmLabel}</Button3d>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Question option in QuizMaker (rough)
```jsx
import { motion } from 'framer-motion'
import { optionTap, correctPop, wrongShake } from '../motion'
// ...inside the options map:
<motion.button
  {...optionTap}
  animate={
    isChecked && optKey === correctKey ? correctPop.animate :
    isChecked && selected               ? wrongShake.animate :
    undefined
  }
  className={optionCls(selected, optKey)}
  onClick={() => setAnswer(opt)}
>
  …
</motion.button>
```

---

## 9. Verification checklist

After each phase, run:
- [ ] `npm run lint` (eslint flat config already in repo)
- [ ] `npm run build` — bundle should not regress more than +5 KB gz (framer-motion is already counted; new primitives are mostly variant configs)
- [ ] Manual: take a quiz, hit a wrong answer, hit a right answer, finish, observe streak celebration, navigate away mid-quiz to confirm the new Modal fires
- [ ] Toggle OS "Reduce motion" → all big animations collapse to instant fades (already handled by `MotionConfig`, but verify on StreakCelebration + RankUpOverlay)
- [ ] Lighthouse on a built preview — colour contrast should be unchanged or better; no layout shift introduced by `layoutId` indicator

---

## 10. What I'm not doing (and why)

- **shadcn/ui library import.** The repo doesn't have Radix or class-variance-authority. Bringing them in would add real bundle weight for primitives that are 30-line files anyway. Pattern, not package.
- **Routing library.** `currentPage` state in `App.jsx` works fine and lazy-imports are already wired. Adding react-router for `AnimatePresence` is overkill — `<AnimatePresence>` keys off the `currentPage` string directly.
- **Theming engine.** No light mode toggle scoped here. The dark cosmic theme is the brand.
- **Rebuilding the QuizMaker form.** It works; it's a long file but not broken. We touch only the question-taking and results portions where motion adds the most value.
- **Replacing the starfield.** It's signature and free at 60fps. Leave it.

---

## Done-when

- Every screen renders through the shared primitives (`Card`, `Button3d`, `Badge`, `Pill`, `ProgressBar`, `StatTile`, `ChoiceGrid`, `Modal`, etc.).
- All animation lives in `src/motion/index.js`, imported by name. Zero `cubic-bezier(...)` literals in `.jsx` files outside that one.
- Wrong answers shake, right answers pop, streaks count up, rank-ups own the screen.
- The five `*.css` per-screen files that we agreed to delete are deleted.
- An OS-level "reduce motion" toggle disables every big celebration cleanly.

When you green-light this plan, I'll implement Phase 1 in a single pass, then we review the diff before moving to Phase 2.
