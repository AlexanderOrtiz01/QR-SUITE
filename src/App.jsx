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
import { Privacy } from './pages/Privacy.jsx'

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
                <p className="text-sm text-brand-ink/65">Cargando analítica…</p>
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
    <BrowserRouter>
      <Routes>
        {/* El motor de redirección va fuera del proveedor: una URL corta
            escaneada desde un libro no debe pedir inicio de sesión, y sin
            sesión tampoco puede leer las colecciones del panel. */}
        <Route path="/r/:shortCode" element={<Redirect />} />
        {/* El aviso de privacidad también es público: Google lo consulta para
            aprobar la pantalla de consentimiento. */}
        <Route path="/privacidad" element={<Privacy />} />
        <Route
          path="/*"
          element={
            <AppProvider>
              <Panel />
            </AppProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
