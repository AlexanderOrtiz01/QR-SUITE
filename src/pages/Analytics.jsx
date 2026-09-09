import { useMemo, useState } from 'react'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { Banner, Button, Card, EmptyState, Select } from '../components/ui.jsx'
import { BarList, ColumnChart, HourHeatmap } from '../components/charts.jsx'

const RANGES = [
  { id: '7', label: 'Últimos 7 días' },
  { id: '14', label: 'Últimos 14 días' },
  { id: '30', label: 'Últimos 30 días' },
]

function countBy(items, key) {
  const map = new Map()
  items.forEach((item) => {
    const value = item[key] || 'Desconocido'
    map.set(value, (map.get(value) || 0) + 1)
  })
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

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

export function Analytics() {
  const { scans, qrs, projects, session } = useApp()
  const [days, setDays] = useState('14')
  // Instante de referencia fijado al montar: mantiene puro el render y evita
  // que los rangos se desplacen entre renderizados.
  const [now] = useState(() => Date.now())
  const [projectId, setProjectId] = useState('')

  const scoped = useMemo(() => {
    const codes = projectId
      ? new Set(
          qrs
            .filter((qr) => qr.project_id === projectId)
            .map((qr) => qr.short_code),
        )
      : null
    const since = now - Number(days) * 24 * 60 * 60 * 1000
    return scans.filter((scan) => {
      if (codes && !codes.has(scan.short_code)) return false
      return new Date(scan.timestamp).getTime() >= since
    })
  }, [scans, qrs, projectId, days, now])

  const daily = useMemo(() => {
    const buckets = new Map()
    for (let index = Number(days) - 1; index >= 0; index -= 1) {
      buckets.set(dayKey(new Date(now - index * 24 * 60 * 60 * 1000)), 0)
    }
    scoped.forEach((scan) => {
      const key = dayKey(new Date(scan.timestamp))
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1)
    })
    return [...buckets.entries()].map(([key, value]) => ({
      label: key.slice(5).replace('-', '/'),
      value,
    }))
  }, [scoped, days, now])

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      value: 0,
    }))
    scoped.forEach((scan) => {
      buckets[new Date(scan.timestamp).getHours()].value += 1
    })
    return buckets
  }, [scoped])

  const average = scoped.length / Number(days)

  function exportCsv() {
    const header = [
      'short_code',
      'timestamp',
      'device_os',
      'browser',
      'user_agent',
    ]
    const rows = scoped.map((scan) =>
      header
        .map((field) => `"${String(scan[field] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `escaneos-${dayKey(new Date())}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analítica</h1>
          <p className="text-sm text-slate-500">
            Escaneos registrados por el motor de redirección
          </p>
        </div>
        {can(session?.role, 'analytics:read') ? (
          <Button
            variant="secondary"
            onClick={exportCsv}
            disabled={scoped.length === 0}
          >
            Exportar CSV
          </Button>
        ) : null}
      </header>

      <Banner tone="warning">
        Los escaneos se registran en el navegador que abre la URL corta. Hasta
        que exista la Cloud Function de redirección, las métricas solo reflejan
        este dispositivo.
      </Banner>

      <Card className="grid gap-3 sm:grid-cols-2">
        <Select value={days} onChange={(event) => setDays(event.target.value)}>
          {RANGES.map((range) => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </Select>
        <Select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Escaneos en el periodo" value={scoped.length} />
        <Stat label="Promedio diario" value={average.toFixed(1)} />
        <Stat
          label="Códigos activos"
          value={new Set(scoped.map((s) => s.short_code)).size}
        />
        <Stat
          label="Usuarios únicos"
          value="—"
          hint="Requiere el hash de IP que calculará la Cloud Function"
        />
      </div>

      {scans.length === 0 ? (
        <EmptyState
          title="Todavía no hay escaneos"
          description="Abre la URL corta de un código para registrar el primero."
        />
      ) : (
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="font-semibold">Escaneos por día</h2>
            <ColumnChart data={daily} />
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Intensidad por hora del día</h2>
            <HourHeatmap data={hourly} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="font-semibold">Sistema operativo</h2>
              <BarList
                data={countBy(scoped, 'device_os')}
                emptyLabel="Sin escaneos en el periodo"
              />
            </Card>
            <Card className="space-y-3">
              <h2 className="font-semibold">Navegador</h2>
              <BarList
                data={countBy(scoped, 'browser')}
                emptyLabel="Sin escaneos en el periodo"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
