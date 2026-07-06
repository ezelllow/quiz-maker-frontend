import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import StreakCelebration from './StreakCelebration'
import RankUpOverlay from './RankUpOverlay'
import { correctPop, wrongShake, optionTap, questionEnter } from '../motion'
import MathText from './ui/MathText'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  const m = s.match(/^([A-Da-d])[\.\)\s:\-]?/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

// Easy -> Medium -> Hard scale used for difficulty-availability checks.
const DIFF_ORDER = ['easy', 'medium', 'hard']
// The backend builds a quiz from at most 3 picked topics.
const MAX_QUIZ_TOPICS = 3

// ── Official SEAB syllabus orderings ───────────────────────────────────
// Two maps, one per physics level. Topic names from the backend get
// matched against these regexes — anything that doesn't match a pattern
// is FILTERED OUT of the picker entirely (not just sorted to the bottom),
// so the dropdown only ever shows officially-listed syllabus topics.
//
//   SEAB_6091_ORDER  — Pure Physics (6091), 20 topics
//   SEAB_COMBINED_ORDER — Combined Sci Physics (5086/87/88), 16 topics
//
// Regexes are forgiving on wording ("Energy" vs "Work, Energy and Power",
// "DC Circuits" vs "D.C. Circuits") but strict on inclusion — a topic must
// match a syllabus entry to appear in the list.

// Pure Physics — SEAB 6091 (20 topics, in syllabus order)
const SEAB_6091_ORDER = [
  { n: 1,  test: /physical quantit/i },
  { n: 2,  test: /kinematic/i },
  { n: 3,  test: /^dynamic/i },
  { n: 4,  test: /turning effect|^moments\b/i },
  { n: 5,  test: /^pressure/i },
  { n: 6,  test: /^energy\b|work,?\s*energy/i },
  { n: 7,  test: /kinetic.*(particle|model)|particle.*model/i },
  { n: 8,  test: /thermal process|transfer of thermal/i },
  { n: 9,  test: /thermal propert/i },
  { n: 10, test: /general propert.*wave|^waves\b|properties of waves/i },
  { n: 10, test: /^sound\b/i },
  { n: 11, test: /electromagnetic spectrum|em spectrum/i },
  { n: 12, test: /^light\b/i },
  { n: 13, test: /static electric/i },
  { n: 14, test: /current.*electric/i },
  { n: 15, test: /d\.?\s*c\.?\s*circuit/i },
  { n: 16, test: /practical electric/i },
  { n: 17, test: /^magnetism\b(?!.*electromagnetism)/i },
  { n: 18, test: /^electromagnetism\b/i },
  { n: 19, test: /electromagnetic induction|em induction/i },
  { n: 20, test: /radioactiv/i },
]

// Combined Sci Physics — SEAB 5086/87/88 (16 topics, in syllabus order)
// Force and Pressure are combined; Magnetism and Electromagnetism are combined.
const SEAB_COMBINED_ORDER = [
  { n: 1,  test: /physical quantit|measurement/i },
  { n: 2,  test: /kinematic/i },
  { n: 3,  test: /force.*pressure|^pressure\b/i },
  { n: 4,  test: /^dynamic|mass.*weight.*densit|^density/i },
  { n: 5,  test: /turning effect|^moments\b/i },
  { n: 6,  test: /^energy\b|work,?\s*energy/i },
  { n: 7,  test: /kinetic.*(particle|model)|particle.*model/i },
  { n: 8,  test: /thermal/i },
  { n: 9,  test: /general.*wave|properties of waves|wave propert|^waves\b|^sound\b/i },
  { n: 10, test: /electromagnetic spectrum|em spectrum/i },
  { n: 11, test: /^light\b/i },
  { n: 12, test: /electric charge|static electric|current.*electric/i },
  { n: 13, test: /d\.?\s*c\.?\s*circuit/i },
  { n: 14, test: /practical electric/i },
  { n: 15, test: /magnetism|electromagnet/i },
  { n: 16, test: /radioactiv/i },
]

// Normal (Academic) Science Physics — SEAB 5105/06/07 (13 topics, in order).
// Like Combined G3 but WITHOUT Turning Effect of Forces, Light, and Magnetism
// & Electromagnetism.
const SEAB_NA_ORDER = [
  { n: 1,  test: /physical quantit|measurement/i },
  { n: 2,  test: /kinematic/i },
  { n: 3,  test: /force.*pressure|^pressure\b/i },
  { n: 4,  test: /^dynamic|mass.*weight.*densit|^density/i },
  { n: 5,  test: /^energy\b|work,?\s*energy/i },
  { n: 6,  test: /kinetic.*(particle|model)|particle.*model/i },
  { n: 7,  test: /thermal/i },
  { n: 8,  test: /general.*wave|properties of waves|wave propert|^waves\b|^sound\b/i },
  { n: 9,  test: /electromagnetic spectrum|em spectrum/i },
  { n: 10, test: /electric charge|static electric|current.*electric/i },
  { n: 11, test: /d\.?\s*c\.?\s*circuit/i },
  { n: 12, test: /practical electric/i },
  { n: 13, test: /radioactiv/i },
]

// Normal (Technical) Science — SEAB 5148 full syllabus (11 topics, in order):
// Physics (Machines Around Us), Chemistry (Food Matters), Biology (Our Body
// and Health). Regexes are lenient so canonicalised names still match.
const SEAB_NT_ORDER = [
  { n: 1,  test: /energy/i },
  { n: 2,  test: /electric/i },
  { n: 3,  test: /wave/i },
  { n: 4,  test: /effect.*force|^force|dynamic/i },
  { n: 5,  test: /sources? of food/i },
  { n: 6,  test: /food chemistry/i },
  { n: 7,  test: /food safety/i },
  { n: 8,  test: /staying healthy|healthy/i },
  { n: 9,  test: /digestion|digestive/i },
  { n: 10, test: /breathing|respiration/i },
  { n: 11, test: /blood circulation|circulation/i },
]

