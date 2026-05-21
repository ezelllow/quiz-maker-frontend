import React, { useEffect, useMemo, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const TABS = [
  { id: 'daily',   label: 'Daily'    },
  { id: 'weekly',  label: 'Weekly'   },
  { id: 'alltime', label: 'All-time' },
]

// All three boards now rank by XP: daily = XP earned today, weekly = XP this
// week, all-time = lifetime users.xp.
const METRIC_SUFFIX = { daily: 'XP', weekly: 'XP', alltime: 'XP' }
const PERIOD_LABEL  = { daily: 'today', weekly: 'this week', alltime: 'overall' }

export default function LeaderboardPage({ user, authToken, progression }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [period, setPeriod] = useState('weekly')
  const [entries, setEntries] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)  // Date — for 'last updated' indicator
  const [bumpKey, setBumpKey] = useState(0)             // increment to force a refetch

  // Refetch on: period change, manual bump, OR the current user's XP changing.
  // The XP dep makes the leaderboard auto-update right after a quiz / test grant
  // for the current player. Other players' changes are picked up via the
  // refresh button or by re-navigating into the page.
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    fetch(`${API_BASE_URL}/api/leaderboard?period=${period}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed to load leaderboard'); return r.json() })
      .then((d) => {
        if (cancelled) return
        setEntries(d.entries || [])
        setTotalUsers(d.total_users || 0)
        setLastFetched(new Date())
        setLoading(false)
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [period, token, bumpKey, progression?.xp])

  // Find me in the slice the API gave us. Use the explicit is_me flag — it's
  // user_id-matched on the backend so it's authoritative even across renames.
  const myEntry = useMemo(() => entries.find((p) => p.is_me) || null, [entries])
  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  // Podium order: 2nd / 1st / 3rd (1st rises in the middle)
  const podiumOrder = [1, 0, 2]
  const heights = { 0: 100, 1: 76, 2: 56 }
  const colors  = { 0: '#ffc800', 1: '#c0c0c0', 2: '#cd7f32' }

  const initialOf = (name) =>
    (name || 'U').trim().charAt(0).toUpperCase() || 'U'

  const Avatar = ({ p, size = 'md' }) => {
    const px = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'
    if (p.avatar_url) {
      return <img src={p.avatar_url} alt="" className={`${px} rounded-full object-cover ring-2 ring-quiz-border-bright`} />
    }
    return (
      <span className={`${px} inline-flex rounded-full bg-gradient-to-br from-quiz-blue to-quiz-purple text-white font-black items-center justify-center text-sm`}>
        {initialOf(p.name)}
      </span>
    )
  }

  const fmtAgo = (d) => {
    if (!d) return ''
    const s = Math.round((Date.now() - d.getTime()) / 1000)
    if (s < 5)  return 'just now'
    if (s < 60) return `${s}s ago`
    const m = Math.round(s / 60)
    if (m < 60) return `${m} min ago`
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const Header = () => (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Leaderboard</div>
        <h1 className="!text-2xl !font-black tracking-tight">Who's grinding today?</h1>
        {lastFetched && (
          <div className="text-[10px] font-bold text-quiz-muted mt-0.5">
            Updated {fmtAgo(lastFetched)}
          </div>
        )}
      </div>
      <button
        onClick={() => setBumpKey((k) => k + 1)}
        disabled={loading}
        title="Refresh"
        className="shrink-0 px-3 py-2 rounded-full text-xs font-black
                   bg-white/5 border border-quiz-border
                   hover:bg-white/10 disabled:opacity-50 transition-colors"
      >
        {loading ? '…' : '🔄'}
      </button>
    </header>
  )

  const Tabs = () => (
    <div className="grid grid-cols-3 qq-card-solid !p-1 mb-4">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setPeriod(t.id)}
          className={[
            'py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
            period === t.id
              ? 'bg-gradient-to-r from-quiz-blue/30 to-quiz-purple/30 text-white shadow-md'
              : 'text-quiz-muted hover:text-white',
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <Screen width="default"><Header /><Tabs />
      <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading leaderboard…</Card>
    </Screen>
  )

  if (error) return (
    <Screen width="default"><Header /><Tabs />
      <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card>
    </Screen>
  )

  if (entries.length === 0) return (
    <Screen width="default"><Header /><Tabs />
      <Card variant="solid" className="!p-12 text-center">
        <div className="text-6xl mb-3">🏆</div>
        <p className="text-quiz-muted font-bold">
          No scores {PERIOD_LABEL[period]} yet. Be the first — knock out today's daily.
        </p>
      </Card>
    </Screen>
  )

  return (
    <Screen width="default">
      <Header />
      <Tabs />

      {/* Podium — top 3. Empty slots stay reserved so the layout doesn't shift. */}
      <div className="flex items-end gap-2 justify-center py-2 mb-4">
        {podiumOrder.map((i) => {
          const p = top3[i]
          if (!p) return <div key={i} className="flex-1" />
          const rank = i + 1
          return (
            <div key={p.user_id} className="flex-1 flex flex-col items-center min-w-0">
              <div className={'mb-1 ' + (rank === 1 ? 'animate-bounce' : '')}>
                <Avatar p={p} size="lg" />
              </div>
              <div className="text-xs font-black truncate w-full text-center text-white">
                {p.name}{p.is_me ? ' (You)' : ''}
              </div>
              <div className="text-[10px] font-bold text-quiz-muted">
                {p.score} {METRIC_SUFFIX[period]}
              </div>
              <div
                className="w-full rounded-t-xl mt-1 flex items-center justify-center font-black text-white"
                style={{ height: heights[rank - 1], background: colors[rank - 1] }}
              >
                {rank}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rest of the list */}
      {rest.length > 0 && (
        <Card variant="solid" className="!p-0 overflow-hidden mb-4">
          {rest.map((p, i) => (
            <div
              key={p.user_id}
              className={[
                'flex items-center gap-3 p-3',
                i > 0 ? 'border-t border-quiz-border/60' : '',
                p.is_me ? 'bg-quiz-blue/15' : '',
              ].join(' ')}
            >
              <div className="w-7 text-center font-black text-quiz-muted">{p.rank}</div>
              <div className="shrink-0"><Avatar p={p} /></div>
              <div className={'flex-1 font-black truncate flex items-center gap-1.5 ' + (p.is_me ? 'text-quiz-blue' : '')}>
                <span className="truncate">{p.name}{p.is_me ? ' (You)' : ''}</span>
                {p.level != null && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase
                                   tracking-widest bg-quiz-purple/15 border border-quiz-purple/30 text-quiz-purple">
                    Lv {p.level}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-quiz-muted shrink-0">
                {p.score} {METRIC_SUFFIX[period]}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="text-center text-xs font-bold text-quiz-muted">
        {myEntry
          ? <>You're #{myEntry.rank} {PERIOD_LABEL[period]} · {totalUsers} player{totalUsers === 1 ? '' : 's'} total</>
          : <>{totalUsers} player{totalUsers === 1 ? '' : 's'} total</>}
      </div>
    </Screen>
  )
}
