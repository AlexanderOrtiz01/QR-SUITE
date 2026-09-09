import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS } from '../lib/schema.js'
import { Button, Card, EmptyState, Input, Select } from '../components/ui.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function QrList() {
  const { qrs, projects } = useApp()
  const [params, setParams] = useSearchParams()

  const search = params.get('q') || ''
  const projectId = params.get('proyecto') || ''
  const status = params.get('estado') || ''

  function setParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return qrs.filter((qr) => {
      if (projectId && qr.project_id !== projectId) return false
      if (status && qr.status !== status) return false
      if (!needle) return true
      return (
        qr.title.toLowerCase().includes(needle) ||
        qr.short_code.toLowerCase().includes(needle) ||
        qr.tags.some((tag) => tag.toLowerCase().includes(needle))
      )
    })
  }, [qrs, search, projectId, status])

  const projectName = (id) =>
    projects.find((project) => project.id === id)?.name || '—'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Códigos QR</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} de {qrs.length} códigos
          </p>
        </div>
        <Link to="/estudio">
          <Button>Crear código QR</Button>
        </Link>
      </header>

      <Card className="grid gap-3 sm:grid-cols-3">
        <Input
          value={search}
          onChange={(event) => setParam('q', event.target.value)}
          placeholder="Buscar por título, código o etiqueta…"
        />
        <Select
          value={projectId}
          onChange={(event) => setParam('proyecto', event.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(event) => setParam('estado', event.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.values(QR_STATUS).map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Ajusta los filtros o crea un código nuevo."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Escaneos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((qr) => (
                <tr key={qr.short_code} className="hover:bg-ssf-mist">
                  <td className="px-4 py-3">
                    <Link
                      to={`/codigos/${qr.short_code}`}
                      className="font-medium hover:underline"
                    >
                      {qr.title}
                    </Link>
                    {qr.tags.length > 0 ? (
                      <p className="text-xs text-slate-500">
                        {qr.tags.join(' · ')}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {qr.short_code}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {projectName(qr.project_id)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={qr.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {qr.total_scans || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
