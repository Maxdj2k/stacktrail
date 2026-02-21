import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/orgs', label: 'Organizations' },
  { to: '/settings/apis', label: 'Settings › APIs' },
]

export default function Layout() {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] relative">
      <aside className="w-56 flex-shrink-0 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col">
        <div className="p-5 border-b border-[var(--border)]">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-teal-400">StackTrail</span>
          </Link>
          <p className="text-xs text-slate-400 mt-1">Cyber Checkup</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to || location.pathname.startsWith(to + '/')
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
