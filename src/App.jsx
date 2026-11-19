import { Suspense } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Route,
  RouterProvider,
  Routes,
} from 'react-router-dom'
import { AppProvider } from './store/AppStore.jsx'
import { useApp } from './store/useApp.js'
import { Layout } from './components/Layout.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { TourProvider } from './components/tour/TourProvider.jsx'
import {
  Analytics,
  Help,
  Import,
  Login,
  Privacy,
  Projects,
  QrDetail,
  QrList,
  Redirect,
  Settings,
  Studio,
} from './pages/routes.js'
import { PageLoader } from './components/ui.jsx'

function Panel() {
  const { ready, session } = useApp()
  if (!ready) return <PageLoader />
  if (!session) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    )
  }

  // El motor de guías va dentro del router (navega entre pantallas) y
  // envuelve todo el panel para sobrevivir a cada cambio de página.
  return (
    <TourProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="estudio" element={<Studio />} />
          <Route path="proyectos" element={<Projects />} />
          <Route path="codigos" element={<QrList />} />
          <Route path="codigos/:shortCode" element={<QrDetail />} />
          <Route path="importar" element={<Import />} />
          <Route path="analitica" element={<Analytics />} />
          <Route path="ajustes" element={<Settings />} />
          <Route path="ayuda" element={<Help />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </TourProvider>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* El motor de redirección va fuera del proveedor: una URL corta
            escaneada desde un libro no debe pedir inicio de sesión, y sin
            sesión tampoco puede leer las colecciones del panel. */}
      <Route
        path="/r/:shortCode"
        element={
          <Suspense fallback={<PageLoader label="Redirigiendo" />}>
            <Redirect />
          </Suspense>
        }
      />
      {/* El aviso de privacidad también es público: Google lo consulta para
            aprobar la pantalla de consentimiento. */}
      <Route
        path="/privacidad"
        element={
          <Suspense fallback={<PageLoader label="Cargando" />}>
            <Privacy />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <AppProvider>
            <Panel />
          </AppProvider>
        }
      />
    </Routes>
  )
}

/**
 * Router de datos con una sola ruta comodín: las rutas siguen declaradas abajo
 * con `<Routes>`, y a cambio funciona `useBlocker`, que avisa de los cambios sin
 * guardar antes de navegar.
 */
const router = createBrowserRouter([{ path: '*', element: <AppRoutes /> }])

export default function App() {
  return <RouterProvider router={router} />
}
