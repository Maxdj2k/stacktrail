import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/orgs', label: 'Organizations', icon: 'orgs' },
  { to: '/settings/apis', label: 'Settings', icon: 'settings' },
]

const IconGrid = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IconOrgs = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const IconSettings = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)
const IconLogout = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export default function Layout() {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'grid': return <IconGrid />
      case 'orgs': return <IconOrgs />
      case 'settings': return <IconSettings />
      default: return <IconGrid />
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] relative">
      <aside className="w-20 flex-shrink-0 border-r border-[#1a1a1a] flex flex-col items-center py-5 gap-8 flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-[#333] bg-gradient-to-br from-[#333] to-[#444] border-2 border-[var(--bg-app)] shrink-0" title="StackTrail" />
        <nav className="flex flex-col items-center gap-2 flex-1 min-h-0">
          {nav.map(({ to, label, icon }) => {
            const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to + '/'))
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                  active
                    ? 'bg-[var(--bg-card-hover)] text-[var(--accent-blue)] [&_svg]:stroke-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {renderIcon(icon)}
              </Link>
            )
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all duration-200 mt-auto shrink-0"
        >
          <IconLogout />
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto min-h-0 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
