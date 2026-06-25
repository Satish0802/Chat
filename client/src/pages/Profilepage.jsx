import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ProfilePage() {
  const { user, token, login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(user?.username || '')
  const [preview, setPreview] = useState(user?.avatar || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileRef = useRef(null)

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Instant local preview
    setPreview(URL.createObjectURL(file))
    setError('')
    setSuccess('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const { data } = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      login(data.user, token)
      setPreview(data.user.avatar)
      setSuccess('Avatar updated!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload avatar')
      setPreview(user?.avatar || null)
    } finally {
      setUploading(false)
    }
  }

  // ── Username update ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!username.trim()) return setError('Username cannot be empty')
    if (username === user?.username) return setError('No changes to save')

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const { data } = await api.put('/auth/profile', { username })
      login(data.user, token)
      setSuccess('Profile updated!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/chat')}
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to chat
        </button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-medium">Profile settings</span>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Avatar section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Avatar</h2>

          <div className="flex items-center gap-5">
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-700 text-emerald-200 flex items-center justify-center text-2xl font-semibold ring-2 ring-zinc-700">
                  {initials(user?.username || '')}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-zinc-900/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div>
              <p className="text-sm text-zinc-400 mb-3">
                JPG, PNG or WebP · Max 5MB · Cropped to 200×200
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg border border-zinc-700 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Change avatar'}
              </button>
              {preview && (
                <button
                  onClick={async () => {
                    try {
                      const { data } = await api.put('/auth/profile', { avatar: '' })
                      login(data.user, token)
                      setPreview(null)
                    } catch {}
                  }}
                  className="ml-2 px-4 py-2 text-zinc-500 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account info section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Account</h2>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3.5 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              />
            </div>

            {/* Email — read only */}
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Email <span className="text-zinc-600">(cannot be changed)</span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-zinc-800/50 border border-zinc-800 text-zinc-500 text-sm rounded-lg px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>

            {/* Member since */}
            <div className="pt-1">
              <p className="text-xs text-zinc-600">
                Member since {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || username === user?.username}
            className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        {/* Stats card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Account info</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-2xl font-semibold text-white">{user?.username?.slice(0, 1).toUpperCase()}</p>
              <p className="text-xs text-zinc-500 mt-1">First initial</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-white">Online</p>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Current status</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}