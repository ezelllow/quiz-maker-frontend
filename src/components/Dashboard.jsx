import React, { useState, useEffect } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Icon from './ui/Icon'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const fmtTime = (s) => {
  if (!s) return '0s'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

// accuracy → colour band (green strong · yellow ok · red weak)
const accText = (p) => (p >= 80 ? 'text-quiz-green' : p >= 50 ? 'text-quiz-yellow' : 'text-quiz-red')
const accBar  = (p) => (p >= 80 ? 'bg-quiz-green'   : p >= 50 ? 'bg-quiz-yellow'   : 'bg-quiz-red')

export default function Dashboard({ authToken }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error('Failed to load stats'); return r.json() })
      .then((d) => { setStats(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [token])

  if (loading) return (
    <Shell><Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading your stats…</Card></Shell>
  )
  if (error) return (
    <Shell><Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card></Shell>
  )

  if (!stats || stats.total_attempts === 0) return (
    <Shell>
      <Card variant="solid" className="!p-12 text-center">
        <div className="text-6xl mb-3"><Icon name="inbox" className="w-14 h-14 mx-auto text-quiz-muted" /></div>
        <p className="text-quiz-muted font-bold">
          No practice attempts yet. Take a Practice quiz and your statistics will appear here.
        </p>
      </Card>
    </Shell>
  )

  const topics   = (stats.by_subtopic   || []).filter((t) => t.total > 0)
  const diffs    = (stats.by_difficulty || []).filter((d) => d.total > 0)
  const subjects = (stats.by_subject    || []).filter((s) => s.total > 0)
  const weak     = stats.weakest_subtopics || []
  const weekly   = stats.weekly_accuracy   || []
  const trend    = (stats.growth && stats.growth.per_topic_trend) || []
  const delta    = stats.growth ? stats.growth.accuracy_delta : null

  return (
    <Shell>
      {/* ===== 1. ACCURACY PERFORMANCE ===== */}
      <SectionTitle n="1" title="Accuracy Performance" sub="How well you actually understand the content" />
      <BigAccuracy
        accuracy={stats.overall_accuracy}
        delta={delta}
        correct={stats.total_correct}
        total={stats.total_questions_answered}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="First-try accuracy" value={`${stats.first_attempt_accuracy ?? 0}%`} />
        <MiniStat label="Quizzes taken"      value={stats.total_attempts} />
        <MiniStat label="Time spent"         value={fmtTime(stats.total_time_seconds)} />
      </div>
      {subjects.length > 0 && (
        <Panel title="Accuracy by subject">
          {subjects.map((s) => <AccuracyBar key={s.name} {...s} />)}
        </Panel>
      )}
      {topics.length > 0 && (
        <Panel title="Accuracy by topic" sub="Colour-coded — green is strong, red needs work">
          {topics.map((t) => <AccuracyBar key={t.name} {...t} />)}
        </Panel>
      )}
      {diffs.length > 0 && (
        <Panel title="Accuracy by difficulty">
          {diffs.map((d) => <AccuracyBar key={d.name} {...d} />)}
        </Panel>
      )}

      {/* ===== 2. WEAKEST TOPICS ===== */}
      <SectionTitle n="2" title="Weakest Topics" sub="What to focus your practice on" />
      {weak.length > 0 ? (
        <div className="space-y-3 mb-4">
          {weak.map((w, i) => <WeakTopicCard key={w.name} rank={i + 1} topic={w} />)}
        </div>
      ) : (
        <Card variant="solid" className="!p-6 text-center text-quiz-muted font-bold mb-4">
          Not enough data yet — answer at least 3 questions in a topic and your weak spots will surface here.
        </Card>
      )}

      {/* ===== 3. IMPROVEMENT OVER TIME ===== */}
      <SectionTitle n="3" title="Improvement Over Time" sub="See your progress build up" />
      <Panel title="Overall accuracy trend" sub="Weekly accuracy">
        {weekly.length >= 2
          ? <LineChart data={weekly} />
          : <p className="text-quiz-muted text-sm font-bold">
              Keep practising across a few weeks and your trend line will appear here.
            </p>}
      </Panel>
      {trend.length > 0 && (
        <Panel title="Topic improvement" sub="How each topic has moved over your history">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trend.map((t) => <ImprovementCard key={t.name} t={t} />)}
          </div>
        </Panel>
      )}
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <Screen width="wide">
      <header className="mb-2">
        <h1 className="font-head !text-3xl !font-extrabold tracking-tight mb-1">Statistics</h1>
        <p className="text-quiz-muted font-semibold">Your performance, weak spots, and progress</p>
      </header>
      {children}
    </Screen>
  )
}

