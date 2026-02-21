export interface Organization {
  id: number
  owner: number
  name: string
  business_type: string
  employee_count: number
  revenue_range: string
  work_style: string
  downtime_impact: string
  primary_domain: string
  saas_stack: Record<string, string>
  created_at: string
}

export interface Assessment {
  id: number
  organization: Organization
  created_at: string
  completed_at: string | null
  answers: Record<string, string>
  score: number
  risk_band: string
  breach_cost_low: number
  breach_cost_high: number
  downtime_days_low: number
  downtime_days_high: number
  insurance_readiness: string
  checklist_notes?: Record<string, string>
}

export interface Finding {
  id: number
  key: string
  title: string
  severity: string
  category: string
  impact: string
  time_to_fix_minutes: number
  estimated_risk_reduction_pct: number
  explanation: string
  remediation_steps: string[]
  priority_score: number
}

export interface ScanRun {
  id: number
  organization: number
  scanned_at: string
  overall_scan_status: string
  dns_results?: unknown
  tls_results?: unknown
  website_headers?: unknown
}

export interface ReportRun {
  id: number
  organization: number
  generated_at: string
  summary: string
  top_risks: string[]
  recommendations: { title: string; steps: string[] }[]
}

export interface LoginResponse {
  access: string
  refresh: string
}
