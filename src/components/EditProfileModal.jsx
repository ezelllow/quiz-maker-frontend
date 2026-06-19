import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Modal from './ui/Modal'
import Button3d from './ui/Button3d'
import Avatar from './ui/Avatar'
import { ease } from '../motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Square-crop + resize an uploaded image to a 256px data URL.
function resizeImageToDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * EditProfileModal — name + avatar editor opened from the avatar
 * dropdown in the top bar. Self-contained: it owns the form state,
 * file-upload logic, and the PUT to /api/auth/profile.
 *
 *   open:         boolean
 *   onClose:      () => void
 *   user:         the current { name, avatar_url, email } object
 *   onUserUpdate: (newUser) => void — called after successful save
 */
export default function EditProfileModal({ open, onClose, user, onUserUpdate }) {
  const token = localStorage.getItem('auth_token')
  const stored = user || JSON.parse(localStorage.getItem('user') || '{}')

  // Reset form whenever the modal opens (so cancelling discards changes).
  const [name, setName] = useState(stored.name || '')
  const [avatarUrl, setAvatarUrl] = useState(stored.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  // Two-step save: clicking Save opens a confirmation Modal first so an
  // accidental tap can't overwrite the user's display name or photo.
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName(stored.name || '')
      setAvatarUrl(stored.avatar_url || '')
      setError(null)
      setSaving(false)
      setConfirmOpen(false)
    }
  }, [open, stored.name, stored.avatar_url])

  const initials = (name || stored.email || '?').trim().charAt(0).toUpperCase()
  const dirty = name.trim() !== (stored.name || '')

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return }
    if (file.size > 8 * 1024 * 1024)     { setError('That image is too large (max 8MB)'); return }
    try { setAvatarUrl(await resizeImageToDataUrl(file)) }
    catch (err) { setError(err.message || 'Could not process that image') }
    e.target.value = ''
  }

  const handleSave = async () => {
    setError(null)
    if (!name.trim()) { setError('Display name cannot be empty'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save profile')
      localStorage.setItem('user', JSON.stringify(data.user))
      if (onUserUpdate) onUserUpdate(data.user)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-2xl bg-white border-2 border-quiz-border px-4 py-3 text-base ' +
    'text-quiz-text placeholder:text-quiz-muted focus:outline-none focus:border-quiz-blue ' +
    'focus:ring-2 focus:ring-quiz-blue/40 transition-colors disabled:opacity-60'

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" hideButtons>
      <div className="space-y-4">
        {/* Avatar preview — your equipped Ooka. Customised in the Shop, not
            uploaded as a photo. */}
        <div className="flex items-center gap-4">
          <Avatar size="xl" variant="head" equipped={stored.equipped} className="ring-4 ring-quiz-border-bright shadow-xl" />
          <div className="min-w-0">
            <div className="text-sm font-black">Your Ooka avatar</div>
            <p className="text-[11px] font-bold text-quiz-muted mt-0.5 leading-snug">
              Unlock new monkey skins and wearables in the <span className="text-quiz-blue">Shop</span> using 💎.
            </p>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-quiz-muted mb-1.5">
            Display name
          </label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name" maxLength={120} className={inputCls}
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ease.spring}
            className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-3 py-2 text-sm font-bold"
          >
            {error}
          </motion.div>
        )}

        {/* Save / Cancel */}
        <div className="flex gap-2 pt-1">
          <Button3d variant="white" full onClick={onClose} disabled={saving}>
            Cancel
          </Button3d>
          <Button3d
            variant={dirty ? 'green' : 'white'}
            full
            disabled={!dirty && !saving}
            loading={saving}
            loadingLabel="Saving…"
            onClick={() => dirty && setConfirmOpen(true)}
          >
            {dirty ? '💾 Save' : '✓ Saved'}
          </Button3d>
        </div>
      </div>
      {/* Confirmation Modal — only fires after the user taps Save. Cancel
          here returns to the editor with their pending changes intact;
          Confirm fires the actual PUT and closes everything. */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title="Save profile changes?"
        body={`Display name will change to "${name.trim()}".`}
        confirmLabel="Save"
        cancelLabel="Cancel"
        tone="green"
      />
    </Modal>
  )
}
