import { motion, AnimatePresence } from 'framer-motion'
import { ease } from '../motion'
import Icon from './ui/Icon'

// Mirrors the backend STARQUEST_RANKS ladder (quiz_backend.py). XP-derived:
// quizzes earn XP, and crossing each threshold promotes you to the next rank.
const RANKS = [
  { key: 'cadet',        name: 'Cadet',        xpMin: 0,    icon: 'sparkle', blurb: 'Every legend starts here.' },
  { key: 'pilot',        name: 'Pilot',        xpMin: 200,  icon: 'rocket',  blurb: 'Off the ground and flying.' },
  { key: 'navigator',    name: 'Navigator',    xpMin: 500,  icon: 'compass', blurb: 'Finding your way through tough topics.' },
  { key: 'commander',    name: 'Commander',    xpMin: 1200, icon: 'award',   blurb: 'Leading the charge.' },
  { key: 'captain',      name: 'Captain',      xpMin: 2500, icon: 'star',    blurb: 'Master of the syllabus.' },
  { key: 'star_admiral', name: 'Star Admiral', xpMin: 5000, icon: 'star',    blurb: 'The summit. Elite of the fleet.' },
]

/**
 * RankOverview — popup explaining the Star Rank ladder, opened from the rank
 * pill in the top bar. Highlights the player's current tier and progress to next.
 */
export default function RankOverview({ open, onClose, currentKey, xp = 0 }) {
  let idx = RANKS.findIndex((r) => r.key === currentKey)
  if (idx < 0) idx = RANKS.reduce((a, r, i) => (xp >= r.xpMin ? i : a), 0)
  const cur = RANKS[idx]
  const next = RANKS[idx + 1] || null
  const toNext = next ? Math.max(0, next.xpMin - xp) : 0
  const pct = next
    ? Math.min(100, Math.max(0, Math.round(((xp - cur.xpMin) / (next.xpMin - cur.xpMin)) * 100)))
    : 100

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,12,28,0.62)', backdropFilter: 'blur(2px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm qq-card-solid !p-5 relative max-h-[88vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={ease.spring}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full border border-quiz-border
                         flex items-center justify-center text-quiz-muted hover:text-quiz-text
                         hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>

            <div className="text-center mb-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Star Ranks</div>
              <h2 className="!text-xl !font-black tracking-tight">Rank System</h2>
              <p className="text-[11px] font-bold text-quiz-muted mt-1 leading-relaxed">
                Earn XP from quizzes — <strong>+2</strong> per correct answer, <strong>+5</strong> per
                quiz. Cross each XP goal to rank up.
              </p>
            </div>

            {/* Current status */}
            <div className="rounded-2xl border-2 border-quiz-blue/40 bg-quiz-blue/10 p-3 mb-4 text-center">
              <div className="flex justify-center"><Icon name={cur.icon} className="w-9 h-9 text-quiz-blue" /></div>
              <div className="font-black text-base mt-1">{cur.name}</div>
              <div className="text-[11px] font-bold text-quiz-muted mt-0.5">
                {xp.toLocaleString()} XP{next ? ` · ${toNext.toLocaleString()} XP to ${next.name}` : ' · max rank reached!'}
              </div>
              {next && (
                <div className="mt-2 h-2 rounded-full bg-quiz-border overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...ease.spring, delay: 0.1 }}
                  />
                </div>
              )}
            </div>

            {/* Ladder */}
            <div className="space-y-1.5">
              {RANKS.map((r, i) => {
                const reached = xp >= r.xpMin
                const isCur = i === idx
                return (
                  <div
                    key={r.key}
                    className={
                      'flex items-center gap-3 rounded-xl px-3 py-2 border ' +
                      (isCur
                        ? 'border-quiz-blue bg-quiz-blue/10 shadow-sm'
                        : reached
                          ? 'border-quiz-green/30 bg-quiz-green/5'
                          : 'border-quiz-border opacity-70')
                    }
                  >
                    <span className="w-7 flex justify-center shrink-0"><Icon name={r.icon} className={'w-6 h-6 ' + (isCur ? 'text-quiz-blue' : reached ? 'text-quiz-green' : 'text-quiz-muted')} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm leading-tight">{r.name}</div>
                      <div className="text-[10px] font-bold text-quiz-muted leading-tight">
                        {r.xpMin.toLocaleString()} XP · {r.blurb}
                      </div>
                    </div>
                    {isCur ? (
                      <span className="text-[9px] font-black uppercase tracking-wider text-quiz-blue shrink-0">You</span>
                    ) : reached ? (
                      <Icon name="check" className="w-4 h-4 text-quiz-green shrink-0" />
                    ) : (
                      <Icon name="lock" className="w-4 h-4 text-quiz-muted shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
