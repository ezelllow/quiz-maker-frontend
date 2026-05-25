import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import { Stagger, StaggerItem } from './ui/Motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// HomePage — friendly landing screen modelled on the QuizQuest renderHome layout.
// Compacted so the whole thing fits one phone screen without scrolling: the
// standalone "Next tier" card and "Recent activity" list were folded away
// (next-tier XP now sits inside the Rank card; History is one tap in Jump In).
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
  const initials = name.charAt(0).toUpperCase()
  const avatarUrl = user?.avatar_url || ''
  const currentStreak = streak?.current_streak ?? 0
  const longestStreak = streak?.longest_streak ?? 0
  const freezes = streak?.freezes_available ?? 0

  const quickActions = [
    { id: 'quiz',      icon: '✏️', label: 'Practice',  sub: 'Pick topics & drill',  tint: 'from-quiz-green/20 to-quiz-blue/20  border-quiz-green/40' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard', sub: 'Your full stats',      tint: 'from-quiz-blue/20 to-quiz-purple/20 border-quiz-blue/40' },
    { id: 'saved',     icon: '💾', label: 'Saved',     sub: 'Retake your quizzes',  tint: 'from-quiz-yellow/20 to-quiz-orange/20 border-quiz-yellow/40' },
    { id: 'history',   icon: '📋', label: 'History',   sub: 'Review past attempts', tint: 'from-quiz-cyan/20 to-quiz-purple/20 border-quiz-cyan/40' },
  ]

  // Next-tier XP (folded into the Rank card instead of its own card).
  const xpToNext = (rank && rank.xp_next != null && progression)
    ? Math.max(0, rank.xp_next - (progression.xp ?? 0))
    : null

  return (
    <Screen width="default">
      <Stagger>
        {/* Welcome bar */}
        <StaggerItem className="flex items-center justify-between gap-3 mb-3 sm:mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-quiz-blue to-quiz-purple
                            ring-2 ring-quiz-border-bright flex items-center justify-center text-base sm:text-xl font-black text-white shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-quiz-muted">Welcome back</div>
              <div className="text-base sm:text-lg font-black truncate">{name}</div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-quiz-orange/15 border border-quiz-orange/40 font-black text-quiz-orange text-sm">
              🔥 <span>{currentStreak}</span>
            </div>
          </div>
        </StaggerItem>

        {/* Today's Daily Challenge card — X / target correct, stacks across attempts */}
        <StaggerItem>
          <Card variant="solid" className="!p-4 sm:!p-5 mb-3 sm:mb-4">
            {(() => {
              const target = dailyProgress?.target ?? 10
              const correct = dailyProgress?.today_correct ?? 0
              const passed = dailyProgress?.passed_today ?? dailyDone
              const pct = Math.min(100, Math.round((correct / target) * 100))
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
                        Today's Daily Challenge
                      </div>
                      <div className="text-lg sm:text-xl font-black mt-0.5">
                        {dailyProgress === null && dailyDone === null
                          ? 'Loading…'
                          : passed
                          ? "Done for today ✓"
                          : `${correct} / ${target} correct`}
                      </div>
                    </div>
                    <div className={'text-3xl sm:text-4xl ' + (passed ? '' : 'opacity-50')}>
                      {passed ? '🏅' : '🎯'}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                    <motion.div
                      className={'h-full ' +
                        (passed ? 'bg-quiz-yellow' : 'bg-gradient-to-r from-quiz-orange to-quiz-yellow')}
                      initial={{ width: 0 }}
                      animate={{ width: passed ? '100%' : `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                    />
                  </div>
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
                    {passed
                      ? '✏️ Bonus Practice'
                      : correct > 0
                      ? `🔥 Keep going — ${target - correct} to go`
                      : "🔥 Start today's challenge"}
                  </Button3d>
                </>
              )
            })()}
          </Card>
        </StaggerItem>

        {/* Streak + Rank side-by-side */}
        <StaggerItem className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Card variant="solid" className="!p-3 sm:!p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Streak</div>
            <div className="text-2xl sm:text-3xl font-black flex items-center gap-1.5 mt-0.5">
              <span className={currentStreak > 0 ? '' : 'opacity-40'}>🔥</span>
              <span>{currentStreak}</span>
              <span className="text-sm sm:text-base font-bold text-quiz-muted">d</span>
            </div>
            <div className="text-[11px] text-quiz-muted mt-1 font-bold">
              Longest {longestStreak}d · {freezes} freeze{freezes === 1 ? '' : 's'}
            </div>
          </Card>

          <Card variant="solid" className="!p-3 sm:!p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Rank</div>
            {rank ? (
              <>
                <div className="flex items-center gap-1.5 mt-0.5 font-black text-quiz-blue">
                  <span className="text-2xl sm:text-3xl leading-none">{rank.tier_icon || rank.icon}</span>
                  <span className="text-base sm:text-lg truncate">{rank.tier_name || rank.name}</span>
                </div>
                {progression && (
                  <div className="text-[11px] text-quiz-muted mt-1 font-bold">
                    Lv {progression.level} · {progression.xp} XP
                    {xpToNext != null && (
                      <span className="text-quiz-blue"> · {xpToNext} to {rank.next_name || 'next'}</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-quiz-muted text-xs mt-2">Start a quiz to earn your first rank.</div>
            )}
          </Card>
        </StaggerItem>

        {/* Weekly strip — Mon→Sun of THIS calendar week, with per-day status */}
        <StaggerItem className="rounded-3xl p-3 sm:p-4 mb-3 sm:mb-4 relative overflow-hidden border border-white/15 shadow-xl"
             style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #06b6d4 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-white">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-90">This week</div>
                <div className="text-xl sm:text-2xl font-black">
                  {currentStreak} day{currentStreak === 1 ? '' : 's'} 🚀
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {(weekData?.days || []).map((day) => (
                <WeekCell key={day.date} day={day} />
              ))}
              {!weekData && [0,1,2,3,4,5,6].map((d) => (
                <div key={d} className="aspect-square rounded-xl bg-white/10" />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-2 text-[10px] font-bold text-white/80">
              <span>🔥 done</span><span>❄️ freeze</span><span>○ upcoming</span><span>✖ missed</span>
            </div>
          </div>
        </StaggerItem>

        {/* Quick Actions */}
        <StaggerItem>
          <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">Jump In</div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <motion.button
                key={a.id}
                onClick={() => onNavigate(a.id)}
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={'qq-card-solid !p-3 text-left flex items-center gap-2.5 border-l-4 bg-gradient-to-br ' + a.tint}
              >
                <div className="text-2xl shrink-0">{a.icon}</div>
                <div className="min-w-0">
                  <div className="font-black text-sm leading-tight truncate">{a.label}</div>
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

function WeekCell({ day }) {
  const isToday = day.is_today || day.status === 'today'
  const base = 'aspect-square rounded-xl flex flex-col items-center justify-center font-black border-2 transition-transform'
  const styles = {
    completed:   'bg-white text-purple-700 border-white shadow-md',
    freeze_used: 'bg-cyan-200 text-cyan-900 border-cyan-300',
    today:       'bg-white/30 text-white border-white border-dashed scale-105',
    missed:      'bg-red-500/40 text-white border-red-400/60',
    upcoming:    'bg-white/10 text-white/70 border-white/15',
  }[day.status] || 'bg-white/10 text-white/70 border-white/15'
  const icon = {
    completed:   '🔥',
    freeze_used: '❄️',
    today:       '·',
    missed:      '✖',
    upcoming:    '○',
  }[day.status] || '○'
  return (
    <div className={base + ' ' + styles + (isToday ? ' ring-2 ring-white/70' : '')}>
      <div className="text-[9px] uppercase tracking-widest opacity-80 leading-none">{day.weekday}</div>
      <div className="text-sm leading-none mt-1">{icon}</div>
    </div>
  )
}
