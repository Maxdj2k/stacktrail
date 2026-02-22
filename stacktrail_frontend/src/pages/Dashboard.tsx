import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '@/api/client'
import type { Organization } from '@/api/types'

export default function Dashboard() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)

  const loadOrgs = () => {
    setLoading(true)
    setError('')
    api.listOrgs().then(setOrgs).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrgs()
  }, [])

  const handleSeedDemo = () => {
    setSeeding(true)
    setError('')
    api.seedDemo()
      .then(setOrgs)
      .catch((e) => setError(e.message))
      .finally(() => setSeeding(false))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 bg-[var(--bg-card)] rounded w-48 mb-6" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--bg-card)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 text-[var(--accent-red)] px-4 py-3 rounded-[var(--radius-md)]">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Your organizations</p>
        </div>
        <span className="flex items-center gap-2 bg-[var(--accent-blue-dim)] text-[#597ef7] px-4 py-1.5 rounded-[var(--radius-pill)] text-xs font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#597ef7] before:shadow-[0_0_8px_#597ef7]">
          Cyber Checkup
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => (
          <Link
            key={org.id}
            to={`/orgs/${org.id}`}
            className="block bg-[var(--bg-card)] rounded-[var(--radius-lg)] p-5 hover:bg-[var(--bg-card-hover)] transition-all"
          >
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Organization</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">{org.name}</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">{org.primary_domain || '—'}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2 capitalize">{org.business_type?.replace('_', ' ')}</p>
            <span className="inline-block mt-4 text-sm font-medium text-[var(--accent-blue)]">View →</span>
          </Link>
        ))}
      </div>

      {orgs.length === 0 && !loading && (
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] p-12 text-center">
          <p className="text-[var(--text-secondary)]">No organizations yet.</p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-5 py-2.5 bg-[var(--accent-blue)] text-white rounded-[var(--radius-pill)] hover:opacity-90 disabled:opacity-50 font-medium text-sm"
            >
              {seeding ? 'Loading…' : 'Load demo organizations'}
            </button>
            <Link to="/orgs/new" className="px-5 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-[var(--radius-pill)] hover:bg-[var(--bg-card-hover)] font-medium text-sm border border-[#333]">
              Add my own
            </Link>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-3">Demo adds 3 sample orgs so you can explore the app.</p>
        </div>
      )}
    </div>
  )
}