function SectionTitle({ n, title, sub }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-3">
      <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-quiz-blue to-quiz-purple
                       flex items-center justify-center font-black text-white shrink-0">{n}</span>
      <div>
        <h2 className="font-head !text-xl !font-extrabold tracking-tight leading-none">{title}</h2>
        {sub && <p className="text-xs text-quiz-muted font-semibold mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function Panel({ title, sub, children }) {
  return (
    <Card variant="solid" className="!p-5 mb-4">
      <div className="mb-3">
        <h3 className="!text-base !font-black">{title}</h3>
        {sub && <p className="text-xs text-quiz-muted font-semibold mt-0.5">{sub}</p>}
      </div>
      {children}
    </Card>
  )
}

function BigAccuracy({ accuracy, delta, correct, total }) {
  const hasDelta = delta !== null && delta !== undefined
  const up = hasDelta && delta > 0, down = hasDelta && delta < 0
  return (
    <Card variant="solid" className="!p-6 mb-3 ring-2 ring-quiz-blue/40">
      <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Overall accuracy</div>
      <div className="flex items-end gap-3 mt-1">
        <span className={'text-6xl font-black leading-none ' + accText(accuracy)}>{accuracy}%</span>
        {hasDelta && (
          <span className={'text-sm font-black mb-1 ' +
            (up ? 'text-quiz-green' : down ? 'text-quiz-red' : 'text-quiz-muted')}>
            {up ? '↑' : down ? '↓' : '→'} {Math.abs(delta)}% this week
          </span>
        )}
      </div>
      <div className="text-xs text-quiz-muted font-bold mt-2">{correct} / {total} questions correct</div>
      <div className="h-2.5 rounded-full bg-gray-50 overflow-hidden mt-3">
        <div className={'h-full ' + accBar(accuracy)} style={{ width: `${accuracy}%` }} />
      </div>
    </Card>
  )
}

function MiniStat({ label, value }) {
  return (
    <Card variant="solid" className="!p-3 text-center">
      <div className="text-xl font-black">{value}</div>
      <div className="text-[10px] font-bold text-quiz-muted uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
    </Card>
  )
}

function AccuracyBar({ name, accuracy, correct, total }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-bold truncate pr-2">{name}</span>
        <span className="shrink-0 text-xs font-black">
          <span className={accText(accuracy)}>{accuracy}%</span>
          <span className="text-quiz-muted font-bold ml-2">{correct}/{total}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-50 overflow-hidden">
        <div className={'h-full ' + accBar(accuracy) + ' transition-all'} style={{ width: `${accuracy}%` }} />
      </div>
    </div>
  )
}

