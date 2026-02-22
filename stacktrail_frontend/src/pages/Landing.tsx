import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          StackTrail <span className="bg-gradient-to-r from-[#85a5ff] to-[var(--accent-blue)] bg-clip-text text-transparent">Cyber Checkup</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-2">
          Cyber health for small businesses
        </p>
        <p className="text-[var(--text-tertiary)] mb-10">
          Get a clear Cyber Health Score and actionable fixes in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 rounded-[var(--radius-pill)] font-medium bg-[var(--bg-card)] text-[var(--text-primary)] border border-[#333] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 rounded-[var(--radius-pill)] font-medium bg-[var(--accent-blue)] text-white hover:opacity-90 transition-colors shadow-[0_8px_24px_rgba(47,84,235,0.4)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  )
}
