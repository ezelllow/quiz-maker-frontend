import { useCallback, useEffect, useState } from 'react'
import Screen from '../ui/Screen'
import Card from '../ui/Card'
import Button3d from '../ui/Button3d'
import Skeleton from '../ui/Skeleton'
import EditingPlayer from './EditingPlayer'
import EditingReview from './EditingReview'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * EnglishDaily — today's editing passage as the Daily Challenge.
 *
 * The backend picks the passage (weighted toward the error codes this
 * student gets wrong, seeded on user+date so it's the same one all day), so
 * there is nothing to choose here: load it, play it in exam mode, review it.
 * One passage is exactly ten marks, which is the daily target.
 */
export default function EnglishDaily({
  authToken,
  onExit,
  onHome,
  onProgressionChange,
  onGemsChange,
  onQuizActiveChange,
}) {
  const [daily, setDaily] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/english/daily`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).detail
          || "Could not load today's passage")
      }
      setDaily(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <Screen>
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </Card>
      </Screen>
    )
  }

  if (error) {
    return (
      <Screen>
        <Card className="p-6 text-center">
          <p className="font-bold text-quiz-red">{error}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button3d variant="white" onClick={load}>Try again</Button3d>
            <Button3d variant="white" onClick={onExit}>Back</Button3d>
          </div>
        </Card>
      </Screen>
    )
  }

  if (result) {
    return (
      <EditingReview
        result={result}
        onHome={onHome || onExit}
        onRetry={() => setResult(null)}
      />
    )
  }

  return (
    <EditingPlayer
      authToken={authToken}
      uid={daily.uid}
      mode="exam"
      daily
      onExit={onExit}
      onFinished={(payload) => {
        setResult(payload)
        if (payload?.progression) onProgressionChange?.(payload.progression)
        if (typeof payload?.gems_total === 'number') onGemsChange?.(payload.gems_total)
      }}
      onActiveChange={onQuizActiveChange}
    />
  )
}
