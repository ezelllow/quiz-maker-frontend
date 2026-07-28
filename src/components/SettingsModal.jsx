import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from './ui/Modal'
import Button3d from './ui/Button3d'
import Icon from './ui/Icon'
import { backdrop, sheet } from '../motion'

/**
 * SettingsModal — app-wide settings sheet (currently theme only,
 * structured so more settings can slot in over time).
 *
 *   open / onClose: controlled by parent (Layout avatar dropdown)
 *
 * Theme state is local — written to localStorage on confirm, and the
 * `body.theme-dark` class is toggled via effect. A nested confirmation
 * Modal asks the user to confirm before applying the switch since it
 * dramatically changes the whole app's look.
 */
export default function SettingsModal({ open, onClose }) {
  // Read current theme from localStorage on every open so we reflect
  // whatever the user picked last (in case theme was changed elsewhere).
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
      ? 'dark'
      : 'light',
  )
  // Theme the user clicked but hasn't confirmed yet (drives the nested
  // confirmation modal). null when no decision is pending.
  const [pendingTheme, setPendingTheme] = useState(null)

  useEffect(() => {
    if (!open) return
    setTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light')
  }, [open])

  const applyTheme = (next) => {
    if (typeof document !== 'undefined') {
      if (next === 'dark') document.body.classList.add('theme-dark')
      else document.body.classList.remove('theme-dark')
    }
    try { localStorage.setItem('theme', next) } catch (_) {}
    setTheme(next)
    setPendingTheme(null)
  }

  // The settings sheet renders custom content (theme picker tiles),
  // not the Modal primitive's confirm/cancel footer — so we hand-roll
  // the AnimatePresence wrapper instead of going through <Modal />.
  // This way we can keep the picker visible while the nested
  // confirmation Modal sits on top of it.
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            variants={backdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          >
            <motion.div
              className="qq-card-solid w-full max-w-sm relative !p-6"
              variants={sheet}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
            >
              <div id="settings-title" className="text-lg font-black mb-1 inline-flex items-center gap-2">
                <Icon name="gear" className="w-5 h-5" /> Settings
              </div>
              <div className="text-xs font-bold text-quiz-muted mb-4 leading-relaxed">
                App-wide preferences. Changes apply immediately after
                you confirm.
              </div>

              {/* Appearance section — light / dark theme picker */}
              <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">
                Appearance
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  { id: 'light', emoji: <Icon name="sun" className="w-6 h-6 mx-auto" />, label: 'Light', sub: 'Cream & orange' },
                  { id: 'dark',  emoji: <Icon name="moon" className="w-6 h-6 mx-auto" />, label: 'Dark',  sub: 'Cosmic & violet' },
                ].map((opt) => {
                  const active = theme === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        // No-op if already on this theme.
                        if (theme === opt.id) return
                        setPendingTheme(opt.id)
                      }}
                      className={
                        'p-3 rounded-2xl border-2 font-black transition-all text-center ' +
                        (active
                          ? 'border-quiz-orange bg-quiz-orange-soft text-quiz-orange-deep shadow-md scale-[1.02]'
                          : 'border-quiz-border bg-white text-quiz-text hover:border-quiz-orange')
                      }
                    >
                      <div className="text-2xl leading-none mb-1">{opt.emoji}</div>
                      <div className="text-sm leading-tight">{opt.label}</div>
                      <div className="text-[10px] font-bold text-quiz-muted mt-0.5 normal-case tracking-normal">
                        {opt.sub}
                      </div>
                    </button>
                  )
                })}
              </div>

              <Button3d variant="white" size="md" full onClick={onClose}>
                Close
              </Button3d>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested confirmation — fires when user picks a theme. Uses the
          standard Modal primitive so the warning gets the app's normal
          confirm/cancel UX. Sits at z-50 (above the settings sheet's
          z-40 backdrop) so it's the topmost layer. */}
      <Modal
        open={pendingTheme !== null}
        onClose={() => setPendingTheme(null)}
        onConfirm={() => pendingTheme && applyTheme(pendingTheme)}
        title={
          pendingTheme === 'dark'
            ? <span className="inline-flex items-center gap-2"><Icon name="moon" className="w-5 h-5" /> Switch to dark theme?</span>
            : <span className="inline-flex items-center gap-2"><Icon name="sun" className="w-5 h-5" /> Switch to light theme?</span>
        }
        body={
          pendingTheme === 'dark'
            ? 'The whole app will switch to the cosmic violet theme — backgrounds, cards, buttons, and accents. Your data and login stay the same.'
            : 'The whole app will switch to the cream + orange theme — backgrounds, cards, buttons, and accents. Your data and login stay the same.'
        }
        confirmLabel="Switch theme"
        cancelLabel="Cancel"
        tone="orange"
      />
    </>
  )
}
