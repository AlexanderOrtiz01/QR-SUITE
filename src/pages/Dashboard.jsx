import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { Button, Card, EmptyState } from '../components/ui.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function Stat({ label, value, hint }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  )
}

export function Dashboard() {
  const { projects, qrs, scans } = useApp()

  const totalScans = qrs.reduce((sum, qr) => sum + (qr.total_scans || 0), 0)
  const published = qrs.filter((qr) => qr.status === 'published').length
  const recent = qrs.slice(0, 5)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Estado general de la plataforma
          </p>
        </div>
        <Link to="/estudio">
          <Button>Crear código QR</Button>
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Proyectos" value={projects.length} />
        <Stat
          label="Códigos QR"
          value={qrs.length}
          hint={`${published} publicados`}
        />
        <Stat label="Escaneos totales" value={totalScans} />
        <Stat
          label="Escaneos registrados"
          value={scans.length}
          hint="Eventos con detalle técnico"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Últimos códigos</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="Todavía no hay códigos QR"
            description="Crea el primero desde el estudio de diseño."
            action={
              <Link to="/estudio">
                <Button>Ir al estudio</Button>
              </Link>
            }
          />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {recent.map((qr) => (
                <li
                  key={qr.short_code}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/codigos/${qr.short_code}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {qr.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      <code>{qr.short_code}</code> · {qr.total_scans || 0}{' '}
                      escaneos
                    </p>
                  </div>
                  <StatusBadge status={qr.status} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  )
}
