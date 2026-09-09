import { Suspense, lazy, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { Button, Card, EmptyState } from '../components/ui.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

// Recharts se carga aparte: el Dashboard debe pintar sus cifras sin esperarlo.
const Sparkline = lazy(() =>
  import('../components/Sparkline.jsx').then((m) => ({ default: m.Sparkline })),
)

const DAYS = 14

function dayKey(date) {
  return date.toISOString().slice(0, 10)
}

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
  const drafts = qrs.length - published
  const recent = qrs.slice(0, 5)

  // Instante fijado al montar, igual que en Analítica: mantiene puro el render.
  const [now] = useState(() => Date.now())

  const trend = useMemo(() => {
    const buckets = new Map()
    for (let index = DAYS - 1; index >= 0; index -= 1) {
      buckets.set(dayKey(new Date(now - index * 86400000)), 0)
    }
    scans.forEach((scan) => {
      const key = dayKey(new Date(scan.timestamp))
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1)
    })
    return [...buckets.entries()].map(([key, value]) => ({
      label: key.slice(5).replace('-', '/'),
      value,
    }))
  }, [scans, now])

  const periodScans = trend.reduce((sum, day) => sum + day.value, 0)

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
        <Stat label="Borradores" value={drafts} hint="Pendientes de publicar" />
      </div>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Escaneos de los últimos 14 días</h2>
          <Link
            to="/analitica"
            className="text-sm text-ssf-blue hover:underline"
          >
            Ver analítica
          </Link>
        </div>
        {periodScans === 0 ? (
          <p className="text-sm text-slate-500">
            Sin escaneos en el periodo. Abre la URL corta de un código para
            registrar el primero.
          </p>
        ) : (
          <Suspense fallback={<div className="h-14" />}>
            <Sparkline data={trend} />
          </Suspense>
        )}
      </Card>

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
