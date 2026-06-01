import { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import Modal from './ui/Modal'
import SectionLabel from './ui/SectionLabel'
import { Stagger, StaggerItem } from './ui/Motion'
import EditProfileModal from './EditProfileModal'

/**
 * SettingsPage — app-wide preferences (theme + account actions).
 * Reached from the avatar dropdown's ⚙️ Settings item, which now
 * navigates to this page instead of opening a modal.
 *
 * Sections:
 *   1. Appearance — light/dark theme picker (confirms before applying)
 *   2. Account    — Edit profile + Logout
 *   3. About      — version + brand footer (placeholder for future)
 *
 * Theme state is local; the body.theme-dark class flips on confirm
 * and the choice is persisted to localStorage (read on next mount by
 * the pre-paint bootstrap in index.html).
 */
export default function SettingsPage({ user, onUserUpdate, onLogout, onNavigate, isTeacher = false, viewAsStudent = false, onBackToTeacher }) {
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
      ? 'dark'
      : 'light',
  )
  // Theme the user clicked but hasn't confirmed yet — drives the warning Modal.
  const [pendingTheme, setPendingTheme] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  // Re-sync theme state from localStorage when the page mounts in case
  // it was changed elsewhere (eg the pre-paint script).
  useEffect(() => {
    setTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light')
  }, [])

  const applyTheme = (next) => {
    if (typeof document !== 'undefined') {
      if (next === 'dark') document.body.classList.add('theme-dark')
      else document.body.classList.remove('theme-dark')
    }
    try { localStorage.setItem('theme', next) } catch (_) {}
    setTheme(next)
    setPendingTheme(null)
  }

  return (
    <Screen width="default" className="!py-4">
      <Stagger delay={0.04} step={0.07}>

        {/* ===== HEADER ===== */}
        <StaggerItem>
          <div className="mb-4">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-xs font-bold text-quiz-muted hover:text-quiz-orange mb-2 inline-flex items-center gap-1"
              >
                ← Back to profile
              </button>
            )}
            <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">
              Preferences
            </div>
            <h1 className="!text-3xl !font-black tracking-tight">⚙️ Settings</h1>
            <p className="text-quiz-muted font-semibold text-sm mt-1">
              App-wide preferences and account actions.
            </p>
          </div>
        </StaggerItem>

        {/* ===== TEACHER — back to dashboard (only when previewing as student) ===== */}
        {isTeacher && viewAsStudent && onBackToTeacher && (
          <StaggerItem>
            <SectionLabel className="mb-2 px-1">Teacher</SectionLabel>
            <Card variant="solid" className="!p-4 mb-4">
              <div className="text-xs font-bold text-quiz-muted leading-relaxed mb-3">
                You're previewing HabitGo as a student. Switch back to the
                teacher dashboard whenever you're done looking around.
              </div>
              <Button3d
                variant="blue"
                size="md"
                full
                onClick={onBackToTeacher}
              >
                ← Back to teacher dashboard
              </Button3d>
            </Card>
          </StaggerItem>
        )}

        {/* ===== APPEARANCE — theme picker ===== */}
        <StaggerItem>
          <SectionLabel className="mb-2 px-1">Appearance</SectionLabel>
          <Card variant="solid" className="!p-4 mb-4">
            <div className="text-xs font-bold text-quiz-muted leading-relaxed mb-3">
              Choose your theme. Dark mode brings back the cosmic violet
              backdrop — easier on the eyes for late-night studying.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'light', emoji: '☀️', label: 'Light', sub: 'Cream & orange' },
                { id: 'dark',  emoji: '🌙', label: 'Dark',  sub: 'Cosmic & violet' },
              ].map((opt) => {
                const active = theme === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
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
          </Card>
        </StaggerItem>

        {/* ===== ACCOUNT — edit profile + logout ===== */}
        <StaggerItem>
          <SectionLabel className="mb-2 px-1">Account</SectionLabel>
          <Card variant="solid" className="!p-4 mb-4 space-y-2">
            <div className="text-xs font-bold text-quiz-muted leading-relaxed mb-1">
              Change your display name and profile photo, or sign out
              of this device.
            </div>
            <Button3d variant="orange" size="md" full onClick={() => setEditOpen(true)}>
              ✏️ Edit profile
            </Button3d>
            {onLogout && (
              <Button3d variant="red" size="md" full onClick={() => setLogoutOpen(true)}>
                🚪 Logout
              </Button3d>
            )}
          </Card>
        </StaggerItem>

        {/* ===== ABOUT — placeholder for future ===== */}
        <StaggerItem>
          <Card variant="solid" className="!p-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
              HabitGo
            </div>
            <div className="text-xs font-bold text-quiz-muted mt-1">
              by CuriousLab · daily physics practice
            </div>
          </Card>
        </StaggerItem>

      </Stagger>

      {/* Theme switch confirmation — fires when user picks a theme. */}
      <Modal
        open={pendingTheme !== null}
        onClose={() => setPendingTheme(null)}
        onConfirm={() => pendingTheme && applyTheme(pendingTheme)}
        title={
          pendingTheme === 'dark'
            ? '🌙 Switch to dark theme?'
            : '☀️ Switch to light theme?'
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

      {/* Edit profile modal — moved here from the avatar dropdown so
          profile editing lives under Settings → Account. */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onUserUpdate={onUserUpdate}
      />

      {/* Logout confirmation — extra friction since accidental logouts
          force a re-login. */}
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => { setLogoutOpen(false); onLogout && onLogout() }}
        title="🚪 Log out?"
        body="You'll need to sign in again to access your account. Your progress and stats are saved."
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
        tone="red"
      />
    </Screen>
  )
}
