import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, password, email || undefined)
      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running on port 8000?' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] p-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">Create account</h1>
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
                minLength={2}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                autoComplete="email"
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
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">At least 8 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[var(--radius-pill)] font-medium bg-[var(--accent-blue)] text-white hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--accent-blue)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
