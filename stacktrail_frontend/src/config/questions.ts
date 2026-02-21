// Must match backend PENALTIES / FINDING_DEFS keys. Values: yes | no | partial | enforced
export const CHECKUP_QUESTIONS: { key: string; label: string; options?: ('yes' | 'no' | 'partial')[] }[] = [
  { key: 'mfa_all', label: 'Do all staff use 2-step login (MFA) for work accounts?', options: ['yes', 'partial', 'no'] },
  { key: 'admin_protection', label: 'Are admin accounts protected (separate accounts, MFA)?', options: ['yes', 'no'] },
  { key: 'shared_logins', label: 'Do you avoid shared logins for critical systems (email, payments, etc.)?', options: ['yes', 'no'] },
  { key: 'mfa_payments', label: 'Is MFA enabled on payment platforms (Stripe, Square, QuickBooks)?', options: ['yes', 'no'] },
  { key: 'email_forwarding', label: 'Is automatic email forwarding restricted or monitored?', options: ['yes', 'partial', 'no'] },
  { key: 'file_sharing_limited', label: 'Is file sharing limited to your organization (not public)?', options: ['yes', 'partial', 'no'] },
  { key: 'access_review', label: 'Do you review who has access to what at least quarterly?', options: ['yes', 'no'] },
  { key: 'independent_backups', label: 'Do you have backups outside your main SaaS (e.g. Backupify, Spanning)?', options: ['yes', 'partial', 'no'] },
  { key: 'restore_tested', label: 'Have you tested a restore in the last 6 months?', options: ['yes', 'no'] },
  { key: 'phishing_training', label: 'Do staff get phishing awareness training (e.g. quarterly)?', options: ['yes', 'no'] },
  { key: 'incident_plan', label: 'Do you have a simple incident response plan (who to call, what to do first)?', options: ['yes', 'no'] },
  { key: 'domain_email_protection', label: 'Do you have SPF, DKIM, and DMARC set up for your domain?', options: ['yes', 'no'] },
]
