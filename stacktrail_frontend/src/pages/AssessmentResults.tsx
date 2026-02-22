import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as api from '@/api/client'
import type { Assessment, Finding } from '@/api/types'

export default function AssessmentResults() {
  const { id } = useParams<{ id: string }>()
  const assessmentId = id ? parseInt(id, 10) : NaN
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || isNaN(assessmentId)) return
    Promise.all([api.getAssessment(assessmentId), api.getAssessmentFindings(assessmentId)])
      .then(([a, f]) => {
        setAssessment(a)
        setFindings(f)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, assessmentId])

  if (loading || !assessment) {
    if (error) {
      return (
        <div className="p-8">
          <div className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 text-[var(--accent-red)] px-4 py-3 rounded-lg">{error}</div>
          <Link to="/dashboard" className="mt-4 inline-block text-[var(--accent-blue)] hover:underline">← Dashboard</Link>
        </div>
      )
    }
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 bg-[var(--bg-card)] rounded w-64 mb-6" />
        <div className="h-64 bg-[var(--bg-card)] rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  const riskColor =
    assessment.risk_band === 'Low'
      ? 'text-emerald-400 bg-emerald-500/20'
      : assessment.risk_band === 'Moderate'
        ? 'text-amber-400 bg-amber-500/20'
        : assessment.risk_band === 'High'
          ? 'text-orange-400 bg-orange-500/20'
          : 'text-red-400 bg-red-500/20'

  const topFindings = findings.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link to={`/orgs/${assessment.organization.id}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)]">← Back to {assessment.organization.name}</Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Checkup results</h1>
        <p className="text-[var(--text-tertiary)] mt-1">{assessment.organization.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-6">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Cyber Health Score</p>
          <p className="text-4xl font-bold text-[var(--text-primary)] mt-1">{assessment.score}<span className="text-xl text-[var(--text-secondary)]">/100</span></p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-6">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Risk band</p>
          <p className={`text-xl font-semibold mt-1 px-2 py-1 rounded-lg inline-block ${riskColor}`}>{assessment.risk_band}</p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-6">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Insurance readiness</p>
          <p className="text-lg font-medium text-[var(--text-primary)] mt-1 capitalize">{assessment.insurance_readiness?.replace('_', ' ')}</p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] p-6">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Est. breach impact</p>
          <p className="text-lg font-medium text-[var(--text-primary)] mt-1">${assessment.breach_cost_low?.toLocaleString()} – ${assessment.breach_cost_high?.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[#1a1a1a] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="font-semibold text-[var(--text-primary)]">Top fixes</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Prioritized by impact and effort</p>
        </div>
        <ul className="divide-y divide-[#1a1a1a]">
          {topFindings.map((f) => (
            <li key={f.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    f.severity === 'high' ? 'bg-red-500/20 text-red-300' : f.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-[#333] text-[var(--text-secondary)]'
                  }`}>
                    {f.severity}
                  </span>
                  <h3 className="font-medium text-[var(--text-primary)] mt-2">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{f.explanation}</p>
                  {f.remediation_steps?.length > 0 && (
                    <ul className="mt-2 text-sm text-[var(--text-secondary)] list-disc list-inside space-y-0.5">
                      {f.remediation_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">~{f.time_to_fix_minutes} min</span>
              </div>
            </li>
          ))}
        </ul>
        {findings.length === 0 && (
          <div className="px-6 py-12 text-center text-[var(--text-tertiary)]">
            No findings. Your answers indicate good baseline practices.
          </div>
        )}
      </div>
    </div>
  )
}
