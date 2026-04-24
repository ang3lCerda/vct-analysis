import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import EventsListPage from './pages/EventsListPage'
import EventsPage from './pages/EventsPage'
import AnalysisPage from './pages/AnalysisPage'
import VisualizationPage from './pages/VisualizationPage'

function Home() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Select a section from the navbar
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-vct-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/:eventId" element={<EventsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/visualization" element={<VisualizationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
