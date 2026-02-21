import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1222] via-[#131d33] to-[#0c1222] text-white flex flex-col items-center justify-center px-6 relative">
      <div className="max-w-2xl text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-teal-400 mb-4 drop-shadow-[0_0_20px_rgba(45,212,191,0.2)]">
          StackTrail
        </h1>
        <p className="text-xl text-slate-300 mb-2">
          Cyber health for small businesses
        </p>
        <p className="text-slate-400 mb-10">
          Get a clear Cyber Health Score and actionable fixes in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg font-medium bg-white/10 text-white border border-slate-500/50 hover:bg-white/15 hover:border-teal-500/30 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 rounded-lg font-medium bg-teal-500 text-slate-900 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  )
}
