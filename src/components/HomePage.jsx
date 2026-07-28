import ProgressBar from './ui/ProgressBar'
import WeekStrip from './ui/WeekStrip'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Avatar from './ui/Avatar'
import Button3d from './ui/Button3d'
import Icon from './ui/Icon'
import Skeleton from './ui/Skeleton'
import { Stagger, StaggerItem } from './ui/Motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Time-of-day greeting — small personal touch so the header doesn't read like
// a generic "Welcome back" template on every visit.
function greetingFor(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// HomePage — friendly landing screen, rebuilt for a clearer visual hierarchy.
//
// Design intent (2026-07 redesign):
//   • ONE focal action — the Daily Challenge hero — carries the most depth.
//   • Each fact appears once: the streak lives in the week banner (it used to
//     be duplicated across a welcome pill AND a stat card), rank/XP gets its
//     own calm card, so the page stops reading as four equal-weight boxes.
//   • Baloo headings replace the repeated tiny UPPERCASE eyebrows.
//   • Warm but restrained — soft depth on the hero, hairline-flat elsewhere.
// Sections animate in with a staggered fade-up (framer-motion).
export default function HomePage({ authToken, user, rank, progression, onNavigate, onFreezesChange }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [streak, setStreak] = useState(null)
  const [dailyDone, setDailyDone] = useState(null)   // null until loaded
  const [dailyProgress, setDailyProgress] = useState(null)  // {today_correct, target, ...}
  const [weekData, setWeekData] = useState(null)     // {days: [{date, weekday, status, is_today}, ...]}

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/api/daily-challenge?subject=Physics`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/api/streak/week`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([streakData, dc, week]) => {
        if (cancelled) return
        setStreak(streakData)
        // Keep the navbar freeze pill in sync with the streak card — /api/streak
        // is the authoritative freeze source (correct even for brand-new users).
        if (onFreezesChange && typeof streakData?.freezes_available === 'number') {
          onFreezesChange(streakData.freezes_available)
        }
        setDailyDone(dc?.already_passed_today === true)
        setDailyProgress(dc?.daily_progress || null)
        setWeekData(week)
      })
      .catch(() => { /* silent — degrade gracefully */ })
    return () => { cancelled = true }
  }, [token])

  const name = (user?.name || 'Student').trim()
  const firstName = name.split(' ')[0]
  const initials = name.charAt(0).toUpperCase()
  const avatarUrl = user?.avatar_url || ''
  const currentStreak = streak?.current_streak ?? 0
  const longestStreak = streak?.longest_streak ?? 0
  const freezes = streak?.freezes_available ?? 0
  const greeting = greetingFor()

  // Line icons (ui/Icon) instead of emojis; each card gets a tinted icon chip
  // so the four shortcuts read as one set, matching the bottom-nav style.
  const quickActions = [
    { id: 'quiz',      icon: 'pencil',   label: 'Practice',  sub: 'Pick topics & drill',  chip: 'text-quiz-green bg-quiz-green/15 border-quiz-green/40' },
    { id: 'dashboard', icon: 'chart',    label: 'Dashboard', sub: 'Your full stats',      chip: 'text-quiz-blue bg-quiz-blue/15 border-quiz-blue/40' },
    { id: 'saved',     icon: 'bookmark', label: 'Saved',     sub: 'Retake your quizzes',  chip: 'text-quiz-orange bg-quiz-orange/15 border-quiz-orange/40' },
    { id: 'history',   icon: 'history',  label: 'History',   sub: 'Review past attempts', chip: 'text-quiz-cyan bg-quiz-cyan/15 border-quiz-cyan/40' },
  ]

  // Next-tier XP (folded into the Rank card instead of its own card).
  const xpToNext = (rank && rank.xp_next != null && progression)
    ? Math.max(0, rank.xp_next - (progression.xp ?? 0))
    : null

  // Daily challenge derived state (shared by hero copy + CTA routing).
  const target = dailyProgress?.target ?? 10
  const correct = dailyProgress?.today_correct ?? 0
  const passed = dailyProgress?.passed_today ?? dailyDone
  const pct = Math.min(100, Math.round((correct / target) * 100))
  const dailyLoading = dailyProgress === null && dailyDone === null

  return (
    <Screen width="default">
      <Stagger>
        {/* ===== Greeting — avatar-forward, time-aware, personal ===== */}
        <StaggerItem className="flex items-center gap-3 mb-4 sm:mb-5">
          <Avatar
            initials={initials}
            src={avatarUrl}
            size="lg"
            variant="head"
            equipped={user?.equipped}
            className="shrink-0 shadow-[0_6px_16px_rgba(120,80,40,0.14)]"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs font-bold text-quiz-muted">{greeting},</div>
            <div className="font-head font-extrabold text-xl sm:text-2xl leading-tight truncate text-quiz-text">
              {firstName}
            </div>
          </div>
          {progression && (
            <div className="shrink-0 flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan font-black text-xs">
                <Icon name="star" className="w-3.5 h-3.5" />
                <span>Lv {progression.level}</span>
              </div>
            </div>
          )}
        </StaggerItem>

        {/* ===== HERO — Daily Challenge (the one focal action) =====
            Kept as a solid white card (theme-safe + accessible) but given
            the most visual weight on the page: larger padding, a stronger
            shadow, bigger Baloo heading and icon chip. Hierarchy comes from
            size/elevation/type — not a mid-tone fill that would fail
            white-text contrast against the real gold brand token. */}
        <StaggerItem>
          <Card variant="solid" className="!p-5 mb-4 sm:mb-5 shadow-lg">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-wide text-quiz-muted">
                  Daily challenge · Physics
                </div>
                {dailyLoading ? (
                  <Skeleton width="w-40" height="h-8" className="mt-1.5" />
                ) : (
                  <div className="font-head font-extrabold text-2xl sm:text-3xl mt-1 flex items-center gap-2 text-quiz-text">
                    {passed ? (
                      <>
                        All done today
                        <Icon name="check" className="w-6 h-6 text-quiz-green" />
                      </>
                    ) : (
                      <>{correct}<span className="text-quiz-muted text-xl sm:text-2xl font-bold"> / {target} correct</span></>
                    )}
                  </div>
                )}
              </div>
              <div
                className={
                  'w-[52px] h-[52px] rounded-2xl grid place-items-center border shrink-0 ' +
                  (passed
                    ? 'text-quiz-yellow bg-quiz-yellow/15 border-quiz-yellow/40'
                    : 'text-quiz-orange bg-quiz-orange/15 border-quiz-orange/40')
                }
              >
                <Icon name={passed ? 'medal' : 'target'} className="w-6 h-6" />
              </div>
            </div>

            <ProgressBar
              value={passed ? 100 : pct}
              tone={passed ? 'ok' : 'streak'}
              height="md"
              shimmer
              className="mb-4"
            />

            <Button3d
              variant={passed ? 'blue' : 'orange'}
              size="md"
              full
              // Once the daily is done, "Bonus Practice" is just normal
              // practice — route to the reward-free practice flow so it
              // grants no XP/gems. Before the daily is done, this is the
              // daily challenge itself ('quiz' route, rewarded).
              onClick={() => onNavigate(passed ? 'practice' : 'quiz')}
            >
              {passed ? (
                <>
                  <Icon name="pencil" className="w-4 h-4" />
                  Bonus practice
                </>
              ) : (
                <>
                  <Icon name="flame" className="w-4 h-4" />
                  {correct > 0
                    ? `Keep going — ${target - correct} to go`
                    : "Start today's challenge"}
                </>
              )}
            </Button3d>
          </Card>
        </StaggerItem>

        {/* ===== Week + streak banner — the streak's single home ===== */}
        <StaggerItem
          className="rounded-3xl p-4 sm:p-5 mb-4 sm:mb-5 relative overflow-hidden border border-[#F0E5D8]"
          style={{ background: 'var(--weekstrip-grad)', boxShadow: '0 8px 22px rgba(120,80,40,0.12)' }}
        >
          <div className="relative z-10">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="text-white">
                <div className="flex items-center gap-1.5">
                  <Icon name="flame" className="w-5 h-5" />
                  <span className="font-head font-extrabold text-2xl sm:text-3xl leading-none">
                    {currentStreak}
                  </span>
                  <span className="font-bold text-sm opacity-90 mb-0.5">
                    day{currentStreak === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white/85 mt-1">
                  Best {longestStreak}d · {freezes} freeze{freezes === 1 ? '' : 's'} left
                </div>
              </div>
            </div>
            {/* WeekStrip primitive — cells + legend handled internally. */}
            <WeekStrip days={weekData?.days} loading={!weekData} />
          </div>
        </StaggerItem>

        {/* ===== Rank / XP — calm, full-width progress card ===== */}
        <StaggerItem>
          <Card variant="solid" className="!p-4 mb-4 sm:mb-5">
            {rank ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl sm:text-3xl leading-none shrink-0">{rank.tier_icon || rank.icon}</span>
                    <div className="min-w-0">
                      <div className="font-head font-extrabold text-lg text-quiz-blue leading-tight truncate">
                        {rank.tier_name || rank.name}
                      </div>
                      {progression && (
                        <div className="text-[11px] font-bold text-quiz-muted">
                          {progression.xp} XP
                          {xpToNext != null && (
                            <span className="text-quiz-blue"> · {xpToNext} to {rank.next_name || 'next'}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {progression && (
                  rank?.xp_next > 0 ? (
                    <ProgressBar
                      value={Math.min(100, (progression.xp / rank.xp_next) * 100)}
                      tone="accent"
                      height="md"
                      shimmer
                      className="mt-3"
                    />
                  ) : (
                    <ProgressBar value={100} tone="ok" height="md" shimmer className="mt-3" />
                  )
                )}
              </>
            ) : (
              <div className="text-quiz-muted text-sm">Start a quiz to earn your first rank.</div>
            )}
          </Card>
        </StaggerItem>

        {/* ===== Jump In — four shortcuts, one visual set ===== */}
        <StaggerItem>
          <div className="font-head font-extrabold text-base text-quiz-text mb-2.5 px-0.5">Jump in</div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((a) => (
              <motion.button
                key={a.id}
                onClick={() => onNavigate(a.id)}
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="qq-card-solid !p-3.5 text-left flex items-center gap-3"
              >
                <div className={'w-10 h-10 rounded-xl grid place-items-center border shrink-0 ' + a.chip}>
                  <Icon name={a.icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm leading-tight truncate text-quiz-text">{a.label}</div>
                  <div className="text-[10px] font-bold text-quiz-muted mt-0.5 truncate">{a.sub}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </StaggerItem>
      </Stagger>
    </Screen>
  )
}
