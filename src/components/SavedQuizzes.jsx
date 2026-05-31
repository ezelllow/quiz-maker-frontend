import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function SavedQuizzes({ authToken, onRetake }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/history?saved_only=true`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error('Failed to load saved quizzes'); return r.json() })
      .then((d) => { setQuizzes(d.attempts || []); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [token])

  const handleRetake = (q) => {
    if (onRetake) onRetake({
      id: q.id, subtopic: q.subtopic, difficulty: q.difficulty,
      count: q.total_questions, isRetake: true,
    })
  }

  const formatDate = (s) => {
    const d = new Date(s)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const Header = () => (
    <header className="mb-6">
      <h1 className="!text-3xl !font-black tracking-tight mb-1">💾 Saved Quizzes</h1>
      <p className="text-quiz-muted font-semibold">Quizzes you can retake</p>
    </header>
  )

  if (loading) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading saved quizzes…</Card>
    </Screen>
  )
  if (error) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card>
    </Screen>
  )
  if (quizzes.length === 0) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-12 text-center">
        <div className="text-6xl mb-3">📝</div>
        <p className="text-quiz-muted font-bold">No saved quizzes yet. Create a Practice quiz to get started!</p>
      </Card>
    </Screen>
  )

  return (
    <Screen width="default">
      <Header />
      <div className="space-y-3">
        {quizzes.map((q) => (
          <Card key={q.id} variant="solid" className="!p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg mb-1.5 truncate">{q.name || `Quiz #${q.id}`}</div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-quiz-muted">
                {q.subtopic    && <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">📚 {q.subtopic}</span>}
                {q.difficulty  && <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">⭐ {q.difficulty}</span>}
                <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">❓ {q.total_questions} questions</span>
                <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">
                  🎯 {q.attempt_count || 1} attempt{(q.attempt_count || 1) === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-xs text-quiz-muted mt-2">📅 Created {formatDate(q.attempted_at)}</div>
            </div>
            <Button3d variant="blue" size="md" onClick={() => handleRetake(q)} className="shrink-0">
              🔄 Retake
            </Button3d>
          </Card>
        ))}
      </div>
    </Screen>
  )
}
