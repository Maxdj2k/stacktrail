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
        <div className="animate-pulse h-8 bg-slate-700 rounded w-48" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Organizations</h1>
          <p className="text-slate-400 mt-1">Manage business profiles and run checkups</p>
        </div>
        <Link
          to="/orgs/new"
          className="px-4 py-2 bg-teal-500 text-slate-900 rounded-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Add organization
        </Link>
      </div>

      <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Domain</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-400">Type</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <Link to={`/orgs/${org.id}`} className="font-medium text-white hover:text-teal-400">
                    {org.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-400">{org.primary_domain || '—'}</td>
                <td className="px-6 py-4 text-slate-400 capitalize">{org.business_type?.replace('_', ' ')}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/orgs/${org.id}/checkup`}
                    className="text-sm font-medium text-teal-400 hover:underline"
                  >
                    Run checkup
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400">No organizations.</p>
            <div className="mt-3 flex gap-3 justify-center">
              <button type="button" onClick={handleSeedDemo} disabled={seeding} className="px-4 py-2 bg-teal-500 text-slate-900 rounded-lg hover:bg-teal-400 disabled:opacity-50 font-medium">
                {seeding ? 'Loading…' : 'Load demo organizations'}
              </button>
              <Link to="/orgs/new" className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700/50 font-medium">Add my own</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
