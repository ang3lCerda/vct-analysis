import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Analysis', to: '/analysis' },
  { label: 'Visualization', to: '/visualization' },
]

export default function Navbar() {
  return (
    <nav className="bg-vct-900 text-white px-6 py-4 flex items-center justify-between">
      <span className="text-xl font-bold tracking-wide">VCT Analysis</span>
      <ul className="flex gap-6 text-sm font-medium">
        {links.map(({ label, to }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `transition-colors ${isActive ? 'text-red-400' : 'hover:text-red-400'}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
