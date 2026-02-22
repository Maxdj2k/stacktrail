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
      const isNetworkError =
        msg === 'Failed to fetch' ||
        (err && typeof (err as { name?: string }).name === 'string' && (err as { name: string }).name === 'TypeError') ||
        /Unexpected token|JSON|fetch/.test(msg)
      if (isNetworkError) {
        const apiBase = (import.meta.env.VITE_API_BASE as string) || '/api'
        setError(
          apiBase === '/api'
            ? 'Cannot reach the API. Set VITE_API_BASE to your backend URL in Vercel (Settings → Environment Variables), then redeploy.'
            : 'Cannot reach the API. Check that the backend is running and CORS allows this site (add this origin to CORS_ALLOWED_ORIGINS on Render).'
        )
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] p-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">Sign in</h1>
          <p className="text-[var(--text-secondary)] text-[13px] mb-6">StackTrail Cyber Checkup</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-[var(--accent-red)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 px-3 py-2 rounded-[var(--radius-md)]">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[var(--radius-pill)] font-medium bg-[var(--accent-blue)] text-white hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            No account?{' '}
            <Link to="/register" className="text-[var(--accent-blue)] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-[13px] text-[var(--text-tertiary)]">
          Demo: <code className="bg-[#222] px-1.5 py-0.5 rounded text-[var(--text-secondary)] font-mono text-xs">demo</code> / <code className="bg-[#222] px-1.5 py-0.5 rounded text-[var(--text-secondary)] font-mono text-xs">demo1234!</code>
        </p>
      </div>
    </div>
  )
}
