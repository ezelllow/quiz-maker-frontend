import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ease } from '../motion'

// Layout — QuizQuest-style mobile-app shell.
// Top: sticky app bar (full-width, inner content centered to phone width).
// Main: scrolling content area, centered to a phone-width column on every screen size.
// Bottom: fixed nav with the 5 tabs — always visible (mobile + desktop), QuizQuest-style.
export default function Layout({
  children, currentPage, onNavigate,
  userName, userAvatar, rank, level, gems, freezes, freezeCap, onLogout,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const initials = (userName || 'Student').trim().charAt(0).toUpperCase()
  const menuRef = useRef(null)

  useEffect(() => {
    if (!profileMenuOpen) return
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [profileMenuOpen])

  // Slim nav (2026-05-19): Stats + History dropped (now surfaced on Home).
  // Routes for /dashboard + /history still exist in App.jsx — reachable via deep links
  // or Home page CTAs, just not in the bottom bar.
  // Daily dropped from nav (2026-05-19) — accessed via Home page CTA instead.
  const navItems = [
    { id: 'home',        icon: '🏠', label: 'Home'        },
    { id: 'practice',    icon: '✏️', label: 'Practice'    },
    { id: 'shop',        icon: '💎', label: 'Shop'        },
    { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
    { id: 'settings',    icon: '👤', label: 'Profile'     },
  ]

  // Phone-frame width used everywhere. QuizQuest source uses 420px; we go a touch wider.
  const frame = 'max-w-md mx-auto w-full'

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top app bar ===== */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[rgba(10,10,31,0.7)] border-b border-quiz-border">
        <div className={`${frame} flex items-center justify-between gap-3 px-4 py-2`}>
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 font-black text-lg tracking-tight"
          >
            <span className="text-2xl">🎯</span>
            <span className="bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
              HabitGo
            </span>
          </button>

          <div className="flex items-center gap-2">
            {gems != null && (
              <span
                title={`${gems} Crystals`}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-black
                           bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan"
              >
                <span>💎</span>
                <span>{gems}</span>
              </span>
            )}
            {rank && (
              <button
                onClick={() => onNavigate('home')}
                title={rank.tier_name || rank.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-gradient-to-r from-quiz-blue/20 to-quiz-purple/20
                           border border-quiz-blue/40
                           hover:from-quiz-blue/30 hover:to-quiz-purple/30 transition-colors"
              >
                <span className="text-sm">{rank.tier_icon || rank.icon}</span>
                <span className="font-bold text-xs text-quiz-blue">
                  {rank.tier_name || rank.name}
                </span>
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
                className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-white/5 transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-quiz-blue to-quiz-purple
                                 flex items-center justify-center overflow-hidden
                                 ring-2 ring-quiz-border-bright font-bold text-white text-sm">
                  {userAvatar
                    ? <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                    : initials}
                </span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 qq-card-solid !p-1.5 z-40 shadow-2xl">
                  {(level != null || freezes != null) && (
                    <>
                      <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-widest text-quiz-muted">
                        Your stats
                      </div>
                      {level != null && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                          <span className="text-sm font-bold flex items-center gap-1.5">⭐ Level</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black
                                           bg-quiz-purple/20 border border-quiz-purple/40 text-quiz-purple">
                            Lv {level}
                          </span>
                        </div>
                      )}
                      {freezes != null && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                          <span className="text-sm font-bold flex items-center gap-1.5">🧊 Streak Freezes</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black
                                           bg-quiz-blue/15 border border-quiz-blue/40 text-quiz-blue">
                            {freezes}/{freezeCap ?? 2}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-quiz-border my-1" />
                    </>
                  )}
                  <button
                    onClick={() => { onNavigate('settings'); setProfileMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
                  >👤 Profile</button>
                  <div className="h-px bg-quiz-border my-1" />
                  <button
                    onClick={(e) => { e.preventDefault(); onLogout && onLogout() }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-quiz-red hover:bg-quiz-red/10 transition-colors"
                  >🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== Main content (centered phone-width column on every screen size) ===== */}
      <main className={`${frame} flex-1 min-w-0 pb-24`}>
        {children}
      </main>

      {/* ===== Bottom nav (always visible, mobile-app style) ===== */}
      <nav className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl bg-[rgba(10,10,31,0.85)] border-t border-quiz-border">
        <div className={`${frame} grid grid-cols-5 gap-1 px-2 py-2`}>
          {navItems.map((item) => {
            const active = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={[
                  'relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors',
                  active ? 'text-white scale-105' : 'text-quiz-muted hover:text-white',
                ].join(' ')}
              >
                {/* Sliding indicator — shared-element via layoutId. The
                    motion.span "moves" between buttons when active changes,
                    instead of the active tab popping the gradient in/out.
                    Same gradient, same active position — just transitioned. */}
                {active && (
                  <motion.span
                    layoutId="navIndicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-quiz-blue/25 to-quiz-purple/25"
                    transition={ease.spring}
                  />
                )}
                <span className="relative text-lg leading-none">{item.icon}</span>
                <span className="relative text-[10px] font-bold leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
