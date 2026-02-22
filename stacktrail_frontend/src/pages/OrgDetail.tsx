import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import * as api from '@/api/client'
import type { Organization, Assessment, Finding } from '@/api/types'
import { CHECKUP_QUESTIONS } from '@/config/questions'

const SCORE_COLORS = ['#2f54eb', '#e2e8f0'] // blue, slate

const SMALL_BUSINESS_GUIDES = [
  { name: 'Square', tip: 'Enable 2FA and restrict staff access in Square Dashboard → Account → Security.', url: 'https://squareup.com/help' },
  { name: 'Shopify', tip: 'Turn on 2FA and review staff permissions in Settings → Users and permissions.', url: 'https://help.shopify.com' },
  { name: 'QuickBooks', tip: 'Use strong passwords and 2FA; limit user access in Company → Manage Users.', url: 'https://quickbooks.intuit.com/learn-support' },
  { name: 'Google Workspace', tip: 'Enable 2-step verification and use a strong password; avoid signing in on shared devices.', url: 'https://support.google.com/a/answer/9176657' },
  { name: 'POS / Registers', tip: 'Lock down admin settings, use separate logins per employee, and reconcile daily.', url: '#' },
] as const

function statusBadge(value: string) {
  const v = value === 'yes' || value === 'enforced' ? 'yes' : value === 'partial' ? 'partial' : 'no'
  const label = v === 'yes' ? 'Yes' : v === 'partial' ? 'Partial' : 'No'
  const bg = v === 'yes' ? 'bg-[var(--accent-blue)]/20 text-[#597ef7]' : v === 'partial' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg}`}>{label}</span>
}

export default function OrgDetail() {
  const { id } = useParams<{ id: string }>()
  const [org, setOrg] = useState<Organization | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<api.OrgIntegrationItem[]>([])
  const [ticketCreating, setTicketCreating] = useState<string | null>(null)
  const [ticketResult, setTicketResult] = useState<Record<string, { url?: string; key?: string; error?: string }>>({})
  const [aiSuggestionsByKey, setAISuggestionsByKey] = useState<Record<string, string[]>>({})
  const [aiTagsByKey, setAITagsByKey] = useState<Record<string, string[]>>({})
  const [aiSuggestionsLoading, setAISuggestionsLoading] = useState<string | null>(null)
  const [mockGoogleResultByKey, setMockGoogleResultByKey] = useState<Record<string, string>>({})
  const [mockGoogleLoading, setMockGoogleLoading] = useState<string | null>(null)
  const [workflowRunning, setWorkflowRunning] = useState(false)
  const [workflowResult, setWorkflowResult] = useState<{ created: number; errors: number } | null>(null)
  const actionItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [assessmentHistoryOpen, setAssessmentHistoryOpen] = useState(false)

  const orgId = id ? parseInt(id, 10) : NaN

  useEffect(() => {
    if (!id || isNaN(orgId)) return
    Promise.all([api.getOrg(orgId), api.listOrgAssessments(orgId)])
      .then(([o, a]) => {
        setOrg(o)
        setAssessments(a)
        const latestCompleted = a.find((x) => x.completed_at)
        setNotesDraft(latestCompleted?.checklist_notes ?? {})
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, orgId])

  useEffect(() => {
    if (!orgId || isNaN(orgId)) return
    api.listOrgIntegrations(orgId).then(setIntegrations).catch(() => setIntegrations([]))
  }, [orgId])

  const latest = assessments.find((a) => a.completed_at)

  useEffect(() => {
    if (!latest?.id) return
    api.getAssessmentFindings(latest.id).then(setFindings).catch(() => setFindings([]))
  }, [latest?.id])

  const saveNote = async (key: string, value: string) => {
    if (!latest) return
    setSavingNote(key)
    const next = { ...(latest.checklist_notes || {}), [key]: value }
    if (!value.trim()) delete next[key]
    try {
      const updated = await api.updateAssessmentChecklistNotes(latest.id, next)
      setAssessments((prev) => prev.map((a) => (a.id === latest.id ? updated : a)))
      setNotesDraft(updated.checklist_notes ?? {})
    } finally {
      setSavingNote(null)
    }
  }

  const riskColor =
    latest?.risk_band === 'Low'
      ? 'text-emerald-400'
      : latest?.risk_band === 'Moderate'
        ? 'text-amber-400'
        : latest?.risk_band === 'High'
          ? 'text-orange-400'
          : 'text-red-400'

  const pieData =
    latest != null
      ? [
          { name: 'Score', value: latest.score, fill: SCORE_COLORS[0] },
          { name: 'Remaining', value: 100 - latest.score, fill: SCORE_COLORS[1] },
        ]
      : []

  const findingsByKey = Object.fromEntries(findings.map((f) => [f.key, f]))

  if (loading || !org) {
    if (error) {
      return (
        <div className="p-8">
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-[var(--radius-md)]">{error}</div>
          <Link to="/dashboard" className="mt-4 inline-block text-[var(--accent-blue)] hover:underline">← Dashboard</Link>
        </div>
      )
    }
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 bg-[var(--bg-card)] rounded w-64 mb-6" />
        <div className="h-48 bg-[var(--bg-card)] rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)]">← Dashboard</Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{org.name}</h1>
          <p className="text-[var(--text-secondary)] mt-1">{org.primary_domain || '—'}</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-2 capitalize">{org.business_type?.replace('_', ' ')} · {org.employee_count} employees</p>
        </div>
        <Link
          to={`/orgs/${org.id}/checkup`}
          className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-colors inline-flex items-center"
        >
          Run Cyber Checkup
        </Link>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-6 max-w-5xl">
        <div className="flex-1 min-w-0 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white mb-5">{org.name}</h2>
            {latest ? (
              <div className="flex flex-wrap items-center gap-8 sm:gap-10">
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={pieData[i].fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => [`${value ?? 0}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    <p className="text-2xl font-bold text-[var(--accent-blue)]">{latest.score}<span className="text-[var(--text-secondary)] font-medium text-lg">/100</span></p>
                    <p className="text-[var(--text-tertiary)] text-sm">Cyber Health Score</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 sm:gap-8">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Risk band</p>
                    <p className={`text-lg font-semibold mt-0.5 ${riskColor}`}>{latest.risk_band}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Insurance readiness</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5 capitalize">{latest.insurance_readiness?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Breach impact (est.)</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">${latest.breach_cost_low?.toLocaleString()} – ${latest.breach_cost_high?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 min-h-[120px]">
                <p className="text-[var(--text-secondary)] text-sm">Run Cyber Checkup to see your score and details.</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-[160px] max-w-[260px] bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-5 flex flex-col min-h-0">
          <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide shrink-0 mb-2">Action items</p>
          <div className="flex-1 min-h-0 flex items-center justify-center py-1">
            <div className="grid grid-cols-4 gap-2 w-full max-w-[220px] aspect-[4/3] [&>button]:aspect-square [&>button]:w-full [&>button]:min-w-0 [&>button]:max-h-full">
              {CHECKUP_QUESTIONS.map((q) => {
                const value = latest?.answers?.[q.key] ?? null
                const cellClass =
                  value === 'yes' || value === 'enforced'
                    ? 'bg-[var(--accent-green)] shadow-[0_0_2px_rgba(82,196,26,0.4)]'
                    : value === 'partial'
                      ? 'bg-[var(--accent-yellow)]'
                      : value === 'no'
                        ? 'bg-[var(--accent-red)]'
                        : 'bg-[#222]'
                return (
                  <button
                    key={q.key}
                    type="button"
                    title={q.label}
                    onClick={() => {
                      if (latest) {
                        setExpandedKey((k) => (k === q.key ? null : q.key))
                        setTimeout(() => actionItemRefs.current[q.key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
                      }
                    }}
                    className={`rounded-[4px] transition-all hover:ring-2 hover:ring-[var(--accent-blue)] hover:ring-offset-1 hover:ring-offset-[var(--bg-card)] ${cellClass}`}
                  />
                )
              })}
            </div>
          </div>
          {latest && (
            <div className="shrink-0 mt-2 pt-2 border-t border-[#222] flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-green)] shrink-0" /> Done</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-yellow)] shrink-0" /> Partial</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-red)] shrink-0" /> To do</span>
            </div>
          )}
        </div>
      </div>

      {latest && (
        <div className="grid gap-6 lg:grid-cols-5 mb-8">
          <div className="lg:col-span-3 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-6 min-h-[560px] flex flex-col order-2 lg:order-1">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold text-white text-lg">Action items</h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Expand an item to add notes or create tickets with to-dos and AI suggestions.</p>
              </div>
              {integrations.some((i) => i.provider === 'trello') && (
                <button
                  type="button"
                  disabled={workflowRunning}
                  onClick={async () => {
                    setWorkflowRunning(true)
                    setWorkflowResult(null)
                    try {
                      const result = await api.runWorkflow(orgId, latest.id, true)
                      setWorkflowResult({ created: result.created.length, errors: result.errors.length })
                    } catch {
                      setWorkflowResult({ created: 0, errors: 1 })
                    } finally {
                      setWorkflowRunning(false)
                    }
                  }}
                  className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {workflowRunning ? 'Running…' : 'Run workflow: create tickets for all findings'}
                </button>
              )}
            </div>
            {workflowResult && (
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Workflow: {workflowResult.created} ticket(s) created, {workflowResult.errors} error(s).
              </p>
            )}
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2 max-h-[70vh]">
              {CHECKUP_QUESTIONS.map((q) => {
                const value = latest.answers?.[q.key] ?? 'no'
                const isExpanded = expandedKey === q.key
                const finding = findingsByKey[q.key]
                const note = notesDraft[q.key] ?? latest.checklist_notes?.[q.key] ?? ''
                return (
                  <div
                    key={q.key}
                    ref={(el) => { actionItemRefs.current[q.key] = el }}
                    className={`rounded-[var(--radius-lg)] border overflow-hidden transition-shadow ${isExpanded ? 'border-[var(--accent-blue)]/50 ring-1 ring-[var(--accent-blue)]/20 bg-[var(--bg-card)]' : 'border-[#1a1a1a] bg-[var(--bg-card)]/60 hover:border-[#333]'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedKey(isExpanded ? null : q.key)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--bg-card)]/50 transition-colors rounded-[var(--radius-lg)]"
                    >
                      <span className="font-medium text-[var(--text-primary)] text-base">{q.label}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        {statusBadge(value)}
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] ${isExpanded ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-[#1a1a1a] bg-[var(--bg-input)]/50 px-5 py-5 space-y-5 rounded-b-xl">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes — why this isn’t done yet (optional)</label>
                          <textarea
                            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[#333] rounded-[var(--radius-md)] text-sm text-white placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent-blue)]/50 focus:border-[var(--accent-blue)]"
                            rows={4}
                            placeholder="e.g. Rolling out next quarter; waiting on IT."
                            value={notesDraft[q.key] ?? note}
                            onChange={(e) => setNotesDraft((prev) => ({ ...prev, [q.key]: e.target.value }))}
                          />
                          <button
                            type="button"
                            disabled={savingNote === q.key}
                            onClick={() => saveNote(q.key, notesDraft[q.key] ?? note)}
                            className="mt-2 text-sm font-medium text-[var(--accent-blue)] hover:underline disabled:opacity-50"
                          >
                            {savingNote === q.key ? 'Saving…' : 'Save note'}
                          </button>
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Suggestions to check this off</span>
                          {finding ? (
                            <div className="text-sm text-[var(--text-secondary)] space-y-2">
                              <p>{finding.explanation}</p>
                              {finding.remediation_steps?.length > 0 && (
                                <ul className="list-disc list-inside space-y-0.5">
                                  {finding.remediation_steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-[var(--text-tertiary)]">No suggestions for this item.</p>
                          )}
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1">AI suggestions</span>
                          {aiSuggestionsByKey[q.key]?.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-0.5 mb-2">
                              {aiSuggestionsByKey[q.key].map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          ) : null}
                          {aiTagsByKey[q.key]?.length > 0 ? (
                            <div className="mb-2">
                              <p className="text-sm text-[var(--text-secondary)] mb-2">
                                <span className="font-medium">Suggested tags (Google Workspace):</span>{' '}
                                {aiTagsByKey[q.key].map((t, i) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-[#333] text-[var(--text-primary)] text-xs font-medium mr-1 mt-1">
                                    {t}
                                  </span>
                                ))}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={mockGoogleLoading === q.key}
                                  onClick={async () => {
                                    setMockGoogleLoading(q.key)
                                    setMockGoogleResultByKey((prev) => ({ ...prev, [q.key]: '' }))
                                    try {
                                      const res = await api.createMockGoogleWorkspaceTag(
                                        orgId,
                                        q.key,
                                        aiTagsByKey[q.key] ?? [],
                                        aiSuggestionsByKey[q.key] ?? []
                                      )
                                      setMockGoogleResultByKey((prev) => ({ ...prev, [q.key]: res.message }))
                                    } catch (e) {
                                      setMockGoogleResultByKey((prev) => ({ ...prev, [q.key]: (e as Error).message }))
                                    } finally {
                                      setMockGoogleLoading(null)
                                    }
                                  }}
                                  className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
                                >
                                  {mockGoogleLoading === q.key ? 'Creating…' : 'Create tags in Google Workspace (demo)'}
                                </button>
                                {mockGoogleResultByKey[q.key] && (
                                  <span className="text-sm text-[var(--text-secondary)]">{mockGoogleResultByKey[q.key]}</span>
                                )}
                              </div>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            disabled={!latest?.id || aiSuggestionsLoading === q.key}
                            onClick={async () => {
                              if (!latest?.id) return
                              setAISuggestionsLoading(q.key)
                              try {
                                const data = await api.getAISuggestions(latest.id, q.key, q.label)
                                const suggestions = 'finding_key' in data ? data.suggestions : (data.findings?.find((x) => x.finding_key === q.key)?.suggestions ?? [])
                                const tags = 'finding_key' in data ? (data.tags ?? []) : (data.findings?.find((x) => x.finding_key === q.key)?.tags ?? [])
                                setAISuggestionsByKey((prev) => ({ ...prev, [q.key]: suggestions }))
                                setAITagsByKey((prev) => ({ ...prev, [q.key]: tags }))
                              } finally {
                                setAISuggestionsLoading(null)
                              }
                            }}
                            className="text-sm font-medium text-[var(--accent-blue)] hover:underline disabled:opacity-50"
                          >
                            {aiSuggestionsLoading === q.key ? 'Generating…' : aiSuggestionsByKey[q.key]?.length ? 'Regenerate AI suggestions' : 'Generate AI suggestions'}
                          </button>
                        </div>
                        {finding && latest && (
                          <div>
                            <span className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Add to Trello → Suggestions (demo)</span>
                            {integrations.some((i) => i.provider === 'trello') ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={ticketCreating === `${q.key}-trello`}
                                  onClick={async () => {
                                    const key = `${q.key}-trello`
                                    setTicketCreating(key)
                                    setTicketResult((prev) => ({ ...prev, [key]: {} }))
                                    try {
                                      const data = await api.createTicket(
                                        orgId,
                                        'trello',
                                        latest.id,
                                        q.key,
                                        aiSuggestionsByKey[q.key]?.length ? aiSuggestionsByKey[q.key] : undefined
                                      )
                                      setTicketResult((prev) => ({
                                        ...prev,
                                        [key]: data.url ? { url: data.url } : {},
                                      }))
                                    } catch (e) {
                                      setTicketResult((prev) => ({ ...prev, [key]: { error: (e as Error).message } }))
                                    } finally {
                                      setTicketCreating(null)
                                    }
                                  }}
                                  className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] bg-[#0079bf] text-white hover:bg-[#026aa7] disabled:opacity-50"
                                >
                                  {ticketCreating === `${q.key}-trello` ? 'Creating…' : 'Add card to Trello (Suggestions)'}
                                </button>
                                {ticketResult[`${q.key}-trello`]?.url && (
                                  <a href={ticketResult[`${q.key}-trello`].url} target="_blank" rel="noreferrer" className="text-sm text-[var(--accent-blue)] hover:underline">
                                    Open card →
                                  </a>
                                )}
                                {ticketResult[`${q.key}-trello`]?.error && (
                                  <span className="text-sm text-red-400">{ticketResult[`${q.key}-trello`].error}</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-[var(--text-tertiary)]">
                                Connect Trello in <Link to="/settings/apis" className="text-[var(--accent-blue)] hover:underline">Settings → APIs</Link> to add cards to your Suggestions list.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] overflow-hidden order-1 lg:order-2">
            <button
              type="button"
              onClick={() => setAssessmentHistoryOpen((o) => !o)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--bg-card)]/50 transition-colors"
            >
              <h2 className="font-semibold text-white">Assessment history</h2>
              <span className="text-[var(--text-secondary)]">{assessmentHistoryOpen ? '▼' : '▶'}</span>
            </button>
            {assessmentHistoryOpen && (
              <div className="border-t border-[#1a1a1a] divide-y divide-[#1a1a1a] max-h-[40vh] overflow-y-auto">
                {assessments.slice(0, 10).map((a) => (
                  <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-[var(--text-primary)] text-sm">Score {a.score}/100</span>
                      <span className="ml-2 text-[var(--text-tertiary)] text-xs">{a.risk_band}</span>
                      <span className="ml-2 text-[var(--text-tertiary)] text-xs">
                        {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                    {a.completed_at && (
                      <Link
                        to={`/assessments/${a.id}`}
                        className="text-sm font-medium text-[var(--accent-blue)] hover:underline"
                      >
                        View results
                      </Link>
                    )}
                  </div>
                ))}
                {assessments.length === 0 && (
                  <div className="px-6 py-8 text-center text-[var(--text-tertiary)] text-sm">
                    No assessments yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a]">
        <h2 className="font-semibold text-white mb-3">Quick security tips for tools many small businesses use</h2>
        <ul className="space-y-3">
          {SMALL_BUSINESS_GUIDES.map((g) => (
            <li key={g.name} className="text-sm">
              <span className="font-medium text-[var(--text-primary)]">{g.name}:</span>{' '}
              <span className="text-[var(--text-secondary)]">{g.tip}</span>{' '}
              {g.url !== '#' && (
                <a href={g.url} target="_blank" rel="noreferrer" className="text-[var(--accent-blue)] hover:underline">
                  Help →
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
