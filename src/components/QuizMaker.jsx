import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import StreakCelebration from './StreakCelebration'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  const m = s.match(/^([A-Da-d])[\.\)\s:\-]?/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

export default function QuizMaker({ authToken, retakeAttempt, onRetakeClear, mode = 'daily', initialSubject, onBackToHub }) {
  const isPractice = mode === 'practice'
  const token = authToken || localStorage.getItem('auth_token')

  const [subtopics, setSubtopics]                 = useState([])
  const [difficulties, setDifficulties]           = useState([])
  const [selectedSubject, setSelectedSubject]     = useState(initialSubject || 'Physics')
  const [selectedSubtopic, setSelectedSubtopic]   = useState('')
  const [selectedSubtopics, setSelectedSubtopics] = useState([])
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium')
  const [questionCount, setQuestionCount]         = useState(10)
  const [quizName, setQuizName]                   = useState('')

  const [quiz, setQuiz]                                   = useState(null)
  const [loading, setLoading]                             = useState(false)
  const [error, setError]                                 = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex]   = useState(0)
  const [userAnswers, setUserAnswers]                     = useState({})
  const [showResults, setShowResults]                     = useState(false)
  const [quizStartTime, setQuizStartTime]                 = useState(null)
  const [submitSuccess, setSubmitSuccess]                 = useState(null)
  const [isRetaking, setIsRetaking]                       = useState(false)
  const [retakeParentId, setRetakeParentId]               = useState(null)
  const [topicsOpen, setTopicsOpen]                       = useState(false)
  const [celebrationDismissed, setCelebrationDismissed]   = useState(false)

  useEffect(() => { fetchFilters() }, [])
  useEffect(() => { if (retakeAttempt) loadRetakeQuiz() }, [retakeAttempt])

  const loadRetakeQuiz = async () => {
    try {
      setLoading(true); setError(null); setIsRetaking(true)
      const res = await fetch(`${API_BASE_URL}/api/history/${retakeAttempt.id}/quiz`,
        { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load quiz for retake')
      const data = await res.json()
      const questionsData = data.questions
      if (!questionsData || questionsData.length === 0) throw new Error('No questions found for this attempt')
      setQuiz({
        questions: questionsData.map((q) => ({
          ...q,
          answer:         q.answer || q.correct_answer || '',
          correct_answer: q.correct_answer || q.answer || '',
        })),
      })
      setSelectedSubtopic(retakeAttempt.subtopic)
      setSelectedDifficulty(retakeAttempt.difficulty)
      setQuestionCount(retakeAttempt.count)
      setRetakeParentId(retakeAttempt.id)
      setCurrentQuestionIndex(0); setUserAnswers({}); setShowResults(false)
      setQuizStartTime(Date.now()); setSubmitSuccess(null)
      if (onRetakeClear) onRetakeClear()
    } catch (err) {
      setError(`Error loading quiz for retake: ${err.message}`)
      setIsRetaking(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      const [subRes, difRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subtopics`),
        fetch(`${API_BASE_URL}/api/difficulties`),
      ])
      if (!subRes.ok || !difRes.ok) throw new Error('Failed to fetch filters')
      setSubtopics(await subRes.json())
      setDifficulties(await difRes.json())
    } catch (err) {
      setError(`Error loading filters: ${err.message}`)
    }
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault(); setError(null)
    if (!token) { setError('Error: No authorization token found. Please log in again.'); return }
    const count = parseInt(questionCount, 10) || 0
    const topics = selectedSubtopics.filter(Boolean)
    if (topics.length < 1) {
      setError('Pick at least 1 topic.')
      setTopicsOpen(true)
      return
    }
    if (!selectedDifficulty) {
      setError('Pick a difficulty.')
      return
    }
    if (topics.length > count) {
      setError(`You picked ${topics.length} topics but only ${count} question${count === 1 ? '' : 's'}. Reduce topics or increase question count.`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject:    selectedSubject || 'Physics',
          difficulty: selectedDifficulty || null,
          subtopics:  topics.length > 0 ? topics : null,
          subtopic:   topics[0] || null,
          count,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed to create quiz') }
      const quizData = await res.json()
      setQuiz(quizData)
      setCurrentQuestionIndex(0); setUserAnswers({}); setShowResults(false)
      setQuizStartTime(Date.now()); setSubmitSuccess(null)
    } catch (err) {
      setError(`Error creating quiz: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuiz = async () => {
    const unanswered = quiz.questions.map((_, idx) => idx)
      .filter((idx) => userAnswers[idx] === undefined || userAnswers[idx] === null || userAnswers[idx] === '')
    if (unanswered.length > 0) {
      setError(`Please answer all questions before submitting. Unanswered: Q${unanswered.map((i) => i + 1).join(', ')}`)
      setCurrentQuestionIndex(unanswered[0])
      return
    }
    setError(null); setLoading(true)
    try {
      let correctCount = 0
      quiz.questions.forEach((question, idx) => {
        if (answerKey(userAnswers[idx]) && answerKey(userAnswers[idx]) === answerKey(question.answer)) correctCount++
      })
      const percentage = Math.round((correctCount / quiz.questions.length) * 100)
      const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000)
      const res = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          difficulty: selectedDifficulty || null,
          subtopic:   selectedSubtopics.filter(Boolean).length > 0
            ? selectedSubtopics.filter(Boolean).join(' · ')
            : (selectedSubtopic || null),
          count:              quiz.questions.length,
          time_spent_seconds: timeSpent,
          user_answers:       userAnswers,
          score:              correctCount,
          percentage,
          parent_attempt_id:  (isRetaking && retakeParentId) || null,
          name:               !isRetaking ? (quizName.trim() || null) : null,
          questions:          quiz.questions.map((q, idx) => ({ ...q, index: idx })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save quiz results')
      const d = await res.json()
      setCelebrationDismissed(false)
      setShowResults({
        correctCount, percentage, attemptId: d.attempt_id,
        dailyProgress: d.daily_progress || null,
        streakAwarded: d.daily_progress?.streak_awarded === true,
        freezeUsed: d.daily_progress?.freeze_used === true,
      })
      setSubmitSuccess(`Quiz saved! You scored ${correctCount}/${quiz.questions.length} (${percentage}%)`)
    } catch (err) {
      setError(`Error submitting quiz: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRetakeQuizClick = () => {
    setQuiz(null); setCurrentQuestionIndex(0); setUserAnswers({}); setShowResults(false)
    setError(null); setSubmitSuccess(null); setIsRetaking(false); setRetakeParentId(null)
    if (onRetakeClear) onRetakeClear()
  }

  const inputCls =
    'w-full rounded-2xl bg-[#1a1a35] border-2 border-quiz-border px-4 py-3 text-base ' +
    'text-quiz-text placeholder:text-quiz-muted focus:outline-none focus:border-quiz-blue ' +
    'focus:ring-2 focus:ring-quiz-blue/40 transition-colors disabled:opacity-60'

  // ===== CREATE FORM (QuizQuest renderQuizSetup pattern) =====
  if (!quiz) {
    const MAX_TOPICS = 5
    const topicsSelected = selectedSubtopics.filter(Boolean)
    const topicCount = topicsSelected.length
    const toggleTopic = (sub) => {
      if (topicsSelected.includes(sub)) {
        setSelectedSubtopics(topicsSelected.filter((s) => s !== sub))
      } else if (topicCount < MAX_TOPICS) {
        setSelectedSubtopics([...topicsSelected, sub])
      }
    }

    // Forced Easy / Medium / Hard order with XP multiplier badges. Match the
    // backend's spelling case-insensitively so we submit what /api/difficulties recognises.
    const normKey = (d) => {
      const k = String(d).toLowerCase()
      if (k.startsWith('eas')) return 'easy'
      if (k.startsWith('med')) return 'medium'
      if (k.startsWith('har')) return 'hard'
      return null
    }
    const findDiff = (key) => difficulties.find((d) => normKey(d) === key) || null
    const diffSlots = [
      { key: 'easy',   id: findDiff('easy')   || 'Easy',   label: 'Easy',   emoji: '🌱', mult: '×0.5', ring: 'border-quiz-green  bg-quiz-green/15' },
      { key: 'medium', id: findDiff('medium') || 'Medium', label: 'Medium', emoji: '🔥', mult: '×1.5', ring: 'border-quiz-orange bg-quiz-orange/15' },
      { key: 'hard',   id: findDiff('hard')   || 'Hard',   label: 'Hard',   emoji: '💀', mult: '×2',   ring: 'border-quiz-red    bg-quiz-red/15' },
    ]

    const countOptions = [10, 15, 20]

    const selBtn = (active) =>
      'p-3 rounded-2xl border-2 font-black transition-all text-left ' +
      (active
        ? 'border-quiz-blue bg-quiz-blue/15 text-white shadow-lg scale-[1.02]'
        : 'border-quiz-border bg-[#1a1a35] text-quiz-text hover:border-quiz-blue/60 hover:bg-white/5')

    const nameInputCls =
      'w-full rounded-2xl bg-[#1a1a35] border-2 border-quiz-border px-4 py-3 text-base ' +
      'text-quiz-text placeholder:text-quiz-muted focus:outline-none focus:border-quiz-blue ' +
      'focus:ring-2 focus:ring-quiz-blue/40 transition-colors'

    return (
      <Screen width="default">
        <header className="mb-6">
          {onBackToHub && (
            <button
              type="button"
              onClick={onBackToHub}
              className="text-xs font-bold text-quiz-muted hover:text-quiz-blue mb-2 inline-flex items-center gap-1"
            >
              ← Back to subjects
            </button>
          )}
          <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">
            {selectedSubject} · {isPractice ? 'Practice' : 'Daily Challenge'}
          </div>
          <h1 className="!text-3xl !font-black tracking-tight">
            {isPractice ? 'New practice quiz' : "Build today's quiz"}
          </h1>
          <p className="text-quiz-muted font-semibold mt-1 text-sm">
            {isPractice
              ? 'Drill anything you want. Correct answers still count toward your daily streak.'
              : 'Hit 10 correct today to earn the streak — correct answers stack across attempts.'}
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-bold mb-4">
            {error}
          </div>
        )}
        {submitSuccess && (
          <div className="rounded-2xl border-2 border-quiz-green/50 bg-quiz-green/15 text-quiz-green px-4 py-3 text-sm font-bold mb-4">
            ✅ {submitSuccess}
          </div>
        )}

        <form onSubmit={handleCreateQuiz} className="space-y-6">
          {/* Topics — collapsible. Selected chips stay visible. */}
          <div className="qq-card-solid !p-3">
            <button
              type="button"
              onClick={() => setTopicsOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-2 py-2"
            >
              <div className="text-left">
                <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Topics</div>
                <div className="text-sm font-bold mt-0.5">
                  {topicCount === 0
                    ? <span className="text-quiz-red">Pick 1 to {MAX_TOPICS}</span>
                    : <span>{topicCount} / {MAX_TOPICS} picked</span>}
                </div>
              </div>
              <span className={'text-xl text-quiz-muted transition-transform ' + (topicsOpen ? 'rotate-180' : '')}>▾</span>
            </button>

            {topicCount > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {topicsSelected.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleTopic(sub)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                               bg-quiz-blue/20 border border-quiz-blue/40 text-quiz-blue hover:bg-quiz-blue/30"
                    title="Remove"
                  >
                    {sub} <span className="opacity-70">×</span>
                  </button>
                ))}
              </div>
            )}

            {topicsOpen && (
              <div className="flex flex-wrap gap-1.5 mt-2 px-1 pb-1">
                {subtopics.map((sub) => {
                  const isSelected = topicsSelected.includes(sub)
                  const isMaxed = !isSelected && topicCount >= MAX_TOPICS
                  return (
                    <button
                      key={sub}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => toggleTopic(sub)}
                      className={
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ' +
                        (isSelected
                          ? 'bg-quiz-blue/25 border-quiz-blue text-white'
                          : 'bg-[#1a1a35] border-quiz-border text-quiz-text hover:border-quiz-blue/60') +
                        (isMaxed ? ' opacity-40 cursor-not-allowed' : '')
                      }
                    >
                      {sub}{isSelected && ' ✓'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Difficulty — Easy / Medium / Hard with XP multipliers */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Difficulty</div>
              <div className="text-[10px] font-bold text-quiz-muted">XP multiplier</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {diffSlots.map((d) => {
                const active = String(selectedDifficulty).toLowerCase() === String(d.id).toLowerCase()
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDifficulty(d.id)}
                    className={
                      'p-3 rounded-2xl border-2 font-black transition-all text-center ' +
                      (active
                        ? d.ring + ' text-white shadow-lg scale-[1.03]'
                        : 'border-quiz-border bg-[#1a1a35] text-quiz-text hover:border-quiz-blue/60 hover:bg-white/5')
                    }
                  >
                    <div className="text-2xl">{d.emoji}</div>
                    <div className="text-xs mt-1">{d.label}</div>
                    <div className="text-[11px] mt-0.5 font-black text-quiz-yellow">{d.mult}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question count — 10 / 15 / 20 */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">How many questions?</div>
            <div className="grid grid-cols-3 gap-2">
              {countOptions.map((c) => {
                const active = Number(questionCount) === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQuestionCount(c)}
                    className={selBtn(active) + ' text-center text-xl'}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional quiz name */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">
              Name <span className="font-bold text-quiz-muted normal-case tracking-normal">(optional)</span>
            </div>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="e.g. Electricity drill #1"
              maxLength={120}
              className={nameInputCls}
            />
          </div>

          <Button3d type="submit" variant="green" size="lg" full disabled={loading}>
            {loading ? '⏳ Starting practice set...' : "🚀 Let's go!"}
          </Button3d>
        </form>
      </Screen>
    )
  }

  // ===== RESULTS =====
  if (showResults) {
    const { correctCount, percentage, dailyProgress: dp, streakAwarded, freezeUsed } = showResults
    const showCelebration = streakAwarded && !celebrationDismissed && dp?.current_streak
    const pctCls = percentage >= 80 ? 'text-quiz-green' : percentage >= 50 ? 'text-quiz-yellow' : 'text-quiz-red'
    const target = dp?.target ?? 10
    const todayCorrect = dp?.today_correct ?? correctCount
    const passedToday = dp?.passed_today ?? false
    const progressPct = Math.min(100, Math.round((todayCorrect / target) * 100))
    return (
      <>
        {showCelebration && (
          <StreakCelebration
            streak={dp.current_streak}
            longest={dp.longest_streak}
            freezeUsed={freezeUsed}
            onDismiss={() => setCelebrationDismissed(true)}
          />
        )}
      <Screen width="default" className="py-8">
        <Card variant="solid" className="!p-8 text-center mb-4">
          <h2 className="!text-2xl !font-black mb-5">📊 Quiz Results</h2>
          <div className="mx-auto mb-4 w-36 h-36 rounded-full flex flex-col items-center justify-center
                          bg-gradient-to-br from-quiz-blue/20 to-quiz-purple/20 border-4 border-quiz-blue/40 shadow-xl">
            <div className={'text-5xl font-black ' + pctCls}>{percentage}%</div>
            <div className="text-xs font-bold text-quiz-muted uppercase tracking-widest mt-1">Score</div>
          </div>
          <p className="text-quiz-text mb-2">
            You got <strong>{correctCount}</strong> out of <strong>{quiz.questions.length}</strong> questions correct!
          </p>
        </Card>

        {/* Daily progress + streak award */}
        {dp && (
          <Card variant="solid" className="!p-5 mb-4">
            {streakAwarded ? (
              <div className="text-center">
                <div className="text-5xl mb-2">🎉</div>
                <div className="text-xl font-black text-quiz-yellow mb-1">Streak earned!</div>
                <p className="text-quiz-muted text-sm">
                  You hit {target} correct today. Come back tomorrow to keep it alive.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Today's progress</div>
                  <div className="text-sm font-black">
                    {passedToday ? '✅ ' : ''}{todayCorrect} / {target} correct
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                  <div
                    className={'h-full transition-all duration-500 ' +
                      (passedToday
                        ? 'bg-quiz-yellow'
                        : 'bg-gradient-to-r from-quiz-orange to-quiz-yellow')}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {passedToday ? (
                  <p className="text-quiz-muted text-sm">
                    Today's streak is safe. Anything extra is bonus practice.
                  </p>
                ) : (
                  <p className="text-quiz-muted text-sm">
                    {target - todayCorrect} correct to go. Correct answers stack — keep at it.
                  </p>
                )}
              </>
            )}
          </Card>
        )}

        <Button3d variant="green" size="lg" full onClick={handleRetakeQuizClick}>
          🔄 Take another
        </Button3d>
        {onBackToHub && (
          <Button3d variant="white" size="md" full onClick={onBackToHub} className="mt-2">
            ← Back to subjects
          </Button3d>
        )}
      </Screen>
      </>
    )
  }

  // ===== QUIZ TAKING =====
  const q = quiz.questions[currentQuestionIndex]
  const total = quiz.questions.length
  const isLast = currentQuestionIndex === total - 1
  const setAnswer = (val) => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: val })

  const answeredCount = quiz.questions.filter((_, i) => {
    const a = userAnswers[i]; return a !== undefined && a !== null && a !== ''
  }).length
  const allAnswered = answeredCount === total

  const rawHeaders = q.table_headers || []
  const flatHeaders = Array.isArray(rawHeaders[0]) ? rawHeaders[rawHeaders.length - 1] : rawHeaders

  const optionCls = (selected) => [
    'flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all',
    selected
      ? 'bg-quiz-blue/20 border-quiz-blue text-white shadow-lg scale-[1.01]'
      : 'bg-[#1a1a35] border-quiz-border hover:border-quiz-blue/60 hover:bg-white/5',
  ].join(' ')

  return (
    <Screen width="default" className="py-8">
      <Card variant="solid" className="!p-6 sm:!p-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full bg-quiz-green/20 border border-quiz-green/40 text-quiz-green text-xs font-bold">
            Practice · {selectedSubject}
          </span>
          <span className="text-sm font-bold text-quiz-muted">Question {currentQuestionIndex + 1} of {total}</span>
        </div>

        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-quiz-green via-quiz-cyan to-quiz-blue transition-all duration-300"
               style={{ width: `${((currentQuestionIndex + 1) / total) * 100}%` }} />
        </div>

        {error && (
          <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-bold">
            {error}
          </div>
        )}

        <h2 className="!text-xl !font-black leading-snug">{q.question_text}</h2>

        {q.setup_image_url && (
          <div className="rounded-2xl overflow-hidden border border-quiz-border bg-black/30">
            <img src={q.setup_image_url} alt="Question diagram" className="w-full max-h-80 object-contain"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        {q.option_type === 'IMAGE' && q.image_url && q.image_url !== q.setup_image_url && (
          <div className="rounded-2xl overflow-hidden border border-quiz-border bg-black/30">
            <img src={q.image_url} alt="Answer options" className="w-full max-h-80 object-contain"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        {q.option_type !== 'IMAGE' && !q.setup_image_url && q.image_url && (
          <div className="rounded-2xl overflow-hidden border border-quiz-border bg-black/30">
            <img src={q.image_url} alt="Question" className="w-full max-h-80 object-contain"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}

        {q.option_type === 'TABLE' && Array.isArray(q.table_rows) ? (
          <div className="overflow-x-auto rounded-2xl border border-quiz-border">
            <table className="w-full text-sm">
              {flatHeaders.length > 0 && (
                <thead><tr className="bg-white/5">
                  {flatHeaders.map((h, i) => <th key={i} className="px-3 py-2 text-left font-bold text-quiz-muted">{h}</th>)}
                  <th className="px-3 py-2 w-16 text-center font-bold text-quiz-muted">Pick</th>
                </tr></thead>
              )}
              <tbody>
                {q.table_rows.map((row, rIdx) => {
                  const letter = (row && typeof row === 'object' ? row._letter : null)
                    || String.fromCharCode(65 + rIdx)
                  const selected = userAnswers[currentQuestionIndex] === letter
                  return (
                    <tr key={rIdx} onClick={() => setAnswer(letter)}
                        className={'cursor-pointer transition-colors ' + (selected ? 'bg-quiz-blue/20' : 'hover:bg-white/5')}>
                      {flatHeaders.map((h, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-t border-quiz-border">
                          {row && typeof row === 'object' ? (row[h] ?? '') : ''}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center border-t border-quiz-border">
                        <input type="radio" checked={selected} onChange={() => setAnswer(letter)} className="accent-quiz-blue" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : q.option_type === 'IMAGE' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const selected = userAnswers[currentQuestionIndex] === letter
              return (
                <label key={letter} className={optionCls(selected) + ' justify-center'}>
                  <input type="radio" checked={selected} onChange={() => setAnswer(letter)} className="sr-only" />
                  <span className="text-2xl font-black">{letter}</span>
                </label>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {q.options && String(q.options).split('\n').map((opt, i) => {
              const t = opt.trim(); if (!t) return null
              const selected = userAnswers[currentQuestionIndex] === t
              return (
                <label key={i} className={optionCls(selected)}>
                  <input type="radio" checked={selected} onChange={() => setAnswer(t)} className="sr-only" />
                  <span className="font-semibold">{t}</span>
                </label>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button3d
            variant={currentQuestionIndex === 0 ? 'disabled' : 'white'}
            size="md"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </Button3d>
          <span className="text-sm font-bold text-quiz-muted order-3 sm:order-2 w-full sm:w-auto text-center">
            {answeredCount}/{total} answered
          </span>
          {isLast ? (
            <Button3d
              variant={allAnswered ? 'green' : 'disabled'}
              size="md"
              onClick={handleSubmitQuiz}
              disabled={loading || !allAnswered}
              title={!allAnswered ? `${total - answeredCount} unanswered — please answer all` : ''}
              className="order-2 sm:order-3"
            >
              {loading ? '⏳ Submitting…' : allAnswered ? '✅ Submit Practice Quiz' : `⚠️ ${total - answeredCount} unanswered`}
            </Button3d>
          ) : (
            <Button3d
              variant="blue"
              size="md"
              onClick={() => setCurrentQuestionIndex(Math.min(total - 1, currentQuestionIndex + 1))}
              className="order-2 sm:order-3"
            >
              Next →
            </Button3d>
          )}
        </div>
      </Card>
    </Screen>
  )
}
