import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ease } from '../motion'
import Avatar from './ui/Avatar'
import Icon from './ui/Icon'
import RankOverview from './RankOverview'

// Layout — QuizQuest-style mobile-app shell.
// Top: sticky app bar (full-width, inner content centered to phone width).
// Main: scrolling content area, centered to a phone-width column on every screen size.
// Bottom: fixed nav with the 5 tabs — always visible (mobile + desktop), QuizQuest-style.

// Line-art nav SVGs (24×24, stroke-based). Inherit currentColor from the
// nav button — gold when active, muted when inactive. Cheap to ship inline
// vs. PNG tiles which would mean five HTTP requests at 1-2 MB each.
function NavIcon({ id, className = 'w-6 h-6' }) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (id) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...stroke} d="M3 12 L12 4 L21 12" />
          <path {...stroke} d="M5 11 L5 20 L19 20 L19 11" />
          <path {...stroke} d="M10 20 L10 14 L14 14 L14 20" />
        </svg>
      )
    case 'practice':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...stroke} d="M4 5 L11 5 L12 7 L12 19 L11 17 L4 17 Z" />
          <path {...stroke} d="M20 5 L13 5 L12 7 L12 19 L13 17 L20 17 Z" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect {...stroke} x="3" y="3" width="7" height="9" rx="1" />
          <rect {...stroke} x="14" y="3" width="7" height="5" rx="1" />
          <rect {...stroke} x="14" y="12" width="7" height="9" rx="1" />
          <rect {...stroke} x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    case 'leaderboard':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect {...stroke} x="4"  y="13" width="4" height="8" rx="0.5" />
          <rect {...stroke} x="10" y="8"  width="4" height="13" rx="0.5" />
          <rect {...stroke} x="16" y="4"  width="4" height="17" rx="0.5" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle {...stroke} cx="12" cy="8" r="4" />
          <path {...stroke} d="M4 21 C 4 16, 8 14, 12 14 C 16 14, 20 16, 20 21" />
        </svg>
      )
    default:
      return null
  }
}

export default function Layout({
  children, currentPage, onNavigate,
  userName, userAvatar, rank, level, xp, gems, freezes, freezeCap, onLogout,
  user, onUserUpdate,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [rankOpen, setRankOpen] = useState(false)
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
    { id: 'home',        label: 'Home'        },
    { id: 'practice',    label: 'Practice'    },
    { id: 'dashboard',   label: 'Dashboard'   },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'settings',    label: 'Profile'     },
  ]

  // Phone-frame width used everywhere. QuizQuest source uses 420px; we go a touch wider.
  // (The quiz-taking screen in QuizMaker breaks out of this frame on lg+
  // desktop via negative margins — every other page keeps the phone view.)
  const frame = 'max-w-md mx-auto w-full'

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top app bar ===== */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--quiz-bg-2) 85%, transparent)',
          borderBottomColor: 'var(--quiz-border)',
        }}
      >
        <div className={`${frame} flex items-center justify-between gap-3 px-4 py-2`}>
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 font-black text-lg tracking-tight"
          >
            <img src="/brand/ooka/mascot/ooka_mascot_4.webp" alt="" className="w-10 h-10 object-contain" />
            <span className="font-head font-extrabold text-lg tracking-tight" style={{ color: 'var(--quiz-text)' }}>Ooka</span>
          </button>

          <div className="flex items-center gap-2">
            {gems != null && (
              <button
                onClick={() => onNavigate('shop')}
                title={`${gems} Crystals — open shop`}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-black
                           bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan
                           transition-transform hover:scale-105 active:scale-95"
              >
                <Icon name="gem" className="w-3.5 h-3.5" />
                <span>{gems}</span>
              </button>
            )}
            {rank && (
              <button
                onClick={() => setRankOpen(true)}
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
                className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Avatar
                  src={userAvatar}
                  initials={initials}
                  size="sm"
                  equipped={user?.equipped}
                />
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
                          <span className="text-sm font-bold flex items-center gap-1.5">
                            <Icon name="star" className="w-4 h-4 text-quiz-yellow" /> Level
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-black
                                           bg-quiz-purple/20 border border-quiz-purple/40 text-quiz-purple">
                            Lv {level}
                          </span>
                        </div>
                      )}
                      {freezes != null && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                          <span className="text-sm font-bold flex items-center gap-1.5">
                            <Icon name="snowflake" className="w-4 h-4 text-quiz-cyan" /> Streak Freezes
                          </span>
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
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
                  ><Icon name="user" className="w-4 h-4" /> Profile</button>
                  <button
                    onClick={() => { onNavigate('preferences'); setProfileMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
                  ><Icon name="gear" className="w-4 h-4" /> Settings</button>
                  <div className="h-px bg-quiz-border my-1" />
                  <button
                    onClick={(e) => { e.preventDefault(); onLogout && onLogout() }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-quiz-red hover:bg-quiz-red/10 transition-colors flex items-center gap-2"
                  ><Icon name="logout" className="w-4 h-4" /> Logout</button>
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
      <nav
        className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl border-t"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--quiz-bg-2) 90%, transparent)',
          borderTopColor: 'var(--quiz-border)',
        }}
      >
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
                  active ? 'text-[#E8530A] scale-105' : 'text-quiz-muted hover:text-[#2B2521]',
                ].join(' ')}
              >
                {/* Sliding indicator — shared-element via layoutId. The
                    motion.span "moves" between buttons when active changes,
                    instead of the active tab popping the gradient in/out.
                    Same gradient, same active position — just transitioned. */}
                {active && (
                  <motion.span
                    layoutId="navIndicator"
                    className="absolute inset-0 rounded-xl bg-[#FFF1E6]"
                    transition={ease.spring}
                  />
                )}
                <NavIcon id={item.id} className="relative w-6 h-6" />
                <span className="relative text-[10px] font-bold leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <RankOverview
        open={rankOpen}
        onClose={() => setRankOpen(false)}
        currentKey={rank?.key || rank?.rank_band}
        xp={xp}
      />
    </div>
  )
}
