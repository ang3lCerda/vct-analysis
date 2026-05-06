import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const leftLinks = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Analysis', to: '/analysis' },
  { label: 'Visualization', to: '/visualization' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `transition-colors ${isActive ? 'text-red-400' : 'hover:text-red-400'}`
}

export default function Navbar() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-vct-900 text-white px-6 py-4 flex items-center justify-between">
      {/* Left: brand + main links */}
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold tracking-wide">VCT Analysis</span>
        <ul className="flex gap-6 text-sm font-medium">
          {leftLinks.map(({ label, to }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} className={navClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: journal + auth */}
      <ul className="flex items-center gap-6 text-sm font-medium">
        {token && (
          <li>
            <NavLink to="/journal" className={navClass}>
              Journal
            </NavLink>
          </li>
        )}
        <li>
          {token ? (
            <button
              onClick={handleLogout}
              className="bg-vct-800 hover:bg-vct-700 border border-vct-700 rounded-lg px-4 py-1.5 text-sm transition-colors"
            >
              Log out
            </button>
          ) : (
            <NavLink
              to="/login"
              className="bg-red-500 hover:bg-red-400 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              Log in
            </NavLink>
          )}
        </li>
      </ul>
    </nav>
  )
}
