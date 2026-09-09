import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store/AppStore.jsx'
import { useApp } from './store/useApp.js'
import { Layout } from './components/Layout.jsx'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Studio } from './pages/Studio.jsx'
import { Projects } from './pages/Projects.jsx'
import { QrList } from './pages/QrList.jsx'
import { QrDetail } from './pages/QrDetail.jsx'
import { Settings } from './pages/Settings.jsx'
import { Redirect } from './pages/Redirect.jsx'

// Analítica es la única pantalla que carga Recharts (~144 KB gzip). Se separa
// en su propio chunk para que no lo pague quien solo entra a crear un código.
const Analytics = lazy(() =>
  import('./pages/Analytics.jsx').then((m) => ({ default: m.Analytics })),
)

function Panel() {
  const { ready, session } = useApp()
  if (!ready) return null
  if (!session) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="estudio" element={<Studio />} />
        <Route path="proyectos" element={<Projects />} />
        <Route path="codigos" element={<QrList />} />
        <Route path="codigos/:shortCode" element={<QrDetail />} />
        <Route
          path="analitica"
          element={
            <Suspense
              fallback={
                <p className="text-sm text-slate-500">Cargando analítica…</p>
              }
            >
              <Analytics />
            </Suspense>
          }
        />
        <Route path="ajustes" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* El motor de redirección va antes que el panel: una URL corta
              escaneada desde un libro no debe pedir inicio de sesión. */}
          <Route path="/r/:shortCode" element={<Redirect />} />
          <Route path="/*" element={<Panel />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
