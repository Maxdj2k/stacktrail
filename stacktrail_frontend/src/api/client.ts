const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('access')
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      window.dispatchEvent(new CustomEvent('stacktrail:unauthorized'))
      throw new Error('Session expired. Please sign in again.')
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const msg = typeof err.detail === 'string'
      ? err.detail
      : Array.isArray(err.detail)
        ? err.detail[0]
        : err.message || (err.username && err.username[0]) || (err.password && err.password[0]) || (err.non_field_errors && err.non_field_errors[0]) || res.statusText
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function login(username: string, password: string) {
  const u = username.trim()
  const p = password
  if (!u || !p) throw new Error('Username and password are required.')
  const data = await api<{ access: string; refresh: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: u, password: p }),
  })
  localStorage.setItem('access', data.access)
  localStorage.setItem('refresh', data.refresh)
  return data
}

export async function register(username: string, password: string, email?: string) {
  const u = username.trim()
  const p = password
  if (!u || !p) throw new Error('Username and password are required.')
  if (p.length < 8) throw new Error('Password must be at least 8 characters.')
  await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: u, password: p, email: (email || '').trim() }),
  })
  return login(u, p)
}

export function logout() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

/** Create 3 demo orgs with scans + assessments for the current user. Returns the new org list. */
export function seedDemo() {
  return api<import('./types').Organization[]>('/seed-demo', { method: 'POST' })
}

export interface DashboardOrg {
  id: number
  name: string
  primary_domain: string
  business_type: string
  latest_assessment: {
    score: number
    risk_band: string
    answers: Record<string, string>
  } | null
}

/** Dashboard summary: orgs with latest assessment (score + answers) for charts. */
export function getDashboardSummary() {
  return api<DashboardOrg[]>('/dashboard')
}

// Orgs
export function listOrgs() {
  return api<import('./types').Organization[]>('/orgs')
}

export function getOrg(id: number) {
  return api<import('./types').Organization>(`/orgs/${id}`)
}

export function createOrg(data: Partial<import('./types').Organization>) {
  return api<import('./types').Organization>('/orgs', { method: 'POST', body: JSON.stringify(data) })
}

export function updateOrg(id: number, data: Partial<import('./types').Organization>) {
  return api<import('./types').Organization>(`/orgs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// Assessments
export function startAssessment(organizationId: number) {
  return api<import('./types').Assessment>('/assessments/start', {
    method: 'POST',
    body: JSON.stringify({ organization_id: organizationId }),
  })
}

export function submitAssessment(id: number, answers: Record<string, string>) {
  return api<import('./types').Assessment>(`/assessments/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export function getAssessment(id: number) {
  return api<import('./types').Assessment>(`/assessments/${id}`)
}

export function updateAssessmentChecklistNotes(
  id: number,
  checklist_notes: Record<string, string>
) {
  return api<import('./types').Assessment>(`/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ checklist_notes }),
  })
}

export function getAssessmentFindings(id: number) {
  return api<import('./types').Finding[]>(`/assessments/${id}/findings`)
}

export function listOrgAssessments(orgId: number) {
  return api<import('./types').Assessment[]>(`/orgs/${orgId}/assessments`)
}

// Scan
export function runScan(orgId: number) {
  return api<import('./types').ScanRun>(`/orgs/${orgId}/scan`, { method: 'POST' })
}

// Reports
export function generateReport(orgId: number) {
  return api<import('./types').ReportRun>(`/orgs/${orgId}/generate-report`, { method: 'POST' })
}

// Integrations (Trello, Jira, Google Workspace)
export type IntegrationProvider = 'trello' | 'jira' | 'google_tasks'
export interface OrgIntegrationItem {
  id: number
  provider: IntegrationProvider
  connected: boolean
  config: Record<string, string>
}

export function listOrgIntegrations(orgId: number) {
  return api<OrgIntegrationItem[]>(`/orgs/${orgId}/integrations`)
}

export function connectOrgIntegration(
  orgId: number,
  provider: IntegrationProvider,
  config: Record<string, string>
) {
  return api<{ id: number; provider: string; connected: boolean }>(`/orgs/${orgId}/integrations`, {
    method: 'POST',
    body: JSON.stringify({ provider, config }),
  })
}

export function createTicket(
  orgId: number,
  provider: IntegrationProvider,
  assessmentId: number,
  findingKey: string,
  aiSuggestions?: string[]
) {
  return api<{ url?: string; id?: string; key?: string }>(`/orgs/${orgId}/create-ticket`, {
    method: 'POST',
    body: JSON.stringify({
      provider,
      assessment_id: assessmentId,
      finding_key: findingKey,
      ...(aiSuggestions?.length ? { ai_suggestions: aiSuggestions } : {}),
    }),
  })
}

// AI suggestions and tags for findings / checklist items
export function getAISuggestions(assessmentId: number, findingKey?: string, questionLabel?: string) {
  return api<{ finding_key: string; suggestions: string[]; tags: string[] } | { findings: { finding_key: string; suggestions: string[]; tags: string[] }[] }>(
    `/assessments/${assessmentId}/ai-suggestions`,
    { method: 'POST', body: JSON.stringify(findingKey ? { finding_key: findingKey, question_label: questionLabel ?? '' } : {}) }
  )
}

// Mock: create tags in Google Workspace (demo only; no real API call)
export function createMockGoogleWorkspaceTag(
  orgId: number,
  findingKey: string,
  tags: string[],
  suggestions: string[]
) {
  return api<{ success: boolean; message: string }>(`/orgs/${orgId}/mock-google-workspace-tag`, {
    method: 'POST',
    body: JSON.stringify({ finding_key: findingKey, tags, suggestions }),
  })
}

// Workflow: create tickets for all findings across integrations
export function runWorkflow(orgId: number, assessmentId: number, includeAiSuggestions = true) {
  return api<{ created: { provider: string; finding_key: string; url?: string; id?: string; key?: string }[]; errors: { provider: string; finding_key: string; detail: string }[] }>(
    `/orgs/${orgId}/run-workflow`,
    {
      method: 'POST',
      body: JSON.stringify({ assessment_id: assessmentId, include_ai_suggestions: includeAiSuggestions }),
    }
  )
}
