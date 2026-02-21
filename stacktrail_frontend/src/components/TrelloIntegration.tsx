import { useState } from 'react'
import * as api from '@/api/client'

export function TrelloIntegrationPanel({
  orgId,
  integrations,
  onUpdate,
}: {
  orgId: number
  integrations: api.OrgIntegrationItem[]
  onUpdate: (list: api.OrgIntegrationItem[]) => void
}) {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      await api.connectOrgIntegration(orgId, 'trello', config)
      const list = await api.listOrgIntegrations(orgId)
      onUpdate(list)
      setMsg('Trello connected. Cards will go to your Suggestions list.')
      setConfig({})
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const trelloConnected = integrations.some((i) => i.provider === 'trello')
  return (
    <div className="mt-3 p-4 bg-slate-800/80 rounded-xl border border-slate-700 max-w-xl">
      <p className="text-sm text-slate-300 mb-3">
        Connect Trello so checklist suggestions become cards in your <strong className="text-slate-200">Suggestions</strong> list (demo: retail store).
      </p>
      {trelloConnected && (
        <p className="text-sm text-slate-500 mb-2">Trello connected. Add again to update API key, token, or list ID.</p>
      )}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Trello API key"
          value={config.api_key ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, api_key: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
        />
        <input
          type="password"
          placeholder="Trello token"
          value={config.token ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, token: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
        />
        <input
          type="text"
          placeholder="Suggestions list ID (from your Trello board)"
          value={config.list_id ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, list_id: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
        />
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="px-4 py-2 bg-teal-500 text-slate-900 rounded-lg text-sm font-medium hover:bg-teal-400 disabled:opacity-50"
      >
        {saving ? 'Connecting…' : 'Connect Trello'}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.includes('connected') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
    </div>
  )
}
