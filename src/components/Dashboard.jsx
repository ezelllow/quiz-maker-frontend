import React, { useState, useEffect } from 'react'
import './Dashboard.css'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load stats')
        return r.json()
      })
      .then((d) => {
        setStats(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
    // Ranks load independently — a failure here shouldn't break the dashboard.
    fetch(`${API_BASE_URL}/api/ranks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { ranks: [] }))
      .then((d) => setRanks(d.ranks || []))
      .catch(() => setRanks([]))
  }, [token])

  if (loading) {
    return (
      <div className="dashboard">
        <div className="header-section">
          <h1>📊 Dashboard</h1>
          <p>Your study statistics</p>
        </div>
        <div className="loading">Loading your stats…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="header-section"><h1>📊 Dashboard</h1></div>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!stats || stats.total_attempts === 0) {
    return (
      <div className="dashboard">
        <div className="header-section">
          <h1>📊 Dashboard</h1>
          <p>Your study statistics</p>
        </div>
        {ranks.length > 0 && <RankPanel ranks={ranks} />}
        <div className="no-data">
          <div className="emoji">📭</div>
          <p>No quiz attempts yet. Take a quiz first and your stats will appear here!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="header-section">
        <h1>📊 Dashboard</h1>
        <p>Your study statistics at a glance</p>
      </div>

      {/* Rank — the headline */}
      {ranks.length > 0 && <RankPanel ranks={ranks} />}

      {/* Top stat cards */}
      <div className="stat-grid">
        <StatCard
          icon="🎯"
          label="Overall accuracy"
          value={`${stats.overall_accuracy}%`}
          sub={`${stats.total_correct}/${stats.total_questions_answered} correct`}
          highlight
        />
        <StatCard
          icon="📚"
          label="Quizzes taken"
          value={stats.total_attempts}
          sub={`${stats.total_quizzes} unique quiz${stats.total_quizzes === 1 ? '' : 'zes'}`}
        />
        <StatCard
          icon="⏱️"
          label="Time spent"
          value={formatTime(stats.total_time_seconds)}
          sub={`~${stats.avg_time_per_question}s per question`}
        />
        <StatCard
          icon="🔥"
          label="Current streak"
          value={`${stats.recent_streak_days} day${stats.recent_streak_days === 1 ? '' : 's'}`}
          sub={stats.recent_streak_days > 0 ? 'Keep it going!' : 'Take a quiz today'}
        />
      </div>

      {/* Performance trend */}
      {stats.trend && stats.trend.length > 0 && (
        <Panel title="Performance trend" subtitle={`Last ${stats.trend.length} attempts`}>
          <TrendChart data={stats.trend} />
        </Panel>
      )}

      <div className="two-column">
        {/* By subtopic */}
        {stats.by_subtopic && stats.by_subtopic.length > 0 && (
          <Panel title="Accuracy by subtopic" subtitle="How you're doing per topic">
            <BarList items={stats.by_subtopic} />
          </Panel>
        )}

        {/* By difficulty */}
        {stats.by_difficulty && stats.by_difficulty.length > 0 && (
          <Panel title="Accuracy by difficulty" subtitle="Easy → Hard">
            <BarList items={stats.by_difficulty} />
          </Panel>
        )}
      </div>

      {/* Weakest topics */}
      {stats.weakest_subtopics && stats.weakest_subtopics.length > 0 && (
        <Panel title="Focus areas" subtitle="Subtopics where you can improve the most">
          <div className="weakest-list">
            {stats.weakest_subtopics.map((s) => (
              <div key={s.name} className="weakest-item">
                <div className="weakest-name">{s.name}</div>
                <div className="weakest-meta">
                  <span className="weakest-acc">{s.accuracy}%</span>
                  <span className="weakest-count">{s.correct}/{s.total} correct</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <div className={`stat-card${highlight ? ' highlight' : ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

function RankPanel({ ranks }) {
  return (
    <div className="panel rank-panel">
      <div className="panel-head">
        <h2>Your Rank</h2>
        <p>Your current standing per subject</p>
      </div>
      <div className="panel-body">
        <div className="rank-grid">
          {ranks.map((r) => (
            <div key={r.subject} className="rank-card">
              <div className="rank-badge">{r.rank_band}</div>
              <div className="rank-meta">
                <div className="rank-subject">{r.subject}</div>
                <div className="rank-score">{r.rank_score}% at placement</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  )
}

function BarList({ items }) {
  return (
    <div className="bar-list">
      {items.map((it) => {
        const pct = it.accuracy
        // colour-code by accuracy band
        const cls = pct >= 80 ? 'bar-good' : pct >= 50 ? 'bar-ok' : 'bar-bad'
        return (
          <div key={it.name} className="bar-row">
            <div className="bar-label">
              <span className="bar-name">{it.name}</span>
              <span className="bar-meta">{it.correct}/{it.total} • {pct}%</span>
            </div>
            <div className="bar-track">
              <div className={`bar-fill ${cls}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TrendChart({ data }) {
  // Simple inline SVG line chart of percentages.
  const w = 100   // viewBox width (percentages)
  const h = 32
  const padX = 2
  const padY = 4
  const usableW = w - padX * 2
  const usableH = h - padY * 2

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
    <div className="trend-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="trend-svg" preserveAspectRatio="none">
        {/* grid lines at 25/50/75 */}
        {[25, 50, 75].map((v) => {
          const y = padY + usableH * (1 - v / 100)
          return <line key={v} x1={padX} x2={w - padX} y1={y} y2={y} className="trend-grid" />
        })}
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5DA9FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#5DA9FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trend-area)" />
        <path d={pathD} className="trend-line" />
        {points.map(([x, y, d], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" className="trend-dot" />
        ))}
      </svg>
      <div className="trend-legend">
        <span>{data[0].percentage}% (oldest)</span>
        <span>{data[data.length - 1].percentage}% (latest)</span>
      </div>
    </div>
  )
}
