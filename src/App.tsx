import { useState } from 'react'
import Navbar from './components/Navbar'
import type { Page } from './components/Navbar'
import EventsListPage from './pages/EventsListPage'
import EventsPage from './pages/EventsPage'
import AnalysisPage from './pages/AnalysisPage'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const handleNavigate = (p: Page) => {
    setPage(p)
    setSelectedEventId(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar activePage={page} onNavigate={handleNavigate} />

      {page === 'events' && !selectedEventId && (
        <EventsListPage onSelectEvent={id => setSelectedEventId(id)} />
      )}
      {page === 'events' && selectedEventId && (
        <EventsPage eventId={selectedEventId} onBack={() => setSelectedEventId(null)} />
      )}
      {page === 'analysis' && <AnalysisPage />}
      {page === 'home' && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Select a section from the navbar
        </div>
      )}
    </div>
  )
}

export default App
