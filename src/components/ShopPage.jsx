import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Shop launch flag — flip to `false` to re-enable the live rewards shop.
// While `true`, the Shop tab stays in the navbar but shows a locked
// "Coming Soon" screen instead of the redeemable catalogue.
const SHOP_LOCKED = true

// ShopPage — StarQuest §05 rewards shop. Mirrors newFrontend/index.html's
// renderShop: 2-col grid of cards, gem-balance pill in the header, "💡 earn
// rate" info banner. Each card shows emoji, name, blurb, and a button that's
// either the price (purple, affordable), "Owned ✓" (locked white), or
// disabled (insufficient gems).
export default function ShopPage({ authToken, gems, onGemsChange }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [catalogue, setCatalogue] = useState([])
  const [owned, setOwned] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load shop')
      const d = await res.json()
      setCatalogue(d.catalogue || [])
      setOwned(d.owned || [])
      // Keep parent navbar in sync with the latest balance.
      if (typeof d.gems === 'number' && onGemsChange) onGemsChange(d.gems)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (!SHOP_LOCKED) load() }, [token])

  // ── Locked screen ────────────────────────────────────────────────────────
  // Shop isn't launched yet. Tab stays in the navbar; this placeholder shows
  // instead of the live catalogue. Flip SHOP_LOCKED to false to relaunch.
  if (SHOP_LOCKED) {
    return (
      <Screen width="default">
        <header className="mb-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
            Rewards Shop
          </div>
          <h1 className="!text-2xl !font-black tracking-tight">Spend your gems 💎</h1>
        </header>
        <Card variant="solid" className="!p-10 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="font-black text-lg mb-2">Shop coming soon</div>
          <p className="text-sm font-bold text-quiz-muted leading-relaxed mb-5">
            The rewards shop isn't open yet. Keep playing — every correct answer,
            quiz, and rank-up still banks 💎. You'll be able to spend them here
            once the shop launches.
          </p>
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-base font-black
                           bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan">
            💎 {gems ?? 0} saved up
          </span>
        </Card>
      </Screen>
    )
  }

  const redeem = async (item) => {
    if (busyId) return
    const msg = item.type === 'avatar'
      ? `Unlock ${item.name} for ${item.cost} 💎?`
      : `Spend ${item.cost} 💎 on ${item.name}?\n\n${
          item.type === 'physical'
            ? 'Physical reward — ships to your school in the next monthly batch.'
            : 'High-tier reward — coordinated personally.'
        }`
    if (!window.confirm(msg)) return

    setBusyId(item.id); setError(null); setToast(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reward_id: item.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Redeem failed')
      // Optimistic local update so the UI feels instant.
      setOwned((prev) => [item.id, ...prev])
      if (onGemsChange) onGemsChange(d.gems_total)
      setToast({
        kind: 'success',
        text: item.type === 'avatar'
          ? `🎉 Unlocked ${item.name}.`
          : `🎉 Redeemed ${item.name}. We'll mail it to your school in the next dispatch.`,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const Header = () => (
    <header className="flex items-center justify-between mb-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
          Rewards Shop
        </div>
        <h1 className="!text-2xl !font-black tracking-tight">Spend your gems 💎</h1>
      </div>
      <span className="flex items-center gap-1 px-3 py-2 rounded-2xl text-base font-black
                       bg-quiz-cyan/15 border border-quiz-cyan/40 text-quiz-cyan">
        💎 {gems ?? 0}
      </span>
    </header>
  )

  if (loading) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading shop…</Card>
    </Screen>
  )

  if (error && catalogue.length === 0) return (
    <Screen width="default"><Header />
      <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card>
    </Screen>
  )

  return (
    <Screen width="default">
      <Header />

      {/* Earn-rate info banner */}
      <Card variant="solid" className="!p-3 mb-4 border-2 border-quiz-blue/30 bg-quiz-blue/10">
        <p className="text-xs font-bold text-quiz-blue leading-relaxed">
          💡 Earn 2 💎 per correct answer, 5 💎 per quiz, 50 💎 on a rank-up.
          Physical rewards ship to your school once a month.
        </p>
      </Card>

      {toast && (
        <Card variant="solid" className="!p-3 mb-4 border-2 border-quiz-green/50 bg-quiz-green/10">
          <p className="text-xs font-bold text-quiz-green">{toast.text}</p>
        </Card>
      )}
      {error && (
        <Card variant="solid" className="!p-3 mb-4 border-2 border-quiz-red/50 bg-quiz-red/10">
          <p className="text-xs font-bold text-quiz-red">{error}</p>
        </Card>
      )}

      {/* 2-col grid of reward cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {catalogue.map((item) => {
          const isOwned = owned.includes(item.id)
          const affordable = (gems ?? 0) >= item.cost
          const disabled = isOwned || !affordable || busyId === item.id
          const variant = isOwned ? 'white' : affordable ? 'purple' : 'red'

          return (
            <Card key={item.id} variant="solid" className="!p-3 text-center flex flex-col">
              <div className="text-4xl mb-2 leading-none">{item.emoji}</div>
              <div className="font-black text-sm leading-tight mb-1">{item.name}</div>
              <div className="text-[10px] font-bold text-quiz-muted leading-tight mb-2 flex-1">
                {item.desc}
              </div>
              {item.type === 'avatar' && (
                <span className="text-[9px] font-black uppercase tracking-widest text-quiz-purple mb-2">
                  Avatar
                </span>
              )}
              {item.type === 'high-tier' && (
                <span className="text-[9px] font-black uppercase tracking-widest text-quiz-yellow mb-2">
                  High Tier
                </span>
              )}
              <Button3d
                variant={variant}
                size="sm"
                full
                disabled={disabled}
                onClick={() => redeem(item)}
              >
                {isOwned
                  ? 'Owned ✓'
                  : busyId === item.id
                    ? '…'
                    : `💎 ${item.cost}`}
              </Button3d>
            </Card>
          )
        })}
      </div>
    </Screen>
  )
}
