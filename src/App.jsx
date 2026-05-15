import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import HomePage from './pages/HomePage'
import AnalisisPage from './pages/AnalisisPage'
import ReservarPage from './pages/ReservarPage'
import HistorialPage from './pages/HistorialPage'
import SkinCheckPage from './pages/SkinCheckPage'
import DermoscopiaPage from './pages/DermoscopiaPage'
// Clinic (multi-tenant)
import { ClinicProvider } from './contexts/ClinicContext'
import DashboardPage        from './pages/clinica/DashboardPage'
import PacientesPage        from './pages/clinica/PacientesPage'
import PacienteDetallePage  from './pages/clinica/PacienteDetallePage'
import AnalisisClinicaPage  from './pages/clinica/AnalisisClinicaPage'

function ClinicRoutes() {
  return (
    <ClinicProvider>
      <Routes>
        <Route path="dashboard"        element={<DashboardPage />} />
        <Route path="pacientes"        element={<PacientesPage />} />
        <Route path="paciente/:id"     element={<PacienteDetallePage />} />
        <Route path="analisis"         element={<AnalisisClinicaPage />} />
      </Routes>
    </ClinicProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/* ── Patient-facing shell (mobile, max-w-sm) ── */}
      <Routes>
        <Route path="/*" element={
          <div className="min-h-screen bg-blush-50 flex items-start justify-center py-6 px-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden min-h-[780px] flex flex-col">
              <Routes>
                <Route path="/"            element={<WelcomePage />} />
                <Route path="/home"        element={<HomePage />} />
                <Route path="/analisis"    element={<AnalisisPage />} />
                <Route path="/reservar"    element={<ReservarPage />} />
                <Route path="/historial"   element={<HistorialPage />} />
                <Route path="/skin-check"  element={<SkinCheckPage />} />
                <Route path="/dermoscopia" element={<DermoscopiaPage />} />
              </Routes>
            </div>
          </div>
        } />
        {/* ── Clinic dashboard shell (wider, tablet-friendly) ── */}
        <Route path="/clinica/:slug/*" element={
          <div className="min-h-screen bg-gray-50 flex items-start justify-center py-6 px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[780px] flex flex-col">
              <ClinicRoutes />
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