// Returns the syllabus map for the given physics level.
//   pure        -> 6091 Pure (20)
//   combinedG2  -> 5105/06/07 Normal (Academic) (13)
//   combinedG1  -> 5148 Normal (Technical) Science (11: Phys+Chem+Bio)
//   else (G3)   -> 5086/87/88 Combined (16)
function syllabusFor(levelCat) {
  if (levelCat === 'p6math') return []   // P6 Math: no topic list yet — "All topics" only
  if (levelCat === 'combinedG2') return SEAB_NA_ORDER
  if (levelCat === 'combinedG1') return SEAB_NT_ORDER
  if (levelCat && levelCat !== 'pure') return SEAB_COMBINED_ORDER
  return SEAB_6091_ORDER
}

// Short syllabus descriptor per level, shown under the subject name in the
// read-only banner.
const LEVEL_SUBTITLE = {
  pure:       'Pure · 20 topics',
  combinedG3: 'Combined · 16 topics',
  combinedG2: 'Combined · 13 topics',
  combinedG1: 'Science · 11 topics',
  p6math:     'PSLE · All topics',
}

// Position in the syllabus (1..N), or null if not in the syllabus.
function topicNumber(name, levelCat) {
  const map = syllabusFor(levelCat)
  const found = map.find((t) => t.test.test(String(name || '')))
  return found ? found.n : null
}

function diffKey(val) {
  const k = String(val ?? '').toLowerCase()
  if (k.startsWith('eas')) return 'easy'
  if (k.startsWith('med')) return 'medium'
  if (k.startsWith('har')) return 'hard'
  return null
}

// Question count for `topic` at `dk` difficulty (0 if none).
function countAt(availability, topic, dk) {
  const t = availability[topic]
  return (t && t[dk]) || 0
}

// True if the chosen topics can supply a full `count`-question quiz at `dk`.
// Mirrors the backend allocation: at most 3 topics, count split evenly so each
// topic needs ceil(count / nTopics). Empty `topics` means "all topics", where
// the whole level pool must cover count.
function difficultyAvailable(dk, topics, availability, count) {
  const allTopics = Object.keys(availability)
  if (allTopics.length === 0) return true        // availability not loaded yet
  const n = count || 0
  if (n < 1) return true                         // count not chosen yet
  const used = (topics || []).filter(Boolean).slice(0, MAX_QUIZ_TOPICS)
  if (used.length === 0) {
    const total = allTopics.reduce((sum, t) => sum + countAt(availability, t, dk), 0)
    return total >= n
  }
  const perTopic = Math.ceil(n / used.length)
  return used.every((t) => countAt(availability, t, dk) >= perTopic)
}

// Current difficulty if still valid; else the closest valid one, preferring
// the easier side on a tie. Returns null if nothing is valid.
function nearestValidDifficulty(currentDk, topics, availability, count) {
  const valid = DIFF_ORDER.filter((dk) => difficultyAvailable(dk, topics, availability, count))
  if (valid.length === 0) return null
  if (currentDk && valid.includes(currentDk)) return currentDk
  const i = DIFF_ORDER.indexOf(currentDk)
  for (let d = 1; d < DIFF_ORDER.length; d++) {
    if (i - d >= 0 && valid.includes(DIFF_ORDER[i - d])) return DIFF_ORDER[i - d]
    if (i + d < DIFF_ORDER.length && valid.includes(DIFF_ORDER[i + d])) return DIFF_ORDER[i + d]
  }
  return valid[0]
}


