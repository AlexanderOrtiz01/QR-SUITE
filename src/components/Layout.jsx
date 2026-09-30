import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { Footer } from './Footer.jsx'
import { PageSkeleton, Picture, Spinner } from './ui.jsx'
import { preloadPanelPages } from '../pages/routes.js'
import { ROLES } from '../lib/roles.js'
import { isPersistenceShared } from '../lib/storage/index.js'
import {
  IconChart,
  IconChevronLeft,
  IconClose,
  IconDashboard,
  IconFolder,
  IconList,
  IconLogout,
  IconMenu,
  IconQrPlus,
  IconSettings,
} from './icons.jsx'

const NAV = [
  { to: '/', label: 'Dashboard', end: true, Icon: IconDashboard },
  { to: '/estudio', label: 'Crear QR', Icon: IconQrPlus },
  { to: '/proyectos', label: 'Proyectos', Icon: IconFolder },
  { to: '/codigos', label: 'Códigos QR', Icon: IconList },
  { to: '/analitica', label: 'Analítica', Icon: IconChart },
  { to: '/ajustes', label: 'Ajustes', Icon: IconSettings },
]

const COLLAPSE_KEY = 'qrsuite:sidebar-collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function Layout() {
  const { session, signOut, settings, saving } = useApp()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => preloadPanelPages(), [])
  // Plegado en escritorio; el cajón móvil es un estado aparte porque se
  // comporta distinto: allí el menú se superpone en vez de estrechar.
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // Una preferencia de comodidad: si el navegador bloquea el
        // almacenamiento, el menú simplemente no recuerda su estado.
      }
      return next
    })
  }

  // El menú flota separado de los bordes, así que el contenido se aparta su
  // ancho más el margen de ambos lados.
  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const asideWidth = collapsed ? 'lg:w-18' : 'lg:w-60'
  const contentOffset = collapsed ? 'lg:pl-24' : 'lg:pl-66'

  return (
    <div className="min-h-dvh text-brand-ink">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-brand-deep/25 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`glass-thick fixed top-3 bottom-3 left-3 z-40 flex w-60 flex-col overflow-hidden rounded-[1.75rem] text-brand-ink transition-[width,transform] duration-300 ease-ios ${asideWidth} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
        } lg:translate-x-0`}
      >
        <div className="px-3 py-4">
          {/* Los controles van en su propia fila: compartiéndola con el
              logotipo, este no podría quedar centrado. */}
          <div
            className={`flex ${collapsed ? 'lg:justify-center' : ''} justify-end`}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expandir menú' : 'Plegar menú'}
              aria-expanded={!collapsed}
              className="hidden rounded-full p-2 text-brand-ink/70 transition-colors hover:bg-white/70 hover:text-brand-ink lg:block"
            >
              <IconChevronLeft
                className={`size-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-full p-2 text-brand-ink/70 transition-colors hover:bg-white/70 hover:text-brand-ink lg:hidden"
            >
              <IconClose className="size-5" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center">
            {/* Sobre el vidrio claro contrasta la versión azul de la marca.
                Plegado queda solo el símbolo. */}
            <Picture
              src="/logo-azul-192.webp"
              alt=""
              width="192"
              height="192"
              className={`w-auto ${collapsed ? 'lg:size-9' : 'size-14'}`}
            />
            <div className={`mt-2 w-full ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-lg font-bold tracking-tight">QR Suite</p>
              <p className="truncate text-xs text-brand-ink/60">
                {settings.orgName}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-ios active:scale-[0.97] ${
                  isActive
                    ? 'glass-tint text-white'
                    : 'border border-transparent text-brand-ink/75 hover:bg-white/70 hover:text-brand-ink'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
            >
              <item.Icon className="size-5 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {session ? (
          <div className="border-t border-brand-ink/10 p-3">
            {!collapsed ? (
              <div className="mb-2 px-1">
                <p className="truncate text-xs font-semibold">
                  {session.email}
                </p>
                <p className="text-xs text-brand-ink/65">
                  {ROLES[session.role]?.label}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              title={collapsed ? 'Cerrar sesión' : undefined}
              aria-label={collapsed ? 'Cerrar sesión' : undefined}
              className={`glass-well flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-[background-color,transform] duration-200 ease-ios hover:bg-white active:scale-[0.97] disabled:cursor-progress ${
                collapsed ? 'lg:px-0' : ''
              }`}
            >
              {signingOut ? (
                <Spinner className="size-4 shrink-0" />
              ) : (
                <IconLogout className="size-4 shrink-0" />
              )}
              <span className={collapsed ? 'lg:hidden' : ''}>
                {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
              </span>
            </button>
          </div>
        ) : null}
      </aside>

      <div
        className={`flex min-h-dvh flex-col transition-[padding] duration-300 ease-ios ${contentOffset}`}
      >
        <header className="glass-thick sticky top-3 z-20 mx-3 mt-3 flex items-center gap-3 rounded-full py-2 pr-5 pl-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            className="rounded-full p-2.5 transition-colors hover:bg-white/70"
          >
            <IconMenu className="size-5" />
          </button>
          <Picture
            src="/logo-azul-192.webp"
            alt=""
            width="192"
            height="192"
            className="size-8"
          />
          <div className="min-w-0">
            <p className="leading-tight font-bold tracking-tight">QR Suite</p>
            <p className="truncate text-xs text-brand-ink/60">
              {settings.orgName}
            </p>
          </div>
        </header>

        {!isPersistenceShared ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
            <p className="glass rounded-2xl px-4 py-2 text-center text-xs font-medium text-brand-ink/80">
              Modo local: los datos se guardan solo en este navegador. Conecta
              Firestore para compartirlos entre usuarios y dispositivos.
            </p>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {/* Solo cambia el contenido: menú y pie se quedan mientras llega la
              página, que es lo que hace que la navegación no parpadee. */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>

      {/* La interfaz guarda de forma optimista, así que casi nunca se ve: el
          aviso entra con retraso y solo aparece si la escritura tarda. */}
      {saving ? (
        <div
          role="status"
          className="glass-thick fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full [animation:aviso-entra_.3s_var(--ease-ios)_.4s_both]"
        >
          <p className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-ink/80">
            <Spinner className="size-4" />
            Guardando cambios…
          </p>
        </div>
      ) : null}
    </div>
  )
}
