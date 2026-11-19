import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { dayLabel, localDayKey, scansLabel } from '../lib/format.js'
import { Button, Card, EmptyState, PageHeader } from '../components/ui.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { Sparkline } from '../components/Sparkline.jsx'

const DAYS = 14

function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5">
      <dt className="text-sm text-brand-ink/75">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tabular-nums">{value}</dd>
      {hint ? <dd className="mt-1 text-xs text-brand-ink/75">{hint}</dd> : null}
    </div>
  )
}

export function Dashboard() {
  const { projects, qrs, scans, session } = useApp()
  const canCreate = can(session?.role, 'qr:write')

  const totalScans = qrs.reduce((sum, qr) => sum + (qr.total_scans || 0), 0)
  const published = qrs.filter((qr) => qr.status === 'published').length
  const drafts = qrs.filter((qr) => qr.status === 'draft').length
  const retired = qrs.filter((qr) => qr.status === 'deprecated').length
  const recent = qrs.slice(0, 5)

  // Instante fijado al montar, igual que en Analítica: mantiene puro el render.
  const [now] = useState(() => Date.now())

  const trend = useMemo(() => {
    const buckets = new Map()
    for (let index = DAYS - 1; index >= 0; index -= 1) {
      buckets.set(localDayKey(new Date(now - index * 86400000)), 0)
    }
    scans.forEach((scan) => {
      const key = localDayKey(new Date(scan.timestamp))
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1)
    })
    return [...buckets.entries()].map(([key, value]) => ({
      label: dayLabel(key),
      value,
    }))
  }, [scans, now])

  const periodScans = trend.reduce((sum, day) => sum + day.value, 0)

  return (
    <div className="space-y-8">
      <PageHeader title="Inicio">
        {canCreate ? (
          <Link to="/estudio">
            <Button>Crear código QR</Button>
          </Link>
        ) : null}
      </PageHeader>

      <Card data-tour="dashboard-stats">
        <dl className="grid grid-cols-3 divide-x divide-brand-ink/8">
          <Stat label="Proyectos" value={projects.length} />
          <Stat
            label="Códigos QR"
            value={qrs.length}
            hint={[
              `${published} ${published === 1 ? 'publicado' : 'publicados'}`,
              drafts
                ? `${drafts} ${drafts === 1 ? 'borrador' : 'borradores'}`
                : null,
              retired
                ? `${retired} ${retired === 1 ? 'retirado' : 'retirados'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          />
          <Stat label="Escaneos" value={totalScans} />
        </dl>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">
            Últimos 14 días{' '}
            <span className="ml-1 font-normal text-brand-ink/75 tabular-nums">
              {periodScans}
            </span>
          </h2>
          <Link
            to="/analitica"
            className="inline-flex shrink-0 items-center text-sm font-semibold text-brand-primary-deep hover:underline max-lg:min-h-11"
          >
            Ver analítica
          </Link>
        </div>
        {periodScans === 0 ? (
          <p className="text-sm text-brand-ink/75">Sin escaneos.</p>
        ) : (
          <Sparkline data={trend} />
        )}
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Últimos códigos</h2>
        {recent.length === 0 ? (
          <EmptyState
            title={
              canCreate ? 'Crea tu primer código QR' : 'Todavía no hay códigos'
            }
            description="Su destino se puede cambiar sin reimprimir."
            action={
              canCreate ? (
                <Link to="/estudio">
                  <Button>Crear código QR</Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-brand-ink/8">
              {recent.map((qr) => (
                <li
                  key={qr.short_code}
                  className="relative flex items-center justify-between gap-4 p-4 transition-colors hover:bg-white/55"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/codigos/${qr.short_code}`}
                      className="block truncate text-sm font-medium after:absolute after:inset-0 after:content-[''] hover:underline"
                    >
                      {qr.title}
                    </Link>
                    <p className="text-xs text-brand-ink/75">
                      <code>{qr.short_code}</code> ·{' '}
                      {scansLabel(qr.total_scans)}
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