function WeakTopicCard({ rank, topic }) {
  const { name, accuracy, correct, total, avg_time, repeated_mistakes, trend_delta } = topic
  const hasTrend = trend_delta !== null && trend_delta !== undefined
  return (
    <Card variant="solid" className="!p-4 border-l-4 border-quiz-red">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-lg bg-quiz-red/20 text-quiz-red font-black
                           text-xs flex items-center justify-center">{rank}</span>
          <span className="font-black truncate">{name}</span>
        </div>
        <span className={'text-2xl font-black shrink-0 ' + accText(accuracy)}>{accuracy}%</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        <Metric label="Questions"       value={`${correct}/${total}`} />
        <Metric label="Avg time"        value={`${avg_time || 0}s`} />
        <Metric label="Repeated misses" value={repeated_mistakes || 0} />
        <Metric
          label="Recent trend"
          value={hasTrend
            ? `${trend_delta > 0 ? '▲' : trend_delta < 0 ? '▼' : '—'} ${Math.abs(trend_delta)}%`
            : '—'}
          tone={hasTrend ? (trend_delta > 0 ? 'up' : trend_delta < 0 ? 'down' : '') : ''}
        />
      </div>
      <div className="mt-3 px-3 py-2.5 rounded-xl bg-quiz-blue/10 border border-quiz-blue/30">
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-blue mb-1">Recommended</div>
        <ul className="text-xs font-bold text-quiz-text space-y-0.5">
          <li>• 10-question practice quiz on {name}</li>
          <li>• Medium-difficulty revision of {name}</li>
        </ul>
      </div>
    </Card>
  )
}

function Metric({ label, value, tone }) {
  const c = tone === 'up' ? 'text-quiz-green' : tone === 'down' ? 'text-quiz-red' : 'text-quiz-text'
  return (
    <div className="bg-gray-50 rounded-xl border border-quiz-border px-2 py-1.5">
      <div className="text-[9px] font-black uppercase tracking-widest text-quiz-muted">{label}</div>
      <div className={'text-sm font-black mt-0.5 ' + c}>{value}</div>
    </div>
  )
}

function ImprovementCard({ t }) {
  const up = t.delta > 0, down = t.delta < 0
  return (
    <div className={'rounded-2xl border p-3 ' +
      (up ? 'bg-quiz-green/10 border-quiz-green/30'
          : down ? 'bg-quiz-red/10 border-quiz-red/30'
                 : 'bg-gray-50 border-quiz-border')}>
      <div className="font-black truncate">{t.name}</div>
      <div className={'text-lg font-black mt-0.5 ' +
        (up ? 'text-quiz-green' : down ? 'text-quiz-red' : 'text-quiz-muted')}>
        {up ? '+' : ''}{t.delta}% {up ? 'improvement' : down ? 'this period' : 'steady'}
      </div>
      <div className="text-[11px] font-bold text-quiz-muted mt-0.5">
        {t.earlier_accuracy}% → {t.recent_accuracy}% · {t.questions} Qs
      </div>
    </div>
  )
}

function LineChart({ data }) {
  const w = 100, h = 40, padX = 3, padY = 5
  const uW = w - padX * 2, uH = h - padY * 2
  const pts = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * uW
    const y = padY + uH * (1 - (d.accuracy / 100))
    return [x, y]
  })
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const area = `${path} L ${pts[pts.length - 1][0].toFixed(2)} ${(h - padY).toFixed(2)} ` +
               `L ${pts[0][0].toFixed(2)} ${(h - padY).toFixed(2)} Z`
  const wkLabel = (s) => (s && s.includes('-W') ? 'W' + s.split('-W')[1] : s)
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="none">
        {[25, 50, 75].map((v) => {
          const y = padY + uH * (1 - v / 100)
          return <line key={v} x1={padX} x2={w - padX} y1={y} y2={y}
                       stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" strokeDasharray="0.6 0.6" />
        })}
        <defs>
          <linearGradient id="acc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#acc-area)" />
        <path d={path} stroke="#38bdf8" strokeWidth="0.9" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" fill="#22d3ee" />)}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <div key={i} className="text-center flex-1 min-w-0">
            <div className={'text-xs font-black ' + accText(d.accuracy)}>{d.accuracy}%</div>
            <div className="text-[9px] font-bold text-quiz-muted truncate">{wkLabel(d.week)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