// QImage — diagnostic wrapper for question/diagram images. When the
// underlying <img> fails to load, we surface a visible placeholder
// that also re-fetches the URL to grab the backend's actual error
// detail (status code + JSON `detail` field), so the user can see
// "File not found" vs "Insufficient permissions" without opening
// DevTools.
function QImage({ src, alt, className = '' }) {
  const [failed, setFailed] = React.useState(false)
  const [errInfo, setErrInfo] = React.useState(null) // { status, statusText, detail }

  const onImgError = React.useCallback(async () => {
    console.warn('[QuizMaker] Image failed to load:', src)
    setFailed(true)
    // Re-fetch with fetch() so we can read the response body. <img> tags
    // don't expose status code or body — only an opaque "error" event.
    try {
      const r = await fetch(src)
      let detail = null
      try {
        const j = await r.json()
        detail = j?.detail || JSON.stringify(j)
      } catch (_) {
        try { detail = (await r.text()).slice(0, 240) } catch (_) {}
      }
      setErrInfo({ status: r.status, statusText: r.statusText, detail })
    } catch (e) {
      setErrInfo({ status: 'network', statusText: 'fetch failed', detail: String(e) })
    }
  }, [src])

  if (!src) return null
  if (failed) {
    // Extract just the file ID / filename slug from the URL for at-a-glance scanning
    const idMatch = src.match(/\/api\/image\/([^?]+)/)
    const idOrName = idMatch ? idMatch[1] : src

    // Heuristic — most common 404 cause based on status + detail
    let cause = null
    if (errInfo?.status === 404) {
      if (/permission|access/i.test(errInfo.detail || '')) {
        cause = 'Drive service account lacks permission on this file.'
      } else if (/not found|404/i.test(errInfo.detail || '')) {
        cause = 'Drive can\'t find this ID — either it\'s stale (file was deleted / re-uploaded so the ID changed) or the service account can\'t see it (file is outside the QUESTION_FOLDER_ID folder).'
      } else {
        cause = 'Backend returned 404 — likely stale Drive ID or permissions issue.'
      }
    } else if (errInfo?.status === 401) {
      cause = 'Auth token expired — log out and back in.'
    } else if (errInfo?.status === 'network') {
      cause = 'Could not reach the backend — is the server running?'
    } else if (errInfo?.status >= 500) {
      cause = 'Backend error — check the server console for the full traceback.'
    }

    return (
      <div className="rounded-2xl border-2 border-dashed border-quiz-yellow/50 bg-quiz-yellow/5 p-4 text-quiz-yellow">
        <div className="font-black text-sm flex items-center gap-2">
          <span>⚠️</span> Image failed to load
          {errInfo && (
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-md bg-quiz-yellow/15">
              HTTP {errInfo.status}
            </span>
          )}
        </div>

        <div className="text-[11px] font-bold text-quiz-muted mt-2 break-all leading-snug">
          <span className="text-quiz-yellow/80">File ID/name:</span> {idOrName}
        </div>

        {errInfo?.detail && (
          <div className="text-[11px] font-bold text-quiz-red mt-1.5 break-all leading-snug">
            <span className="text-quiz-yellow/80">Backend says:</span> {errInfo.detail}
          </div>
        )}

        {cause && (
          <div className="text-[11px] font-bold text-quiz-text mt-2 leading-relaxed bg-quiz-yellow/10 rounded-lg px-2 py-1.5">
            <span className="font-black">Likely cause: </span>{cause}
          </div>
        )}

        <details className="mt-2">
          <summary className="text-[10px] font-bold text-quiz-muted cursor-pointer hover:text-quiz-yellow">
            How to fix
          </summary>
          <div className="text-[11px] text-quiz-muted font-bold mt-1.5 leading-relaxed">
            <strong>If HTTP 404:</strong> the file is in Drive but the backend can't reach it. Either (1) the file ID stored in the database is stale — re-upload to Drive generates a NEW id; check that the DB has the current ID, or (2) the service account in <code>credentials.json</code> doesn't have read access — share the file (or the parent folder) with the service account's email. The folder being scanned is <code>QUESTION_FOLDER_ID</code> in the backend env.<br/>
            <strong>Quick test:</strong> open the full URL above in a new tab while logged in. If you see the same backend error there, the 404 is server-side. If you see a different error there, it's a frontend/auth issue.
          </div>
        </details>

        <div className="text-[10px] font-bold text-quiz-muted mt-2 break-all leading-snug opacity-60">
          {src}
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl overflow-hidden border border-quiz-border bg-white">
      <img
        src={src}
        alt={alt}
        className={'w-full max-h-48 sm:max-h-72 object-contain ' + className}
        onError={onImgError}
      />
    </div>
  )
}

export default function QuizMaker({ authToken, retakeAttempt, onRetakeClear, mode = 'daily', initialSubject, initialLevel, levelLabel, onBackToHub,
  onProgressionChange, onGemsChange, onFreezesChange, onQuizActiveChange }) {
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
  // Level is chosen on the Subjects page (Pure / Combined G1-G3) and passed in;
  // it's fixed for the lifetime of this builder. 'pure' | 'combinedG1/2/3'.
  const [levelCat, setLevelCat]                   = useState(initialLevel || 'pure')
  const [availability, setAvailability]           = useState({})      // { topic: { easy:N, medium:N, hard:N } }
  const [snapKey, setSnapKey]                     = useState(null)    // diff key just auto-snapped to

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
  // Rank-up overlay dismissal — separate from the streak celebration since
  // both can fire from the same results screen but the user dismisses them
  // independently. Reset whenever a new quiz starts.
  const [rankUpDismissed, setRankUpDismissed] = useState(false)
  // Daily mode is locked once today's goal is met. Practice stays free.
  const [dailyLocked, setDailyLocked] = useState(null)
  // Per-question flow: { [index]: true } once that question has been submitted
  // and its correct/wrong result revealed. The user must submit a question
  // before they can advance to the next one.
  const [checked, setChecked] = useState({})

  useEffect(() => { fetchFilters() }, [])
  useEffect(() => { if (retakeAttempt) loadRetakeQuiz() }, [retakeAttempt])
  // Subject (and therefore level) chosen on the Subjects page — sync it in.
  useEffect(() => {
    if (initialLevel) { setLevelCat(initialLevel); setSelectedSubtopics([]) }
  }, [initialLevel])

  // Daily-lock check: read did_today from /api/streak so we can short-circuit
  // entry into the build form once the user has already hit today's goal.
  // Practice + retakes are always allowed.
  useEffect(() => {
    if (isPractice || isRetaking || retakeAttempt) { setDailyLocked(false); return }
    let cancelled = false
    fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setDailyLocked(Boolean(d?.did_today)) })
      .catch(() => { if (!cancelled) setDailyLocked(false) })
    return () => { cancelled = true }
  }, [isPractice, isRetaking, retakeAttempt, token, showResults])

  // Report to App whether a quiz attempt is live (questions loaded, not yet on
  // the results screen) so it can confirm before the user navigates away.
  useEffect(() => {
    if (onQuizActiveChange) onQuizActiveChange(Boolean(quiz) && !showResults)
  }, [quiz, showResults])
  useEffect(() => () => { onQuizActiveChange && onQuizActiveChange(false) }, [])

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
      setCurrentQuestionIndex(0); setUserAnswers({}); setChecked({}); setShowResults(false)
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
      const difRes = await fetch(`${API_BASE_URL}/api/difficulties`)
      if (!difRes.ok) throw new Error('Failed to fetch difficulties')
      setDifficulties(await difRes.json())
    } catch (err) {
      setError(`Error loading filters: ${err.message}`)
    }
  }

  // Topics depend on the chosen physics level (pure / non-pure). Refetch
  // whenever the level changes; the list is empty until a level is picked.
  useEffect(() => {
    if (!levelCat) { setSubtopics([]); setAvailability({}); return }
    let cancelled = false
    fetch(`${API_BASE_URL}/api/subtopics?level=${levelCat}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!cancelled) setSubtopics(Array.isArray(d) ? d : []) })
      .catch(() => { if (!cancelled) setSubtopics([]) })
    fetch(`${API_BASE_URL}/api/availability?level=${levelCat}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => { if (!cancelled) setAvailability(d && typeof d === 'object' ? d : {}) })
      .catch(() => { if (!cancelled) setAvailability({}) })
    return () => { cancelled = true }
  }, [levelCat])

  // Keep the difficulty valid for the chosen topics + question count. When any
  // of those change -- or availability first loads -- snap a now-invalid
  // difficulty to the nearest valid one (easier side on a tie). Never silently
  // pushes the user to a harder difficulty than they chose.
  useEffect(() => {
    if (Object.keys(availability).length === 0) return
    const topics = selectedSubtopics.filter(Boolean)
    const count = parseInt(questionCount, 10) || 0
    const currentDk = diffKey(selectedDifficulty)
    const nearestDk = nearestValidDifficulty(currentDk, topics, availability, count)
    if (nearestDk && nearestDk !== currentDk) {
      const newId = difficulties.find((d) => diffKey(d) === nearestDk)
        || (nearestDk.charAt(0).toUpperCase() + nearestDk.slice(1))
      setSelectedDifficulty(newId)
      setSnapKey(nearestDk)
    }
  }, [selectedSubtopics, availability, difficulties, selectedDifficulty, questionCount])

  useEffect(() => {
    if (!snapKey) return
    const t = setTimeout(() => setSnapKey(null), 700)
    return () => clearTimeout(t)
  }, [snapKey])

  const handleCreateQuiz = async (e) => {
    e.preventDefault(); setError(null)
    if (!token) { setError('Error: No authorization token found. Please log in again.'); return }
    const count = parseInt(questionCount, 10) || 0
    const topics = selectedSubtopics.filter(Boolean)
    if (!levelCat) {
      setError('Choose Pure or Non-Pure Physics first.')
      return
    }
    if (count < 1) {
      setError('Choose at least 1 question.')
      return
    }
    if (!selectedDifficulty) {
      setError('Pick a difficulty.')
      return
    }
    if (Object.keys(availability).length > 0 &&
        !difficultyAvailable(diffKey(selectedDifficulty), topics, availability, count)) {
      setError('Not enough questions for that topic and difficulty. Pick another difficulty, or lower the question count.')
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
          // No subject filter — the level (pure / combinedG1-3) fully isolates
          // the question pool, and some combined rows have a blank Subject cell
          // that a 'Physics' filter would wrongly drop.
          subject:    null,
          difficulty: selectedDifficulty || null,
          subtopics:  topics.length > 0 ? topics : null,
          subtopic:   topics[0] || null,
          count,
          level:      levelCat,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed to create quiz') }
      const quizData = await res.json()
      setQuiz(quizData)
      setCurrentQuestionIndex(0); setUserAnswers({}); setChecked({}); setShowResults(false)
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
          // A retake is a re-do, never a fresh daily attempt — submit it as
          // 'practice' so it grants no XP/gems and never touches the daily quota.
          quiz_type:          (isPractice || isRetaking) ? 'practice' : 'daily',
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
        // StarQuest reward fields
        xpDelta:       d.xp_delta      ?? 0,
        xpTotal:       d.xp_total      ?? 0,
        xpBreakdown:   d.xp_breakdown  ?? null,
        gemsDelta:     d.gems_delta    ?? 0,
        gemsTotal:     d.gems_total    ?? 0,
        gemsBreakdown: d.gems_breakdown ?? null,
        rankUp:        d.rank_up === true,
        newRank:       d.new_rank      ?? null,
        progression:   d.progression   ?? null,
      })
      // Bubble fresh totals to App so navbar pills + Leaderboard refetch react.
      if (onProgressionChange && d.progression) onProgressionChange(d.progression)
      if (onGemsChange && typeof d.gems_total === 'number') onGemsChange(d.gems_total)
      setSubmitSuccess(`Quiz saved! You scored ${correctCount}/${quiz.questions.length} (${percentage}%)`)
    } catch (err) {
      setError(`Error submitting quiz: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRetakeQuizClick = () => {
    setQuiz(null); setCurrentQuestionIndex(0); setUserAnswers({}); setChecked({}); setShowResults(false)
    setError(null); setSubmitSuccess(null); setIsRetaking(false); setRetakeParentId(null)
    if (onRetakeClear) onRetakeClear()
  }

  const inputCls =
    'w-full rounded-2xl bg-white border-2 border-quiz-border px-4 py-3 text-base ' +
    'text-quiz-text placeholder:text-quiz-muted focus:outline-none focus:border-quiz-blue ' +
    'focus:ring-2 focus:ring-quiz-blue/40 transition-colors disabled:opacity-60'

  // ===== DAILY LOCKED — user already hit today's goal =====
  if (!isPractice && dailyLocked === true && !quiz && !showResults) {
    return (
      <Screen width="default" className="py-8">
        <Card variant="solid" className="!p-8 text-center border-2 border-quiz-green/50
                                        bg-gradient-to-br from-quiz-green/15 to-quiz-blue/15">
          <div className="text-6xl mb-3">✅</div>
          <h2 className="!text-2xl !font-black mb-2">Daily complete!</h2>
          <p className="text-quiz-muted text-sm leading-relaxed mb-5">
            You've hit today's goal — streak is safe. The Daily Challenge is
            locked until tomorrow. Want to keep sharpening? Switch to Practice
            (no XP or gems, just pure reps).
          </p>
          <p className="text-[11px] text-quiz-muted leading-relaxed">
            Tip: tap <strong>✏️ Practice</strong> in the bottom nav.
          </p>
        </Card>
      </Screen>
    )
  }

  // ===== CREATE FORM (QuizQuest renderQuizSetup pattern) =====
  if (!quiz) {
    const MAX_TOPICS = 3
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

    const availLoaded = Object.keys(availability).length > 0
    const quizCount = parseInt(questionCount, 10) || 0
    const validDiffCount = availLoaded
      ? DIFF_ORDER.filter((k) => difficultyAvailable(k, topicsSelected, availability, quizCount)).length
      : 3

    const countOptions = [10, 15, 20]

    const selBtn = (active) =>
      'p-3 rounded-2xl border-2 font-black transition-all text-left ' +
      (active
        ? 'border-quiz-blue bg-quiz-blue/15 text-quiz-orange-deep shadow-lg scale-[1.02]'
        : 'border-quiz-border bg-white text-quiz-text hover:border-quiz-blue/60 hover:bg-gray-50')

    const nameInputCls =
      'w-full rounded-2xl bg-white border-2 border-quiz-border px-4 py-3 text-base ' +
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
          {/* Level / subject. In practice mode it's fixed by the Subjects-page
              choice (read-only banner). In daily mode the user picks here. The
              topics list below is driven by it (Pure -> 20-topic syllabus, the
              Combined tiers -> the 16-topic Combined syllabus). */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">Subject</div>
            {initialLevel ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-quiz-blue/40 bg-quiz-blue/10">
                <div className="text-2xl leading-none">{levelCat === 'pure' ? '🧪' : '⚛️'}</div>
                <div className="min-w-0">
                  <div className="text-sm font-black leading-tight">{levelLabel || (levelCat === 'pure' ? 'Pure Physics' : 'Combined Physics')}</div>
                  <div className="text-[10px] font-bold text-quiz-muted mt-0.5 normal-case tracking-normal">
                    {LEVEL_SUBTITLE[levelCat] || 'Science'}
                  </div>
                </div>
                {onBackToHub && (
                  <button
                    type="button"
                    onClick={onBackToHub}
                    className="ml-auto text-[11px] font-black text-quiz-blue hover:underline shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pure',       emoji: '🧪', label: 'Pure Physics' },
                  { id: 'combinedG3', emoji: '⚛️', label: 'Combined G3' },
                  { id: 'combinedG2', emoji: '🔬', label: 'Combined G2' },
                  { id: 'combinedG1', emoji: '🧲', label: 'G1 Science' },
                  // 5th subject spans the bottom row of the 2-col grid
                  { id: 'p6math',     emoji: '➗', label: 'P6 Math', span: true },
                ].map((lvl) => {
                  const active = levelCat === lvl.id
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        if (levelCat === lvl.id) return
                        setLevelCat(lvl.id)
                        setSelectedSubtopics([])
                        // Header label follows the pick (display only —
                        // requests never send this; quiz `level` drives filtering)
                        setSelectedSubject(lvl.id === 'p6math' ? 'Math' : 'Physics')
                      }}
                      className={
                        'p-3 rounded-2xl border-2 font-black transition-all text-center ' +
                        (lvl.span ? 'col-span-2 ' : '') +
                        (active
                          ? 'border-quiz-blue bg-quiz-blue/15 text-quiz-orange-deep shadow-lg scale-[1.02]'
                          : 'border-quiz-border bg-white text-quiz-text hover:border-quiz-blue/60 hover:bg-gray-50')
                      }
                    >
                      <div className="text-2xl leading-none mb-1">{lvl.emoji}</div>
                      <div className="text-sm leading-tight">{lvl.label}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Topics — collapsible numbered checkbox list ordered by SEAB
              5054 syllabus position. Tap a row to tick/untick. Once
              MAX_TOPICS (3) are picked, unchecked rows go disabled. */}
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
                    ? <span className="text-quiz-blue">All topics — random mix</span>
                    : <span>{topicCount} / {MAX_TOPICS} picked</span>}
                </div>
              </div>
              <span className={'text-xl text-quiz-muted transition-transform ' + (topicsOpen ? 'rotate-180' : '')}>▾</span>
            </button>

            {topicsOpen && (
              <div className="mt-1 px-1 pb-1 max-h-72 overflow-y-auto space-y-1">
                {/* "All topics" sentinel row — clears selection */}
                <button
                  type="button"
                  onClick={() => setSelectedSubtopics([])}
                  className={
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-colors text-left ' +
                    (topicCount === 0
                      ? 'border-quiz-blue bg-quiz-blue/15'
                      : 'border-quiz-border bg-white hover:border-quiz-blue/60')
                  }
                >
                  <span className={
                    'shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ' +
                    (topicCount === 0
                      ? 'bg-quiz-blue border-quiz-blue'
                      : 'bg-transparent border-quiz-border')
                  }>
                    {topicCount === 0 && <span className="text-white text-[11px] font-black leading-none">✓</span>}
                  </span>
                  <span className="font-black text-sm flex-1 leading-tight">
                    ✨ All topics — random mix
                  </span>
                </button>

                {/* Numbered checkbox rows — sorted by syllabus position.
                    Topics from the backend that DON'T appear in the chosen
                    syllabus (Pure / Combined) are filtered out entirely so
                    the picker only ever shows officially-listed topics. */}
                {subtopics
                  .map((sub) => ({ sub, n: topicNumber(sub, levelCat) }))
                  .filter((t) => t.n != null)
                  .sort((a, b) => a.n - b.n)
                  .map(({ sub, n }) => {
                    const isSelected = topicsSelected.includes(sub)
                    const av = availability[sub]
                    const isEmpty = !av || ((av.easy || 0) + (av.medium || 0) + (av.hard || 0)) === 0
                    const isMaxed = !isSelected && topicCount >= MAX_TOPICS
                    const disabled = isMaxed || isEmpty
                    return (
                      <button
                        key={sub}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleTopic(sub)}
                        title={isEmpty ? 'No questions yet' : undefined}
                        className={
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-colors text-left ' +
                          (isSelected
                            ? 'border-quiz-blue bg-quiz-blue/15'
                            : 'border-quiz-border bg-white hover:border-quiz-blue/60') +
                          (disabled ? ' opacity-40 cursor-not-allowed' : '')
                        }
                      >
                        {/* Checkbox */}
                        <span className={
                          'shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ' +
                          (isSelected
                            ? 'bg-quiz-blue border-quiz-blue'
                            : 'bg-transparent border-quiz-border')
                        }>
                          {isSelected && <span className="text-white text-[11px] font-black leading-none">✓</span>}
                        </span>
                        {/* SEAB number prefix — always present (topic is
                            guaranteed to be in the syllabus at this point). */}
                        <span className="font-black text-quiz-muted text-xs w-6 text-right tabular-nums shrink-0">
                          {n}.
                        </span>
                        {/* Topic name */}
                        <span className="font-bold text-sm flex-1 leading-tight">
                          {sub}
                        </span>
                        {isEmpty && (
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-quiz-muted">Soon</span>
                        )}
                      </button>
                    )
                  })}
                {topicCount >= MAX_TOPICS && (
                  <div className="text-[11px] font-bold text-quiz-yellow px-2 pt-1">
                    Max {MAX_TOPICS} topics — untick one to swap.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Difficulty — reacts to the topic selection. Options with no
              questions for the chosen topics are greyed out; a stale pick
              auto-snaps to the nearest valid one. */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Difficulty</div>
              {!isPractice && (
                <div className="text-[10px] font-bold text-quiz-muted">XP multiplier</div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {diffSlots.map((d) => {
                const enabled = !availLoaded || difficultyAvailable(d.key, topicsSelected, availability, quizCount)
                const active = enabled && String(selectedDifficulty).toLowerCase() === String(d.id).toLowerCase()
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={!enabled}
                    onClick={() => enabled && setSelectedDifficulty(d.id)}
                    style={snapKey === d.key ? { transform: 'scale(1.12)' } : undefined}
                    className={
                      'p-3 rounded-2xl border-2 font-black transition-all text-center ' +
                      (!enabled
                        ? 'opacity-[0.35] pointer-events-none border-quiz-border bg-white text-quiz-muted'
                        : active
                          ? d.ring + ' text-quiz-orange-deep shadow-lg scale-[1.03]'
                          : 'border-quiz-border bg-white text-quiz-text hover:border-quiz-blue/60 hover:bg-gray-50')
                    }
                  >
                    <div className="text-2xl">{d.emoji}</div>
                    <div className="text-xs mt-1">{d.label}</div>
                    {!isPractice && (
                      <div className="text-[11px] mt-0.5 font-black text-quiz-yellow">{d.mult}</div>
                    )}
                  </button>
                )
              })}
            </div>
            {availLoaded && validDiffCount < 3 && (
              <p className="text-[11px] font-bold text-quiz-muted mt-2 px-1">
                {validDiffCount === 0
                  ? 'No questions available for this topic.'
                  : 'Some difficulties unavailable for the selected topics.'}
              </p>
            )}
          </div>

          {/* Question count — free choice */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">How many questions?</div>
            {isPractice ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionCount((n) => Math.max(1, (parseInt(n, 10) || 1) - 1))}
                    className="w-11 h-11 rounded-2xl bg-white border-2 border-quiz-border font-black text-xl shrink-0"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={questionCount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      setQuestionCount(Number.isFinite(v) ? Math.max(1, Math.min(100, v)) : '')
                    }}
                    className="flex-1 min-w-0 text-center rounded-2xl bg-white border-2 border-quiz-border py-3 font-black text-xl
                               text-quiz-text focus:outline-none focus:border-quiz-blue focus:ring-2 focus:ring-quiz-blue/40"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestionCount((n) => Math.min(100, (parseInt(n, 10) || 0) + 1))}
                    className="w-11 h-11 rounded-2xl bg-white border-2 border-quiz-border font-black text-xl shrink-0"
                  >+</button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[10, 15, 20].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setQuestionCount(c)}
                      className={
                        'flex-1 py-1.5 rounded-xl text-xs font-black border transition-colors ' +
                        (Number(questionCount) === c
                          ? 'bg-quiz-blue/25 border-quiz-blue text-quiz-orange-deep'
                          : 'bg-gray-50 border-quiz-border text-quiz-muted hover:text-white')
                      }
                    >{c}</button>
                  ))}
                </div>
              </>
            ) : (
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
            )}
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

          <Button3d type="submit" variant="green" size="lg" full
            disabled={loading || (availLoaded && validDiffCount === 0)}>
            {loading ? '⏳ Starting practice set...' : "🚀 Let's go!"}
          </Button3d>
        </form>
      </Screen>
    )
  }

  // ===== RESULTS =====
  if (showResults) {
    const {
      correctCount, percentage, dailyProgress: dp, streakAwarded, freezeUsed,
      xpDelta, xpBreakdown, gemsDelta, gemsBreakdown, rankUp, newRank, progression,
    } = showResults
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
        {/* Rank-up hero overlay — fires once when the backend reports a
            tier crossing. The existing rank-up banner card below remains
            as a permanent reference on the results screen. */}
        {rankUp && newRank && !rankUpDismissed && !showCelebration && (
          <RankUpOverlay
            newRank={newRank}
            onDismiss={() => setRankUpDismissed(true)}
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

        {/* Rank-up banner (rare, only on tier crossings) */}
        {rankUp && newRank && (
          <Card variant="solid" className="!p-5 mb-4 text-center border-2 border-quiz-yellow/60
                                          bg-gradient-to-r from-quiz-yellow/15 to-quiz-orange/15">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-yellow mb-1">
              Rank up!
            </div>
            <div className="text-3xl mb-1">{newRank.icon || newRank.tier_icon}</div>
            <div className="text-xl font-black text-quiz-yellow">{newRank.name || newRank.tier_name}</div>
            <p className="text-xs text-quiz-muted mt-1">
              {newRank.next_name
                ? <>Next tier: {newRank.next_name} at {newRank.xp_next} XP</>
                : <>Top of the cosmic ladder. Legend status.</>}
            </p>
          </Card>
        )}

        {/* StarQuest rewards earned this quiz */}
        {(xpDelta > 0 || gemsDelta > 0) && (
          <Card variant="solid" className="!p-4 mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">
              Rewards
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">⭐ XP</span>
              <span className="text-sm font-black text-quiz-purple">+{xpDelta}</span>
            </div>
            {xpBreakdown && (
              <div className="text-[11px] text-quiz-muted leading-relaxed mb-2 pl-2">
                {xpBreakdown.base ? <>+{xpBreakdown.base} base </> : null}
                {xpBreakdown.perfect ? <>· +{xpBreakdown.perfect} perfect </> : null}
                {xpBreakdown.daily_goal ? <>· +{xpBreakdown.daily_goal} daily-goal </> : null}
                {xpBreakdown.streak_milestone ? <>· +{xpBreakdown.streak_milestone} milestone</> : null}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">💎 Crystals</span>
              <span className="text-sm font-black text-quiz-cyan">+{gemsDelta}</span>
            </div>
            {gemsBreakdown && (
              <div className="text-[11px] text-quiz-muted leading-relaxed pl-2">
                +{gemsBreakdown.correct} correct · +{gemsBreakdown.quiz} quiz
                {gemsBreakdown.rank_up ? <> · +{gemsBreakdown.rank_up} rank-up</> : null}
              </div>
            )}
            {progression && (
              <div className="text-[10px] text-quiz-muted mt-2 pt-2 border-t border-quiz-border/40 text-right">
                Lv {progression.level} · {progression.xp} XP total
              </div>
            )}
          </Card>
        )}

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
                <div className="h-2 rounded-full bg-gray-50 overflow-hidden mb-3">
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

  // Per-question submit: a question must be "checked" before the user can move
  // on. Once checked the answer is locked and correct/wrong is revealed inline.
  const isChecked = checked[currentQuestionIndex] === true
  const setAnswer = (val) => {
    if (isChecked) return                       // answer locked after checking
    setUserAnswers({ ...userAnswers, [currentQuestionIndex]: val })
  }

  const correctKey = answerKey(q.answer)
  const chosenKey  = answerKey(userAnswers[currentQuestionIndex])
  const isCorrect  = Boolean(chosenKey) && chosenKey === correctKey

  const _ca = userAnswers[currentQuestionIndex]
  const currentAnswered = _ca !== undefined && _ca !== null && _ca !== ''
  const checkedCount = quiz.questions.filter((_, i) => checked[i]).length

  const handleCheckQuestion = () => {
    if (!currentAnswered || isChecked) return
    setError(null)
    setChecked({ ...checked, [currentQuestionIndex]: true })
  }

  const rawHeaders = q.table_headers || []
  const flatHeaders = Array.isArray(rawHeaders[0]) ? rawHeaders[rawHeaders.length - 1] : rawHeaders

  // Option styling — reference quiz.jsx blueprint:
  //   default        → white surface, warm tan border
  //   picked         → orange-tint surface, brand orange border
  //   correct        → green-tint surface, brand green border
  //   wrong-pick     → coral red-tint surface, coral border
  //   other-on-check → faded white surface
  // Text stays charcoal so it reads on light surfaces.
  const optionCls = (selected, optKey) => {
    const base = 'flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-quiz-text '
    if (isChecked) {
      if (optKey && optKey === correctKey)
        return base + 'bg-[rgba(47,191,113,0.12)] border-[#2FBF71]'
      if (selected)
        return base + 'bg-[rgba(255,92,92,0.10)] border-[#FF5C5C]'
      return base + 'bg-white border-quiz-border opacity-60'
    }
    return base + 'cursor-pointer ' + (selected
      ? 'bg-quiz-orange-soft border-quiz-orange shadow-md scale-[1.01]'
      : 'bg-white border-quiz-border hover:border-quiz-orange hover:bg-quiz-orange-soft/40')
  }

  return (
    <Screen width="default" className="py-3 sm:py-6">
      <Card variant="solid" className="!p-3 sm:!p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full bg-quiz-orange-soft border border-quiz-orange/50 text-quiz-orange-deep text-xs font-bold">
            Practice · {selectedSubject}
          </span>
          <span className="text-xs sm:text-sm font-bold text-quiz-muted">Q{currentQuestionIndex + 1}/{total}</span>
        </div>

        <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-quiz-amber to-quiz-orange transition-all duration-300"
               style={{ width: `${((currentQuestionIndex + 1) / total) * 100}%` }} />
        </div>

        {error && (
          <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-bold">
            {error}
          </div>
        )}

        <h2 className="!text-base sm:!text-lg !font-black leading-snug whitespace-pre-line"><MathText>{q.question_text}</MathText></h2>

        <QImage src={q.setup_image_url} alt="Question diagram" />
        {q.option_type === 'IMAGE' && q.image_url && q.image_url !== q.setup_image_url && (
          <QImage src={q.image_url} alt="Answer options" />
        )}
        {q.option_type !== 'IMAGE' && !q.setup_image_url && q.image_url && (
          <QImage src={q.image_url} alt="Question" />
        )}

        {q.option_type === 'TABLE' && Array.isArray(q.table_rows) ? (
          <div className="overflow-x-auto rounded-2xl border border-quiz-border">
            <table className="w-full text-sm">
              {flatHeaders.length > 0 && (
                <thead><tr className="bg-gray-50">
                  <th className="px-3 py-2 w-12 text-center font-bold text-quiz-muted">#</th>
                  {flatHeaders.map((h, i) => <th key={i} className="px-3 py-2 text-left font-bold text-quiz-muted">{h}</th>)}
                  <th className="px-3 py-2 w-16 text-center font-bold text-quiz-muted">Pick</th>
                </tr></thead>
              )}
              <tbody>
                {q.table_rows.map((row, rIdx) => {
                  const isObj = row && typeof row === 'object'
                  const letter = (isObj ? row._letter : null) || String.fromCharCode(65 + rIdx)
                  const selected = userAnswers[currentQuestionIndex] === letter
                  // Header-keyed cells when the table has headers; otherwise
                  // fall back to the positional _cells list.
                  const cells = flatHeaders.length > 0
                    ? flatHeaders.map((h) => (isObj ? (row[h] ?? '') : ''))
                    : (isObj && Array.isArray(row._cells) ? row._cells : [])
                  let rowCls = 'transition-colors '
                  if (isChecked) {
                    if (letter === correctKey)   rowCls += 'bg-quiz-green/20'
                    else if (selected)           rowCls += 'bg-quiz-red/20'
                    else                         rowCls += 'opacity-60'
                  } else {
                    rowCls += 'cursor-pointer ' + (selected ? 'bg-quiz-blue/20' : 'hover:bg-gray-50')
                  }
                  return (
                    <tr key={rIdx} onClick={() => setAnswer(letter)} className={rowCls}>
                      <td className="px-3 py-2 border-t border-quiz-border text-center font-black text-quiz-blue">{letter}</td>
                      {cells.map((c, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-t border-quiz-border"><MathText>{c}</MathText></td>
                      ))}
                      <td className="px-3 py-2 text-center border-t border-quiz-border">
                        <input type="radio" checked={selected} disabled={isChecked}
                               onChange={() => setAnswer(letter)} className="accent-quiz-blue" />
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
                <label key={letter} className={optionCls(selected, letter) + ' justify-center'}>
                  <input type="radio" checked={selected} disabled={isChecked}
                         onChange={() => setAnswer(letter)} className="sr-only" />
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
              // Split the leading A/B/C/D label off the answer body so the
              // letter renders as a distinct badge, not part of the answer.
              //   "A. Force is X"  → letter "A", body "Force is X"
              //   "A"              → letter "A", body ""   (diagram-reference questions)
              //   "Some sentence." → letter from index, body = the sentence
              // Index-based fallback keeps the badge column aligned across
              // every option, every question type.
              const indexLetter = String.fromCharCode(65 + i)  // A, B, C, D
              const labelMatch  = t.match(/^([A-Da-d])[\.\)\:\-]?\s+(.*)$/)
              const letterOnly  = /^[A-Da-d]$/.test(t)
              const letter = labelMatch
                ? labelMatch[1].toUpperCase()
                : (letterOnly ? t.toUpperCase() : indexLetter)
              const body = labelMatch ? labelMatch[2] : (letterOnly ? '' : t)
              const optKey = answerKey(t)
              const isCorrectOpt = isChecked && optKey === correctKey
              const isWrongPick  = isChecked && selected && optKey !== correctKey
              return (
                <motion.label
                  // Keyed by QUESTION + index (was just index): with key={i}
                  // React reuses these nodes across questions, so advancing
                  // mid-shake left the interrupted keyframe transform (x≈8px)
                  // stuck on the next question's options — the "misaligned
                  // options when I click Next too fast" bug.
                  key={`${q.uid || currentQuestionIndex}-${i}`}
                  className={optionCls(selected, optKey)}
                  // Duolingo-style: tap squishes + lifts, correct option pops
                  // with overshoot, wrong option shakes. All run AFTER check.
                  // Rest pose is EXPLICIT ({x:0, scale:1}, not undefined) so an
                  // interrupted pop/shake always animates back to neutral.
                  {...(isChecked ? {} : optionTap)}
                  animate={isCorrectOpt ? correctPop : isWrongPick ? wrongShake : { x: 0, scale: 1 }}
                >
                  <input type="radio" checked={selected} disabled={isChecked}
                         onChange={() => setAnswer(t)} className="sr-only" />
                  {/* Letter badge is ALWAYS rendered so options align across
                      diagram-reference questions (body = "") and full-text
                      questions (body = "Force is required ..."). Same width,
                      same position, same visual rhythm. */}
                  <span className={
                    'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm border ' +
                    (isCorrectOpt
                      ? 'bg-[#2FBF71] text-white border-[#2FBF71]'
                      : isWrongPick
                      ? 'bg-[#FF5C5C] text-white border-[#FF5C5C]'
                      : selected && !isChecked
                      ? 'bg-quiz-orange text-white border-quiz-orange'
                      : 'bg-quiz-orange-soft/40 text-quiz-muted border-quiz-border')
                  }>
                    {letter}
                  </span>
                  {body && <span className="font-semibold text-sm sm:text-base leading-snug"><MathText>{body}</MathText></span>}
                  {isCorrectOpt && <span className="ml-auto font-black text-[#2FBF71]">✓</span>}
                  {isWrongPick && <span className="ml-auto font-black text-[#FF5C5C]">✗</span>}
                </motion.label>
              )
            })}
          </div>
        )}

        {/* Inline correct/wrong feedback — reference quiz uses green
            for "Correct! Nice one." and warm orange for "Not quite"
            (encouraging rather than punishing). */}
        {isChecked && (
          <div className={
            'rounded-2xl border-2 px-3 py-2 text-xs sm:text-sm ' +
            (isCorrect
              ? 'border-[#2FBF71]/50 bg-[rgba(47,191,113,0.10)] text-[#1FA85E]'
              : 'border-quiz-orange/40 bg-quiz-orange-soft text-quiz-orange-deep')
          }>
            <div className="font-black">
              {isCorrect
                ? '✅ Correct! Nice one.'
                : `❌ Not quite — the correct answer is ${correctKey || '—'}.`}
            </div>
            {q.explanation && (
              <div className="mt-2 font-semibold leading-relaxed text-quiz-text whitespace-pre-line">
                <span className="font-black">Why: </span><MathText>{q.explanation}</MathText>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button3d
            variant={currentQuestionIndex === 0 ? 'disabled' : 'white'}
            size="md"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </Button3d>
          <span className="text-sm font-bold text-quiz-muted order-3 sm:order-2 w-full sm:w-auto text-center">
            {checkedCount}/{total} done
          </span>
          {!isChecked ? (
            <Button3d
              variant={currentAnswered ? 'blue' : 'disabled'}
              size="md"
              disabled={!currentAnswered}
              title={!currentAnswered ? 'Pick an answer first' : ''}
              onClick={handleCheckQuestion}
              className="order-2 sm:order-3"
            >
              {currentAnswered ? '✅ Submit answer' : '🔒 Pick an answer'}
            </Button3d>
          ) : isLast ? (
            <Button3d
              variant="orange"
              size="md"
              onClick={handleSubmitQuiz}
              disabled={loading}
              className="order-2 sm:order-3"
            >
              {loading ? '⏳ Submitting…' : '🏁 See results'}
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
