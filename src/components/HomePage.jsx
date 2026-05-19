import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// HomePage — friendly landing screen modelled on the QuizQuest renderHome layout.
// Mapped to HabitGo data (streak / rank / Daily Challenge / history). Mobile-first;
// expands to a 2-col grid on desktop for the side-by-side cards.
export default function HomePage({ authToken, user, rank, progression, onNavigate }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [streak, setStreak] = useState(null)
  const [dailyDone, setDailyDone] = useState(null)   // null until loaded
  const [dailyProgress, setDailyProgress] = useState(null)  // {today_correct, target, ...}
  const [weekData, setWeekData] = useState(null)     // {days: [{date, weekday, status, is_today}, ...]}
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/api/daily-challenge?subject=Physics`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { attempts: [] })),
      fetch(`${API_BASE_URL}/api/streak/week`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([streakData, dc, hist, week]) => {
        if (cancelled) return
        setStreak(streakData)
        setDailyDone(dc?.already_passed_today === true)
        setDailyProgress(dc?.daily_progress || null)
        setRecent((hist?.attempts || []).slice(0, 3))
        setWeekData(week)
      })
      .catch(() => { /* silent — degrade gracefully */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const name = (user?.name || 'Student').trim()
  const initials = name.charAt(0).toUpperCase()
  const avatarUrl = user?.avatar_url || ''
  const currentStreak = streak?.current_streak ?? 0
  const longestStreak = streak?.longest_streak ?? 0
  const freezes = streak?.freezes_available ?? 0

  // The 7-day strip is now backed by /api/streak/week so each cell shows the
  // real per-day status (completed / freeze_used / today / missed / upcoming).
  // The "Week N" label is just a count of how many ISO weeks the user has been
  // active for — informational, not the source of the strip.

  const quickActions = [
    { id: 'quiz',      icon: '✏️', label: 'Practice',  sub: 'Pick topics & drill',  tint: 'from-quiz-green/20 to-quiz-blue/20  border-quiz-green/40' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard', sub: 'Your full stats',      tint: 'from-quiz-blue/20 to-quiz-purple/20 border-quiz-blue/40' },
    { id: 'saved',     icon: '💾', label: 'Saved',     sub: 'Retake your quizzes',  tint: 'from-quiz-yellow/20 to-quiz-orange/20 border-quiz-yellow/40' },
    { id: 'history',   icon: '📋', label: 'History',   sub: 'Review past attempts', tint: 'from-quiz-cyan/20 to-quiz-purple/20 border-quiz-cyan/40' },
  ]

  return (
    <Screen width="default">
      {/* Welcome bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-quiz-blue to-quiz-purple
                          ring-2 ring-quiz-border-bright flex items-center justify-center text-xl font-black text-white shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Welcome back</div>
            <div className="text-lg font-black truncate">{name}</div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-quiz-orange/15 border border-quiz-orange/40 font-black text-quiz-orange">
            🔥 <span>{currentStreak}</span>
          </div>
          {rank && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-quiz-blue/20 to-quiz-purple/20 border border-quiz-blue/40 font-black text-quiz-blue">
              {rank.tier_icon} <span className="hidden sm:inline">{rank.tier_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's Daily Challenge card — X / target correct, stacks across attempts */}
      <Card variant="solid" className="!p-5 mb-4">
        {(() => {
          const target = dailyProgress?.target ?? 10
          const correct = dailyProgress?.today_correct ?? 0
          const passed = dailyProgress?.passed_today ?? dailyDone
          const pct = Math.min(100, Math.round((correct / target) * 100))
          return (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
                    Today's Daily Challenge
                  </div>
                  <div className="text-xl font-black mt-0.5">
                    {dailyProgress === null && dailyDone === null
                      ? 'Loading…'
                      : passed
                      ? "Done for today ✓"
                      : `${correct} / ${target} correct`}
                  </div>
                </div>
                <div className={'text-4xl ' + (passed ? '' : 'opacity-50')}>
                  {passed ? '🏅' : '🎯'}
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
                <div
                  className={'h-full transition-all duration-500 ' +
                    (passed ? 'bg-quiz-yellow' : 'bg-gradient-to-r from-quiz-orange to-quiz-yellow')}
                  style={{ width: passed ? '100%' : `${pct}%` }}
                />
              </div>
              <Button3d
                variant={passed ? 'blue' : 'orange'}
                size="lg"
                full
                onClick={() => onNavigate('quiz')}
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

      {/* Streak + Rank side-by-side */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card variant="solid" className="!p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Streak</div>
          <div className="text-3xl font-black flex items-center gap-1.5 mt-1">
            <span className={currentStreak > 0 ? '' : 'opacity-40'}>🔥</span>
            <span>{currentStreak}</span>
            <span className="text-base font-bold text-quiz-muted">d</span>
          </div>
          <div className="text-xs text-quiz-muted mt-1 font-bold">
            Longest {longestStreak}d · 🧊 {freezes}
          </div>
        </Card>

        <Card variant="solid" className="!p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Rank</div>
          {rank ? (
            <>
              <div className="text-3xl flex items-center gap-2 mt-1 font-black text-quiz-blue">
                <span className="text-4xl leading-none">{rank.tier_icon || rank.icon}</span>
                <span className="text-lg">{rank.tier_name || rank.name}</span>
              </div>
              {progression && (
                <div className="text-xs text-quiz-muted mt-1 font-bold">
                  Lv {progression.level} · {progression.xp} XP
                </div>
              )}
            </>
          ) : (
            <div className="text-quiz-muted text-sm mt-2">Start a quiz to earn your first rank.</div>
          )}
        </Card>
      </div>

      {/* XP progress toward next tier */}
      {progression && rank && (() => {
        const xp = progression.xp ?? 0
        const xpMin  = rank.xp_min  ?? 0
        const xpNext = rank.xp_next                // null = maxed
        const atMax  = xpNext == null
        const span   = atMax ? 1 : Math.max(1, xpNext - xpMin)
        const pct    = atMax ? 100 : Math.min(100, Math.max(0, Math.round(((xp - xpMin) / span) * 100)))
        const toGo   = atMax ? 0 : Math.max(0, xpNext - xp)
        return (
          <Card variant="solid" className="!p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
                Next tier
              </div>
              <div className="text-[11px] font-black text-quiz-blue">
                {atMax
                  ? '⭐ Max tier — Legend'
                  : <>{toGo} XP to {rank.next_name || rank.tier_name}</>}
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-quiz-border">
              <div
                className="h-full bg-gradient-to-r from-quiz-blue via-quiz-purple to-quiz-cyan
                           transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-quiz-muted mt-1.5">
              <span>{xpMin} XP</span>
              <span className="text-quiz-text">{xp} XP · Lv {progression.level}</span>
              <span>{atMax ? '∞' : `${xpNext} XP`}</span>
            </div>
          </Card>
        )
      })()}

      {/* Weekly strip — Mon→Sun of THIS calendar week, with per-day status */}
      <div className="rounded-3xl p-4 mb-4 relative overflow-hidden border border-white/15 shadow-xl"
           style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #06b6d4 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-white">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-90">This week</div>
              <div className="text-2xl font-black">
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
          <div className="flex items-center justify-center gap-3 mt-3 text-[10px] font-bold text-white/80">
            <span>🔥 done</span><span>❄️ freeze</span><span>○ upcoming</span><span>✖ missed</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Jump In</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.id}
              onClick={() => onNavigate(a.id)}
              className={'qq-card-solid !p-4 text-left flex items-center gap-3 hover:-translate-y-0.5 transition-transform border-l-4 bg-gradient-to-br ' + a.tint}
            >
              <div className="text-3xl shrink-0">{a.icon}</div>
              <div className="min-w-0">
                <div className="font-black text-base leading-tight truncate">{a.label}</div>
                <div className="text-[11px] font-bold text-quiz-muted mt-0.5">{a.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {!loading && recent.length > 0 && (
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">Recent</div>
          <div className="space-y-2">
            {recent.map((h) => {
              const pct = h.percentage
              const pctCls = pct >= 80 ? 'text-quiz-green' : pct >= 50 ? 'text-quiz-yellow' : 'text-quiz-red'
              const d = new Date(h.attempted_at)
              const dateStr = d.toLocaleDateString()
              return (
                <button
                  key={h.id}
                  onClick={() => onNavigate('history')}
                  className="qq-card-solid !p-3 w-full text-left flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <div className="text-2xl shrink-0">{pct >= 80 ? '🏆' : pct >= 50 ? '📘' : '💡'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm truncate">{h.name || `Quiz #${h.parent_attempt_id || h.id}`}</div>
                    <div className="text-xs text-quiz-muted font-bold">
                      {h.score}/{h.total_questions} correct · {dateStr}
                    </div>
                  </div>
                  <div className={'text-lg font-black ' + pctCls}>{pct}%</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
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
