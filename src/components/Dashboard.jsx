import React, { useState, useEffect } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const formatTime = (seconds) => {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function Dashboard({ authToken }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [stats, setStats] = useState(null)
  const [ranks, setRanks] = useState([])
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error('Failed to load stats'); return r.json() })
      .then((d) => { setStats(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
    fetch(`${API_BASE_URL}/api/ranks`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { ranks: [] }))
      .then((d) => setRanks(d.ranks || []))
      .catch(() => setRanks([]))
    fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStreak(d))
      .catch(() => setStreak(null))
  }, [token])

  if (loading) {
    return (
      <Screen width="wide">
        <header className="mb-6">
          <h1 className="!text-3xl !font-black tracking-tight mb-1">📊 Dashboard</h1>
          <p className="text-quiz-muted font-semibold">Your study statistics</p>
        </header>
        <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading your stats…</Card>
      </Screen>
    )
  }
  if (error) {
    return (
      <Screen width="wide">
        <header className="mb-6"><h1 className="!text-3xl !font-black">📊 Dashboard</h1></header>
        <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card>
      </Screen>
    )
  }

  const empty = !stats || stats.total_attempts === 0
  return (
    <Screen width="wide">
      <header className="mb-6">
        <h1 className="!text-3xl !font-black tracking-tight mb-1">📊 Dashboard</h1>
        <p className="text-quiz-muted font-semibold">Your study statistics</p>
      </header>

      <div className="grid grid-cols-1 gap-3 mb-4">
        {ranks.length > 0 && <RankPanel ranks={ranks} />}
        {streak && <StreakCard streak={streak} />}
      </div>

      {empty ? (
        <Card variant="solid" className="!p-12 text-center">
          <div className="text-6xl mb-3">📭</div>
          <p className="text-quiz-muted font-bold">No quiz attempts yet. Take a Practice quiz first and your stats will appear here!</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard icon="🎯" label="Overall accuracy" value={`${stats.overall_accuracy}%`} sub={`${stats.total_correct}/${stats.total_questions_answered} correct`} highlight />
            <StatCard icon="📚" label="Quizzes taken"    value={stats.total_attempts} sub={`${stats.total_quizzes} unique`} />
            <StatCard icon="⏱️" label="Time spent"      value={formatTime(stats.total_time_seconds)} sub={`~${stats.avg_time_per_question}s/q`} />
            <StatCard icon="🔥" label="Current streak"  value={`${stats.recent_streak_days}d`} sub={stats.recent_streak_days > 0 ? 'Keep it going!' : 'Take a quiz today'} />
          </div>

          {stats.trend && stats.trend.length > 0 && (
            <Panel title="Performance trend" subtitle={`Last ${stats.trend.length} attempts`}>
              <TrendChart data={stats.trend} />
            </Panel>
          )}

          {stats.growth && <GrowthPanel growth={stats.growth} />}

          <div className="grid grid-cols-1 gap-3">
            {stats.by_subtopic && stats.by_subtopic.length > 0 && (
              <Panel title="Accuracy by topic" subtitle="How you're doing per topic">
                <BarList items={stats.by_subtopic} />
              </Panel>
            )}
            {stats.by_difficulty && stats.by_difficulty.length > 0 && (
              <Panel title="Accuracy by difficulty" subtitle="Easy → Hard">
                <BarList items={stats.by_difficulty} />
              </Panel>
            )}
          </div>

          {stats.weakest_subtopics && stats.weakest_subtopics.length > 0 && (
            <Panel title="Focus areas" subtitle="Where you can improve the most">
              <div className="space-y-2">
                {stats.weakest_subtopics.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-quiz-border">
                    <div className="font-bold">{s.name}</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-black text-quiz-red">{s.accuracy}%</span>
                      <span className="text-quiz-muted">{s.correct}/{s.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </Screen>
  )
}

function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <Card variant="solid" className={'!p-4 ' + (highlight ? 'ring-2 ring-quiz-blue/40' : '')}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-bold text-quiz-muted uppercase tracking-wider">{label}</div>
      <div className="text-2xl sm:text-3xl font-black mt-0.5">{value}</div>
      <div className="text-xs text-quiz-muted mt-1">{sub}</div>
    </Card>
  )
}

function StreakCard({ streak }) {
  const current = streak.current_streak ?? 0
  const longest = streak.longest_streak ?? 0
  const freezes = streak.freezes_available ?? 0
  const didToday = !!streak.did_today
  return (
    <Card variant="solid" className="!p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="!text-lg !font-black">Daily Streak</h2>
          <p className="text-xs text-quiz-muted font-semibold mt-0.5">
            {didToday ? "Today's challenge done — streak safe" : "Today's challenge not done yet"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className={'flex flex-col items-center justify-center w-24 h-24 rounded-full text-3xl font-black ' +
          (current > 0
            ? 'bg-gradient-to-br from-quiz-orange to-quiz-red text-white shadow-xl'
            : 'bg-white/5 border-2 border-quiz-border text-quiz-muted')}>
          <span className="leading-none">{current}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{current === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 flex-1 text-center">
          <div>
            <div className="text-[10px] font-bold text-quiz-muted uppercase tracking-wider">Longest</div>
            <div className="font-black mt-0.5">{longest}d</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-quiz-muted uppercase tracking-wider">Freeze</div>
            <div className="font-black mt-0.5">🧊 {freezes}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-quiz-muted uppercase tracking-wider">Today</div>
            <div className="font-black mt-0.5">{didToday ? '✅' : '⏳'}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function RankPanel({ ranks }) {
  return (
    <Card variant="solid" className="!p-5">
      <div className="mb-3">
        <h2 className="!text-lg !font-black">Your Rank</h2>
        <p className="text-xs text-quiz-muted font-semibold mt-0.5">Your current standing per subject</p>
      </div>
      <div className="flex flex-col gap-3">
        {ranks.map((r) => (
          <div key={r.subject} className="flex items-center gap-4 p-3 rounded-2xl
                                          bg-gradient-to-r from-quiz-blue/15 to-quiz-purple/15
                                          border border-quiz-blue/30">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl
                            bg-gradient-to-br from-quiz-blue/25 to-quiz-purple/25
                            border border-quiz-blue/40 shrink-0">
              {r.tier_icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-lg">
                {r.tier_name ? `${r.tier_name} · ${r.subject}` : r.subject}
              </div>
              <div className="text-xs text-quiz-muted font-bold">{r.rank_score}% at placement</div>
              {r.tier_desc && (
                <div className="text-xs text-quiz-muted leading-relaxed mt-1.5 line-clamp-2">{r.tier_desc}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <Card variant="solid" className="!p-5 mb-4">
      <div className="mb-3">
        <h2 className="!text-lg !font-black">{title}</h2>
        {subtitle && <p className="text-xs text-quiz-muted font-semibold mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </Card>
  )
}

function BarList({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((it) => {
        const pct = it.accuracy
        const barCol = pct >= 80 ? 'bg-quiz-green' : pct >= 50 ? 'bg-quiz-yellow' : 'bg-quiz-red'
        return (
          <div key={it.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold">{it.name}</span>
              <span className="text-quiz-muted text-xs font-bold">{it.correct}/{it.total} · {pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className={'h-full ' + barCol + ' transition-all'} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GrowthPanel({ growth }) {
  if (!growth) return null
  const { accuracy_delta, this_week_accuracy, last_week_accuracy,
          topics_improved, topics_tracked, per_topic_trend } = growth
  const hasWeek = accuracy_delta !== null && accuracy_delta !== undefined
  const trend = per_topic_trend || []
  const hasTopics = trend.length > 0

  if (!hasWeek && !hasTopics) {
    return (
      <Panel title="Practice growth" subtitle="Your improvement over time">
        <p className="text-quiz-muted text-sm">
          Not enough practice history yet. Take a few more practice quizzes and your week-on-week growth will show up here.
        </p>
        <Hint />
      </Panel>
    )
  }

  const dColor = (d) => (d > 0 ? 'text-quiz-green' : d < 0 ? 'text-quiz-red' : 'text-quiz-muted')
  const dBg    = (d) => (d > 0 ? 'bg-quiz-green/15' : d < 0 ? 'bg-quiz-red/15' : 'bg-white/5')
  const dArrow = (d) => (d > 0 ? '▲' : d < 0 ? '▼' : '—')

  return (
    <Panel title="Practice growth" subtitle="Improvement, not just volume">
      {hasWeek && (
        <div className="flex items-center gap-4 mb-4">
          <div className={'text-4xl font-black ' + dColor(accuracy_delta)}>
            {dArrow(accuracy_delta)} {Math.abs(accuracy_delta)}%
          </div>
          <div>
            <div className="text-xs font-bold text-quiz-muted uppercase tracking-wider">Accuracy vs last week</div>
            <div className="text-sm mt-0.5">
              {last_week_accuracy}% → <strong>{this_week_accuracy}%</strong> this week
            </div>
          </div>
        </div>
      )}
      {hasTopics && (
        <div className="flex items-baseline gap-2 py-2 border-t border-quiz-border">
          <span className="text-2xl font-black text-quiz-green">{topics_improved}</span>
          <span className="text-sm text-quiz-muted font-bold">
            of {topics_tracked} topic{topics_tracked === 1 ? '' : 's'} trending up
          </span>
        </div>
      )}
      {hasTopics && (
        <div className="mt-2">
          {trend.map((t) => (
            <div key={t.name} className="flex items-center justify-between gap-3 py-2 border-t border-quiz-border/60">
              <span className="font-bold text-sm truncate">{t.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-quiz-muted">{t.earlier_accuracy}%</span>
                <span className="text-quiz-muted">→</span>
                <span className="text-sm font-black">{t.recent_accuracy}%</span>
                <span className={'text-xs font-black px-2 py-0.5 rounded-full min-w-[56px] text-center ' + dColor(t.delta) + ' ' + dBg(t.delta)}>
                  {dArrow(t.delta)} {Math.abs(t.delta)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
      <Hint />
    </Panel>
  )
}

function Hint() {
  return (
    <div className="mt-4 px-3 py-2.5 rounded-2xl bg-quiz-blue/10 border border-quiz-blue/30 text-sm">
      💡 Drill your weak topics in Practice to ace tomorrow's Daily Challenge.
    </div>
  )
}

function TrendChart({ data }) {
  const w = 100, h = 32, padX = 2, padY = 4
  const usableW = w - padX * 2, usableH = h - padY * 2
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * usableW
    const y = padY + usableH * (1 - (d.percentage / 100))
    return [x, y, d]
  })
  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
  const areaD = `${pathD} L ${points[points.length - 1][0].toFixed(2)} ${(h - padY).toFixed(2)} L ${points[0][0].toFixed(2)} ${(h - padY).toFixed(2)} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" preserveAspectRatio="none">
        {[25, 50, 75].map((v) => {
          const y = padY + usableH * (1 - v / 100)
          return <line key={v} x1={padX} x2={w - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" strokeDasharray="0.6 0.6" />
        })}
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trend-area)" />
        <path d={pathD} stroke="#38bdf8" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill="#22d3ee" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-quiz-muted font-bold mt-2">
        <span>{data[0].percentage}% (oldest)</span>
        <span>{data[data.length - 1].percentage}% (latest)</span>
      </div>
    </div>
  )
}
