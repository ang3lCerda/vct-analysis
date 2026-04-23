type Page = 'home' | 'events' | 'matches' | 'stats' | 'analysis'

interface NavbarProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

const links: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Events', page: 'events' },
  { label: 'Matches', page: 'matches' },
  { label: 'Stats', page: 'stats' },
  { label: 'Analysis', page: 'analysis' },
]

function Navbar({ activePage, onNavigate }: NavbarProps) {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <span className="text-xl font-bold tracking-wide">VCT Analysis</span>
      <ul className="flex gap-6 text-sm font-medium">
        {links.map(({ label, page }) => (
          <li key={page}>
            <button
              onClick={() => onNavigate(page)}
              className={`transition-colors ${
                activePage === page ? 'text-red-400' : 'hover:text-red-400'
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
export type { Page }
