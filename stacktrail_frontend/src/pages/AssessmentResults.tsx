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
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>
          <Link to="/dashboard" className="mt-4 inline-block text-teal-400 hover:underline">← Dashboard</Link>
        </div>
      )
    }
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 bg-slate-700 rounded w-64 mb-6" />
        <div className="h-64 bg-slate-700 rounded-xl" />
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
        <Link to={`/orgs/${assessment.organization.id}`} className="text-sm text-slate-400 hover:text-teal-400">← Back to {assessment.organization.name}</Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Checkup results</h1>
        <p className="text-slate-500 mt-1">{assessment.organization.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6">
          <p className="text-sm font-medium text-slate-500">Cyber Health Score</p>
          <p className="text-4xl font-bold text-white mt-1">{assessment.score}<span className="text-xl text-slate-400">/100</span></p>
        </div>
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6">
          <p className="text-sm font-medium text-slate-500">Risk band</p>
          <p className={`text-xl font-semibold mt-1 px-2 py-1 rounded-lg inline-block ${riskColor}`}>{assessment.risk_band}</p>
        </div>
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6">
          <p className="text-sm font-medium text-slate-500">Insurance readiness</p>
          <p className="text-lg font-medium text-slate-200 mt-1 capitalize">{assessment.insurance_readiness?.replace('_', ' ')}</p>
        </div>
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6">
          <p className="text-sm font-medium text-slate-500">Est. breach impact</p>
          <p className="text-lg font-medium text-slate-200 mt-1">${assessment.breach_cost_low?.toLocaleString()} – ${assessment.breach_cost_high?.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Top fixes</h2>
          <p className="text-sm text-slate-500 mt-0.5">Prioritized by impact and effort</p>
        </div>
        <ul className="divide-y divide-slate-700">
          {topFindings.map((f) => (
            <li key={f.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    f.severity === 'high' ? 'bg-red-500/20 text-red-300' : f.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-600 text-slate-300'
                  }`}>
                    {f.severity}
                  </span>
                  <h3 className="font-medium text-white mt-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{f.explanation}</p>
                  {f.remediation_steps?.length > 0 && (
                    <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-0.5">
                      {f.remediation_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">~{f.time_to_fix_minutes} min</span>
              </div>
            </li>
          ))}
        </ul>
        {findings.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            No findings. Your answers indicate good baseline practices.
          </div>
        )}
      </div>
    </div>
  )
}
