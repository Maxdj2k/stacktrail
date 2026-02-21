import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import * as api from '@/api/client'
import { CHECKUP_QUESTIONS } from '@/config/questions'
import type { Organization, Assessment } from '@/api/types'

export default function CheckupWizard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const orgId = id ? parseInt(id, 10) : NaN
  const [org, setOrg] = useState<Organization | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || isNaN(orgId)) return
    api.getOrg(orgId).then(setOrg).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id, orgId])

  const startCheckup = async () => {
    if (!orgId) return
    setError('')
    try {
      const a = await api.startAssessment(orgId)
      setAssessment(a)
      setStep(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkup')
    }
  }

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const currentQuestion = CHECKUP_QUESTIONS[step]
  const options = currentQuestion?.options ?? ['yes', 'no']

  const submitCheckup = async () => {
    if (!assessment) return
    setError('')
    setSubmitting(true)
    try {
      const completed = await api.submitAssessment(assessment.id, answers)
      navigate(`/assessments/${completed.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !org) {
    if (error) {
      return (
        <div className="p-8">
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
          <Link to="/dashboard" className="mt-4 inline-block text-teal-600 hover:underline">← Dashboard</Link>
        </div>
      )
    }
    return <div className="p-8"><div className="animate-pulse h-8 bg-slate-200 rounded w-64" /></div>
  }

  if (!assessment) {
    return (
      <div className="p-8 max-w-lg">
        <Link to={`/orgs/${orgId}`} className="text-sm text-slate-500 hover:text-teal-600">← Back to {org.name}</Link>
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-800">Cyber Checkup</h1>
          <p className="text-slate-500 mt-2">Answer 12 short questions about {org.name}. Takes about 3–5 minutes.</p>
          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <button onClick={startCheckup} className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
            Start checkup
          </button>
        </div>
      </div>
    )
  }

  if (step >= CHECKUP_QUESTIONS.length) {
    return (
      <div className="p-8 max-w-lg">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-800">All set</h1>
          <p className="text-slate-500 mt-2">Submit to get your Cyber Health Score.</p>
          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <div className="mt-6 flex gap-3">
            <button onClick={submitCheckup} disabled={submitting} className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit & see results'}
            </button>
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/orgs/${orgId}`} className="text-sm text-slate-500 hover:text-teal-600">← Back</Link>
        <span className="text-sm text-slate-500">Question {step + 1} of {CHECKUP_QUESTIONS.length}</span>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">{currentQuestion.label}</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setAnswer(currentQuestion.key, opt)
                if (step < CHECKUP_QUESTIONS.length - 1) setStep(step + 1)
                else setStep(step + 1)
              }}
              className={answers[currentQuestion.key] === opt ? 'px-5 py-2.5 rounded-lg font-medium bg-teal-600 text-white' : 'px-5 py-2.5 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200'}
            >
              {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Partially'}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="mt-6 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Previous</button>
        )}
      </div>
    </div>
  )
}
