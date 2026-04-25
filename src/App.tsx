import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import EventsListPage from './pages/EventsListPage'
import EventsPage from './pages/EventsPage'
import AnalysisPage from './pages/AnalysisPage'
import VisualizationPage from './pages/VisualizationPage'

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-vct-950">
      {/* background decor */}
      <div
        className="absolute inset-0 bg-center bg-cover opacity-10"
        style={{ backgroundImage: "url('/homepage/homepage decor.webp')" }}
      />

      {/* corner gifs */}
      <img
        src="/homepage/mariin.gif"
        alt=""
        className="absolute top-6 left-6 w-28 rounded-lg opacity-90 border border-vct-700"
      />
      <img
        src="/homepage/scared-terrified.gif"
        alt=""
        className="absolute top-6 right-6 w-28 rounded-lg opacity-90 border border-vct-700"
      />

      {/* hero */}
      <div className="relative flex flex-col items-center justify-center min-h-screen gap-8 px-4 text-center">
        {/* top accent gif */}
        <img
          src="/homepage/erm-aksuali-veli.gif"
          alt=""
          className="w-36 rounded-xl shadow-lg border border-vct-600"
        />

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg">
            Welcome to{' '}
            <span className="text-prussian-blue-700 drop-shadow-[0_0_12px_rgba(81,114,175,0.8)]">
              VCTAnalysis
            </span>
          </h1>
          <p className="text-xl text-dusty-denim-400 font-medium">
            live out your coaching dreams
          </p>
        </div>

        {/* hero image */}
        <img
          src="/homepage/8dd4b0f3bc35904fc465638bd3fc4ae2.jpg"
          alt="VCT"
          className="w-full max-w-2xl rounded-2xl border border-vct-700 shadow-2xl opacity-90"
        />

        <p className="text-dusty-denim-500 text-sm">
          Pick a section from the navbar to get started
        </p>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-vct-800 bg-vct-900 px-6 py-4 text-center text-xs text-dusty-denim-500 leading-relaxed">
      <p>
        VCTAnalysis is not affiliated with, endorsed by, or associated with Riot Games, Inc.
      </p>
      <p className="mt-1">
        VALORANT and VCT are trademarks or registered trademarks of Riot Games, Inc.
        All game content and materials are property of their respective owners.
        &copy; {new Date().getFullYear()} VCTAnalysis. All rights reserved.
      </p>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-vct-950 flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:eventId" element={<EventsPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/visualization" element={<VisualizationPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
