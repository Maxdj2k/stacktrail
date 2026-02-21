import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg === 'Failed to fetch') {
        setError('Cannot reach the server. Is the backend running on port 8000?')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <img src="/stacktrail-logo.png" alt="" className="h-10 w-10 rounded-lg object-contain shrink-0" />
            <div>
              <h1 className="text-2xl font-semibold text-white">Sign in</h1>
              <p className="text-slate-400 text-sm">StackTrail Cyber Checkup</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium bg-teal-500 text-slate-900 hover:bg-teal-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            No account?{' '}
            <Link to="/register" className="text-teal-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Demo: <code className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">demo</code> / <code className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">demo1234!</code>
        </p>
      </div>
    </div>
  )
}
