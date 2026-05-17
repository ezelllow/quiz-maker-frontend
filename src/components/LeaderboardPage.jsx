import React, { useState, useMemo } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'

// LeaderboardPage — frontend-only stub mirroring QuizQuest's renderLeaderboard.
// Backend hookup deferred. Data is mocked here so the page is interactive but
// nothing real is displayed yet — make that explicit at the bottom.
const MOCK_USERS = [
  { name: 'Jia En',    avatar: '🦊', xp: 4820, daily: 8, weekly: 56, alltime: 4820 },
  { name: 'Marcus',    avatar: '🐯', xp: 4310, daily: 7, weekly: 49, alltime: 4310 },
  { name: 'Priya',     avatar: '🐼', xp: 4055, daily: 6, weekly: 45, alltime: 4055 },
  { name: 'Aaron',     avatar: '🦁', xp: 3720, daily: 5, weekly: 41, alltime: 3720 },
  { name: 'Mei Ling',  avatar: '🐰', xp: 3290, daily: 4, weekly: 38, alltime: 3290 },
  { name: 'Daniel',    avatar: '🐨', xp: 2980, daily: 3, weekly: 33, alltime: 2980 },
  { name: 'Hui Min',   avatar: '🦉', xp: 2440, daily: 3, weekly: 27, alltime: 2440 },
  { name: 'Ryan',      avatar: '🐲', xp: 2100, daily: 2, weekly: 22, alltime: 2100 },
  { name: 'Sofia',     avatar: '🐸', xp: 1830, daily: 2, weekly: 18, alltime: 1830 },
  { name: 'Wei Jian',  avatar: '🦄', xp: 1605, daily: 1, weekly: 14, alltime: 1605 },
]

const TABS = [
  { id: 'daily',   label: 'Daily'    },
  { id: 'weekly',  label: 'Weekly'   },
  { id: 'alltime', label: 'All-time' },
]

export default function LeaderboardPage({ user }) {
  const [period, setPeriod] = useState('weekly')

  // Insert current user with a mid-pack mock score, then sort by the period metric.
  const board = useMemo(() => {
    const me = {
      name: (user?.name || 'You').trim(),
      avatar: (user?.name || 'Y').trim().charAt(0).toUpperCase(),
      avatarImg: user?.avatar_url || null,
      isMe: true,
      xp: 2650,
      daily: 3,
      weekly: 30,
      alltime: 2650,
    }
    const all = [...MOCK_USERS.map((u) => ({ ...u })), me]
    all.sort((a, b) => (b[period] ?? b.xp) - (a[period] ?? a.xp))
    return all
  }, [period, user])

  const myIdx = board.findIndex((p) => p.isMe)
  const periodLabel = period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'overall'
  const metricLabel = period === 'daily' ? 'correct today' : period === 'weekly' ? 'this week' : 'XP'
  const metricFor = (p) => p[period] ?? p.xp

  // Top 3 positions for the podium, ordered as 2nd / 1st / 3rd (1st rises in the middle)
  const podiumIdx = [1, 0, 2]
  const heights   = { 0: 100, 1: 76, 2: 56 }
  const colors    = { 0: '#ffc800', 1: '#c0c0c0', 2: '#cd7f32' }

  return (
    <Screen width="default">
      <header className="mb-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Leaderboard</div>
        <h1 className="!text-2xl !font-black tracking-tight">Who's grinding today?</h1>
      </header>

      {/* Period tabs */}
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

      {/* Podium — top 3 */}
      <div className="flex items-end gap-2 justify-center py-2 mb-4">
        {podiumIdx.map((i) => {
          const p = board[i]
          if (!p) return <div key={i} className="flex-1" />
          const rank = i + 1
          return (
            <div key={i} className="flex-1 flex flex-col items-center min-w-0">
              <div className={'text-3xl mb-1 ' + (rank === 1 ? 'animate-bounce' : '')}>
                {typeof p.avatar === 'string' && p.avatar.length > 1
                  ? <span className="inline-block">{p.avatar}</span>
                  : p.avatarImg
                    ? <img src={p.avatarImg} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-quiz-border-bright" />
                    : <span>{p.avatar}</span>}
              </div>
              <div className="text-xs font-black truncate w-full text-center text-white">
                {p.name}{p.isMe ? ' (You)' : ''}
              </div>
              <div className="text-[10px] font-bold text-quiz-muted">
                {metricFor(p)} {period === 'alltime' ? 'XP' : ''}
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
      <Card variant="solid" className="!p-0 overflow-hidden mb-4">
        {board.slice(3).map((p, i) => {
          const rank = i + 4
          return (
            <div
              key={p.name + i}
              className={[
                'flex items-center gap-3 p-3',
                i > 0 ? 'border-t border-quiz-border/60' : '',
                p.isMe ? 'bg-quiz-blue/15' : '',
              ].join(' ')}
            >
              <div className="w-7 text-center font-black text-quiz-muted">{rank}</div>
              <div className="text-2xl shrink-0">
                {p.avatarImg
                  ? <img src={p.avatarImg} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-quiz-border-bright" />
                  : (typeof p.avatar === 'string' && p.avatar.length > 1
                    ? p.avatar
                    : <span className="inline-flex w-8 h-8 rounded-full bg-gradient-to-br from-quiz-blue to-quiz-purple text-white font-black items-center justify-center text-sm">{p.avatar}</span>)}
              </div>
              <div className={'flex-1 font-black truncate ' + (p.isMe ? 'text-quiz-blue' : '')}>
                {p.name}{p.isMe ? ' (You)' : ''}
              </div>
              <div className="text-sm font-black text-quiz-muted shrink-0">
                {metricFor(p)} {period === 'alltime' ? 'XP' : period === 'daily' ? '✓' : ''}
              </div>
            </div>
          )
        })}
      </Card>

      <div className="text-center text-xs font-bold text-quiz-muted mb-3">
        You're #{myIdx + 1} {periodLabel}
      </div>

      {/* Honest mock-data note */}
      <Card variant="glass" className="!p-3 text-center">
        <p className="text-xs text-quiz-muted leading-relaxed">
          ⚠️ Mocked data. Backend leaderboard (real XP, real users) lands next session.
        </p>
      </Card>
    </Screen>
  )
}
