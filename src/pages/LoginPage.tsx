import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../lib/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Something went wrong')
        return
      }

      if (mode === 'register') {
        setSuccess('Check your email to confirm your account, then log in.')
        setMode('login')
      } else {
        login(data.access_token)
        navigate('/journal')
      }
    } catch {
      setError('Network error — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vct-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-vct-900 border border-vct-700 rounded-2xl p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white text-center">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-dusty-denim-400 font-medium uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-vct-800 border border-vct-700 rounded-lg px-3 py-2 text-sm text-white placeholder-vct-600 focus:outline-none focus:border-red-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-dusty-denim-400 font-medium uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-vct-800 border border-vct-700 rounded-lg px-3 py-2 text-sm text-white placeholder-vct-600 focus:outline-none focus:border-red-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            {loading ? 'Loading…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-dusty-denim-500">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null) }}
            className="text-red-400 hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
