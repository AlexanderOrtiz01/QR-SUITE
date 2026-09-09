import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { ROLES } from '../lib/roles.js'
import { isPersistenceShared } from '../lib/storage/index.js'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/estudio', label: 'Crear QR' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/codigos', label: 'Códigos QR' },
  { to: '/analitica', label: 'Analítica' },
  { to: '/ajustes', label: 'Ajustes' },
]

function navClass({ isActive }) {
  return `shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
    isActive
      ? 'border-ssf-navy text-ssf-navy'
      : 'border-transparent text-slate-500 hover:border-ssf-line hover:text-ssf-charcoal'
  }`
}

export function Layout() {
  const { session, setSession, settings } = useApp()

  return (
    <div className="min-h-dvh bg-ssf-mist text-ssf-charcoal">
      <header className="border-b-4 border-ssf-slate bg-ssf-charcoal text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight">QR Suite</p>
            <p className="truncate text-xs text-ssf-line">{settings.orgName}</p>
          </div>
          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="truncate text-xs font-medium">{session.email}</p>
                <p className="text-xs text-ssf-line">
                  {ROLES[session.role]?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSession(null)}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
              >
                Salir
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 sm:px-6">
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
      </div>

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
  )
}
