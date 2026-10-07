import { useMemo, useState } from 'react'
import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import {
  Card,
  CardTitle,
  EmptyState,
  IconButton,
  PageHeader,
  Select,
} from '../components/ui.jsx'
import { InfoTip } from '../components/Tooltip.jsx'
import { IconDownload } from '../components/icons.jsx'
import {
  BarList,
  ColumnChart,
  HourHeatmap,
  RankList,
} from '../components/charts.jsx'

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

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Variación frente al periodo inmediatamente anterior, del mismo largo. El
 * largo ya lo dice el selector de rango, así que no se repite aquí.
 */
function trendLabel(current, before) {
  if (before === 0) return current > 0 ? 'Sin datos del periodo anterior' : null
  const change = Math.round(((current - before) / before) * 100)
  if (change === 0) return 'Igual que el periodo anterior'
  return `${change > 0 ? '+' : '−'}${Math.abs(change)} % vs. periodo anterior`
}

/** Cuenta por una clave que puede tener varios valores (las etiquetas). */
function countMany(items, valuesOf) {
  const map = new Map()
  items.forEach((item) => {
    valuesOf(item).forEach((value) => {
      map.set(value, (map.get(value) || 0) + 1)
    })
  })
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function Stat({ label, value, hint, info }) {
  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-brand-ink/65">{label}</p>
        {info ? <InfoTip>{info}</InfoTip> : null}
      </div>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-brand-ink/65">{hint}</p> : null}
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

  const scopedQrs = useMemo(
    () => (projectId ? qrs.filter((qr) => qr.project_id === projectId) : qrs),
    [qrs, projectId],
  )

  // El periodo elegido y el anterior del mismo largo, en una sola pasada: la
  // comparación solo tiene sentido si ambos llevan el mismo filtro.
  const { scoped, previous } = useMemo(() => {
    const codes = projectId
      ? new Set(scopedQrs.map((qr) => qr.short_code))
      : null
    const span = Number(days) * DAY_MS
    const since = now - span
    const current = []
    const before = []
    scans.forEach((scan) => {
      if (codes && !codes.has(scan.short_code)) return
      const time = new Date(scan.timestamp).getTime()
      if (time >= since) current.push(scan)
      else if (time >= since - span) before.push(scan)
    })
    return { scoped: current, previous: before }
  }, [scans, scopedQrs, projectId, days, now])

  const qrByCode = useMemo(
    () => new Map(qrs.map((qr) => [qr.short_code, qr])),
    [qrs],
  )
  const projectName = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  )

  const topCodes = useMemo(
    () =>
      countBy(scoped, 'short_code').map((row) => {
        const qr = qrByCode.get(row.label)
        return {
          id: row.label,
          label: qr?.title || row.label,
          hint: [projectName.get(qr?.project_id), row.label]
            .filter(Boolean)
            .join(' · '),
          value: row.value,
        }
      }),
    [scoped, qrByCode, projectName],
  )

  const byTag = useMemo(
    () =>
      countMany(scoped, (scan) => {
        const tags = qrByCode.get(scan.short_code)?.tags || []
        return tags.length ? tags : ['Sin etiqueta']
      }),
    [scoped, qrByCode],
  )

  const byProject = useMemo(
    () =>
      countMany(scoped, (scan) => [
        projectName.get(qrByCode.get(scan.short_code)?.project_id) ||
          'Sin proyecto',
      ]),
    [scoped, qrByCode, projectName],
  )

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
  const peak = daily.reduce(
    (best, day) => (day.value > best.value ? day : best),
    { label: '', value: 0 },
  )
  const activeCodes = new Set(scoped.map((scan) => scan.short_code)).size
  const previousActive = new Set(previous.map((scan) => scan.short_code)).size

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
      <PageHeader
        title="Analítica"
        info="Hasta que exista la Cloud Function de redirección, los escaneos se registran en el navegador que abre la URL corta: las métricas solo reflejan este dispositivo."
      >
        {can(session?.role, 'analytics:read') ? (
          <IconButton
            label="Exportar CSV"
            icon={IconDownload}
            onClick={exportCsv}
            disabled={scoped.length === 0}
          />
        ) : null}
      </PageHeader>

      <Card className="grid gap-3 sm:grid-cols-2">
        <Select
          aria-label="Periodo"
          value={days}
          onChange={(event) => setDays(event.target.value)}
        >
          {RANGES.map((range) => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Proyecto"
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
        <Stat
          label="Escaneos"
          value={scoped.length}
          hint={trendLabel(scoped.length, previous.length)}
        />
        <Stat
          label="Promedio diario"
          value={average.toFixed(1)}
          hint={
            peak.value > 0 ? `Máx. ${peak.value} el ${peak.label}` : undefined
          }
        />
        <Stat
          label="Códigos activos"
          value={activeCodes}
          hint={`de ${scopedQrs.length} · ${(
            trendLabel(activeCodes, previousActive) || 'sin actividad previa'
          ).toLowerCase()}`}
        />
        <Stat
          label="Usuarios únicos"
          value="Pendiente"
          info="Requiere el hash de IP que calculará la Cloud Function."
        />
      </div>

      {scans.length === 0 ? (
        <EmptyState title="Todavía no hay escaneos" />
      ) : (
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="font-semibold">Escaneos por día</h2>
            <ColumnChart data={daily} />
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Escaneos por hora</h2>
            <HourHeatmap data={hourly} />
          </Card>

          <Card className="space-y-4">
            <CardTitle>Códigos más escaneados</CardTitle>
            <RankList
              data={topCodes}
              total={scoped.length}
              emptyLabel="Sin escaneos en el periodo"
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={`space-y-4 ${projectId ? 'lg:col-span-2' : ''}`}>
              <CardTitle info="Según las etiquetas de cada código.">
                Por tipo de material
              </CardTitle>
              <RankList
                data={byTag}
                total={scoped.length}
                emptyLabel="Sin escaneos en el periodo"
              />
            </Card>
            {projectId ? null : (
              <Card className="space-y-4">
                <CardTitle>Por proyecto</CardTitle>
                <RankList
                  data={byProject}
                  total={scoped.length}
                  emptyLabel="Sin escaneos en el periodo"
                />
              </Card>
            )}
          </div>

          <Card className="space-y-3">
            <h2 className="font-semibold">Navegador</h2>
            <BarList
              data={countBy(scoped, 'browser')}
              emptyLabel="Sin escaneos en el periodo"
            />
          </Card>
        </div>
      )}
    </div>
  )
}
