import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as api from '@/api/client'

const BUSINESS_TYPES = [
  { value: 'law_firm', label: 'Law firm' },
  { value: 'medical', label: 'Medical practice' },
  { value: 'retail', label: 'Retail' },
  { value: 'startup', label: 'Startup / SaaS' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'other', label: 'Other' },
]

const REVENUE_RANGES = [
  { value: 'lt_250k', label: '< $250k' },
  { value: '250k_1m', label: '$250k – $1M' },
  { value: '1m_5m', label: '$1M – $5M' },
  { value: 'gt_5m', label: '> $5M' },
]

const DOWNTIME_IMPACTS = [
  { value: 'minor', label: 'Minor inconvenience' },
  { value: 'lose_money', label: 'We miss deadlines / lose money' },
  { value: 'cant_operate', label: "We can't operate" },
]

export default function OrgNew() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    business_type: 'other',
    employee_count: 5,
    revenue_range: 'lt_250k',
    work_style: 'hybrid',
    downtime_impact: 'lose_money',
    primary_domain: '',
    saas_stack: {} as Record<string, string>,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const org = await api.createOrg(form)
      navigate(`/orgs/${org.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link to="/orgs" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)]">← Organizations</Link>
      </div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Add organization</h1>
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-6 space-y-4">
        {error && (
          <div className="text-sm text-[var(--accent-red)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 px-3 py-2 rounded-lg">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Organization name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Primary domain</label>
          <input
            type="text"
            placeholder="example.com"
            value={form.primary_domain}
            onChange={(e) => setForm({ ...form, primary_domain: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Business type</label>
          <select
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          >
            {BUSINESS_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Employee count</label>
          <input
            type="number"
            min={1}
            max={25}
            value={form.employee_count}
            onChange={(e) => setForm({ ...form, employee_count: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Revenue range</label>
          <select
            value={form.revenue_range}
            onChange={(e) => setForm({ ...form, revenue_range: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          >
            {REVENUE_RANGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">If systems go down</label>
          <select
            value={form.downtime_impact}
            onChange={(e) => setForm({ ...form, downtime_impact: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-[var(--text-primary)]"
          >
            {DOWNTIME_IMPACTS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="pt-4 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-[var(--radius-pill)] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create organization'}
          </button>
          <Link to="/orgs" className="px-4 py-2 border border-[#333] rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
