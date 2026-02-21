import { useEffect, useState } from 'react'
import * as api from '@/api/client'
import type { Organization } from '@/api/types'
import { TrelloIntegrationPanel } from '@/components/TrelloIntegration'

export default function SettingsAPIs() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [integrationsByOrg, setIntegrationsByOrg] = useState<Record<number, api.OrgIntegrationItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .listOrgs()
      .then((list) => {
        setOrgs(list)
        return Promise.all(list.map((org) => api.listOrgIntegrations(org.id))).then((integrationsLists) => ({
          list,
          integrationsLists,
        }))
      })
      .then(({ list, integrationsLists }) => {
        const byOrg: Record<number, api.OrgIntegrationItem[]> = {}
        list.forEach((org, i) => {
          byOrg[org.id] = integrationsLists[i] ?? []
        })
        setIntegrationsByOrg(byOrg)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const updateIntegrations = (orgId: number, list: api.OrgIntegrationItem[]) => {
    setIntegrationsByOrg((prev) => ({ ...prev, [orgId]: list }))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 bg-slate-700 rounded w-48 mb-6" />
        <div className="space-y-4">
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
      <h1 className="text-2xl font-semibold text-white mb-1">Settings › APIs</h1>
      <p className="text-slate-400 mb-8">Connect Trello (Suggestions) per organization. Cards from checkup findings will be created in your board’s Suggestions list.</p>

      <div className="space-y-8">
        {orgs.map((org) => (
          <section key={org.id} className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="font-semibold text-white">{org.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{org.primary_domain || '—'}</p>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-400 mb-2">Trello (Suggestions)</p>
              <TrelloIntegrationPanel
                orgId={org.id}
                integrations={integrationsByOrg[org.id] ?? []}
                onUpdate={(list) => updateIntegrations(org.id, list)}
              />
            </div>
          </section>
        ))}
      </div>

      {orgs.length === 0 && (
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-12 text-center">
          <p className="text-slate-400">No organizations yet. Add an organization to configure API connections.</p>
        </div>
      )}
    </div>
  )
}
