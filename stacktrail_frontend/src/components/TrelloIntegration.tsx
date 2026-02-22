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
    <div className="mt-3 p-5 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] max-w-xl">
      <p className="text-sm text-[var(--text-secondary)] mb-3">
        Connect Trello so checklist suggestions become cards in your <strong className="text-[var(--text-primary)]">Suggestions</strong> list (demo: retail store).
      </p>
      {trelloConnected && (
        <p className="text-sm text-[var(--text-tertiary)] mb-2">Trello connected. Add again to update API key, token, or list ID.</p>
      )}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Trello API key"
          value={config.api_key ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, api_key: e.target.value }))}
          className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
        <input
          type="password"
          placeholder="Trello token"
          value={config.token ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, token: e.target.value }))}
          className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          placeholder="Suggestions list ID (from your Trello board)"
          value={config.list_id ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, list_id: e.target.value }))}
          className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="px-5 py-2.5 bg-[var(--accent-blue)] text-white rounded-[var(--radius-pill)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Connecting…' : 'Connect Trello'}
      </button>
      {msg && <p className={`mt-2 text-sm ${msg.includes('connected') ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>{msg}</p>}
    </div>
  )
}
