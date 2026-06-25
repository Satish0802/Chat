import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.user, data.token)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-white text-xl font-semibold tracking-wide">Chatwave</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-white text-lg font-semibold mb-1">Create account</h1>
          <p className="text-zinc-400 text-sm mb-6">Join Chatwave today</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Username
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="satoki"
                required
                minLength={3}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3.5 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3.5 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3.5 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-500 transition-colors"
              />
              <p className="text-zinc-600 text-xs mt-1.5">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 mt-2 transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}