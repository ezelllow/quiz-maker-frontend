/**
 * HabitGo motion vocabulary.
 *
 * Single source of truth for ease curves, durations, and Framer Motion
 * variants. Every component imports from here — no bespoke cubic-bezier
 * literals or one-off transitions live in screens.
 *
 * Aesthetic: Duolingo-flavoured. Springs visibly overshoot, success pops,
 * important CTAs idle-breathe. Nothing is linear, nothing settles
 * immediately, everything feels physical.
 *
 * Accessibility: <MotionConfig reducedMotion="user"> in src/main.jsx
 * applies the OS reduce-motion setting to every variant automatically.
 * For staggers (where the cumulative delay is what feels long), guard
 * the delay/step values explicitly with useReducedMotion() at the call
 * site.
 */

// ── Easing curves ───────────────────────────────────────────────────
export const ease = {
  /** Signature ease-out used across the app. */
  out:   [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  /** Drop-in spring for taps / pops — visible overshoot. */
  spring: { type: 'spring', stiffness: 380, damping: 22, mass: 0.7 },
  /** Bouncier spring for celebratory reveals. */
  bouncy: { type: 'spring', stiffness: 280, damping: 12 },
  /** Snappy squish for buttons — fast and tight. */
  squish: { type: 'spring', stiffness: 700, damping: 20, mass: 0.6 },
}

// ── Durations (seconds) ─────────────────────────────────────────────
export const dur = {
  xs: 0.12,
  sm: 0.18,
  md: 0.28,
  lg: 0.42,
  xl: 0.65,
}

// ── Page transitions ────────────────────────────────────────────────
// Use with <AnimatePresence mode="wait"> in App.jsx, keyed by currentPage.
export const page = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: { duration: dur.md, ease: ease.out } },
  exit:    { opacity: 0, y: -6, transition: { duration: dur.sm, ease: ease.out } },
}

// ── Stagger container + child ───────────────────────────────────────
// The Stagger / StaggerItem React components in ui/Motion.jsx wrap these.
export const stagger = (delay = 0.04, step = 0.06) => ({
  hidden: {},
  show:   { transition: { delayChildren: delay, staggerChildren: step } },
})
export const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: dur.md, ease: ease.out } },
}

// ── Single fade-in-up (no container required) ───────────────────────
export const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.md, ease: ease.out, delay } },
})

// ── Question reveal (QuizMaker) ─────────────────────────────────────
// Sliding-card feel between questions; keyed by currentQuestionIndex.
export const questionEnter = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0,  transition: { duration: dur.md, ease: ease.out } },
  exit:    { opacity: 0, x: -24, transition: { duration: dur.sm, ease: ease.out } },
}

// ── Tap props (spread onto motion.button) ───────────────────────────
// Duolingo-style squish: meaningfully smaller scale + downward press.
export const optionTap = {
  whileTap:   { scale: 0.95, y: 2 },
  whileHover: { y: -1 },
  transition: ease.squish,
}

// ── Correct / wrong reactions ───────────────────────────────────────
// Duolingo's correctPop overshoots then settles — feels celebratory.
// Wrong shake is wider and a touch faster.
export const correctPop = {
  scale: [1, 1.1, 0.96, 1.04, 1],
  transition: { duration: 0.55, times: [0, 0.3, 0.55, 0.8, 1], ease: ease.out },
}
export const wrongShake = {
  x: [-10, 10, -8, 8, -4, 4, 0],
  transition: { duration: 0.5, ease: ease.inOut },
}

// ── Idle pulse — breathing animation for important CTAs ─────────────
// Spread onto a motion element to make it gently breathe in place.
// Use sparingly: streak fire, current-day CTA, "earn your first streak"
// hero buttons. Anything more and the screen feels jittery.
export const idlePulse = {
  animate: {
    scale: [1, 1.04, 1],
    transition: { duration: 1.8, ease: 'easeInOut', repeat: Infinity },
  },
}
// Subtler variant for things that should breathe but not draw the eye.
export const idlePulseSoft = {
  animate: {
    scale: [1, 1.02, 1],
    transition: { duration: 2.4, ease: 'easeInOut', repeat: Infinity },
  },
}

// ── Celebration burst (streak, rank-up) ─────────────────────────────
// Bigger overshoot than a regular pop — this is the hero moment.
export const burst = {
  initial: { scale: 0, rotate: -30, opacity: 0 },
  animate: {
    scale:   [0, 1.35, 0.9, 1.05, 1],
    rotate:  [-30, 12, -4, 2, 0],
    opacity: [0, 1, 1, 1, 1],
    transition: { duration: 0.75, ease: ease.out, times: [0, 0.4, 0.65, 0.85, 1] },
  },
}

// ── Modal / sheet ───────────────────────────────────────────────────
export const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: dur.sm } },
  exit:    { opacity: 0, transition: { duration: dur.sm } },
}
export const sheet = {
  initial: { opacity: 0, y: 24, scale: 0.94 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: ease.bouncy },
  exit:    { opacity: 0, y: 16, scale: 0.97, transition: { duration: dur.sm, ease: ease.out } },
}

// ── Toast (slide in from top-right) ─────────────────────────────────
export const toast = {
  initial: { opacity: 0, y: -16, x: 16 },
  animate: { opacity: 1, y: 0,   x: 0,  transition: ease.spring },
  exit:    { opacity: 0, y: -8,  x: 8,  transition: { duration: dur.sm, ease: ease.out } },
}

// ── Count-up tween (used by <CountUp />) ────────────────────────────
// Duolingo number ticks are quick and satisfying — keep at lg, not xl.
export const countUpTransition = { duration: dur.lg, ease: ease.out }
