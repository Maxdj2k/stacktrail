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
        <div className="animate-pulse h-8 bg-slate-700 rounded w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl" />
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Your organizations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => (
          <Link
            key={org.id}
            to={`/orgs/${org.id}`}
            className="block bg-slate-800/80 rounded-xl border border-slate-700 p-6 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 transition-all"
          >
            <h2 className="font-semibold text-white">{org.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{org.primary_domain || '—'}</p>
            <p className="text-xs text-slate-500 mt-2 capitalize">{org.business_type?.replace('_', ' ')}</p>
            <span className="inline-block mt-4 text-sm font-medium text-teal-400">View organization →</span>
          </Link>
        ))}
      </div>

      {orgs.length === 0 && !loading && (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-12 text-center">
          <p className="text-slate-400">No organizations yet.</p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-4 py-2 bg-teal-500 text-slate-900 rounded-lg hover:bg-teal-400 disabled:opacity-50 font-medium"
            >
              {seeding ? 'Loading…' : 'Load demo organizations'}
            </button>
            <Link to="/orgs/new" className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700/50 font-medium">
              Add my own
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-3">Demo adds 3 sample orgs so you can explore the app.</p>
        </div>
      )}
    </div>
  )
}
