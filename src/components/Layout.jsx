import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { ROLES } from '../lib/roles.js'
import { isPersistenceShared } from '../lib/storage/index.js'
import { Button } from './ui.jsx'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/estudio', label: 'Estudio de diseño' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/codigos', label: 'Códigos QR' },
  { to: '/analitica', label: 'Analítica' },
  { to: '/ajustes', label: 'Ajustes' },
]

function navClass({ isActive }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`
}

export function Layout() {
  const { session, setSession, settings } = useApp()

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {!isPersistenceShared ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
          Modo local: los datos se guardan solo en este navegador. Conecta
          Firestore para compartirlos entre usuarios y dispositivos.
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl gap-6 p-4 sm:p-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6 space-y-6">
            <div>
              <p className="text-lg font-bold tracking-tight">QR Suite</p>
              <p className="text-xs text-slate-500">{settings.orgName}</p>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {session ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="truncate text-xs font-medium text-slate-700">
                  {session.email}
                </p>
                <p className="text-xs text-slate-500">
                  {ROLES[session.role]?.label}
                </p>
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => setSession(null)}
                >
                  Cerrar sesión
                </Button>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
