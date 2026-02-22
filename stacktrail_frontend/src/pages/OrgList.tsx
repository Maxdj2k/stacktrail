import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '@/api/client'
import type { Organization } from '@/api/types'

export default function OrgList() {
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
    api.seedDemo().then(setOrgs).catch((e) => setError(e.message)).finally(() => setSeeding(false))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 bg-[var(--bg-card)] rounded w-48" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--bg-card)] rounded-[var(--radius-md)]" />
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
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Organizations</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage business profiles and run checkups</p>
        </div>
        <Link
          to="/orgs/new"
          className="px-5 py-2.5 bg-[var(--accent-blue)] text-white rounded-[var(--radius-pill)] font-medium hover:opacity-90 transition-colors text-sm"
        >
          Add organization
        </Link>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-card-hover)] border-b border-[#1a1a1a]">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Domain</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Type</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                <td className="px-5 py-4">
                  <Link to={`/orgs/${org.id}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-blue)]">
                    {org.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)] text-[13px]">{org.primary_domain || '—'}</td>
                <td className="px-5 py-4 text-[var(--text-secondary)] text-[13px] capitalize">{org.business_type?.replace('_', ' ')}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    to={`/orgs/${org.id}/checkup`}
                    className="text-sm font-medium text-[var(--accent-blue)] hover:underline"
                  >
                    Run checkup
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 && !loading && (
          <div className="px-5 py-12 text-center">
            <p className="text-[var(--text-secondary)]">No organizations.</p>
            <div className="mt-3 flex gap-3 justify-center">
              <button type="button" onClick={handleSeedDemo} disabled={seeding} className="px-5 py-2.5 bg-[var(--accent-blue)] text-white rounded-[var(--radius-pill)] hover:opacity-90 disabled:opacity-50 font-medium text-sm">
                {seeding ? 'Loading…' : 'Load demo organizations'}
              </button>
              <Link to="/orgs/new" className="px-5 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-[var(--radius-pill)] hover:bg-[var(--bg-card-hover)] font-medium text-sm border border-[#333]">Add my own</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
