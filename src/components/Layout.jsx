import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { ROLES } from '../lib/roles.js'
import { isPersistenceShared } from '../lib/storage/index.js'
import {
  IconChart,
  IconChevronLeft,
  IconClose,
  IconDashboard,
  IconFolder,
  IconList,
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
  const { session, setSession, settings } = useApp()
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

  const asideWidth = collapsed ? 'lg:w-18' : 'lg:w-60'
  const contentOffset = collapsed ? 'lg:pl-18' : 'lg:pl-60'

  return (
    <div className="min-h-dvh bg-ssf-mist text-ssf-charcoal">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ssf-charcoal/50 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r-4 border-ssf-slate bg-ssf-charcoal text-white transition-[width,transform] duration-200 ${asideWidth} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold tracking-tight">QR Suite</p>
              <p className="truncate text-xs text-ssf-line">
                {settings.orgName}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menú' : 'Plegar menú'}
            aria-expanded={!collapsed}
            className="hidden rounded-lg p-2 transition-colors hover:bg-white/10 lg:block"
          >
            <IconChevronLeft
              className={`size-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 transition-colors hover:bg-white/10 lg:hidden"
          >
            <IconClose className="size-5" />
          </button>
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
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ssf-navy text-white'
                    : 'text-ssf-line hover:bg-white/10'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
            >
              <item.Icon className="size-5 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {session ? (
          <div className="border-t border-white/15 p-3">
            {!collapsed ? (
              <div className="mb-2 px-1">
                <p className="truncate text-xs font-medium">{session.email}</p>
                <p className="text-xs text-ssf-line">
                  {ROLES[session.role]?.label}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSession(null)}
              title={collapsed ? 'Cerrar sesión' : undefined}
              className={`w-full rounded-lg border border-white/25 px-3 py-2 text-xs font-medium transition-colors hover:bg-white/10 ${
                collapsed ? 'lg:px-0' : ''
              }`}
            >
              {collapsed ? '⏻' : 'Cerrar sesión'}
            </button>
          </div>
        ) : null}
      </aside>

      <div className={`transition-[padding] duration-200 ${contentOffset}`}>
        <header className="flex items-center gap-3 border-b-4 border-ssf-slate bg-ssf-charcoal px-4 py-3 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <IconMenu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="font-bold tracking-tight">QR Suite</p>
            <p className="truncate text-xs text-ssf-line">{settings.orgName}</p>
          </div>
        </header>

        {!isPersistenceShared ? (
          <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
            Modo local: los datos se guardan solo en este navegador. Conecta
            Firestore para compartirlos entre usuarios y dispositivos.
          </div>
        ) : null}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
