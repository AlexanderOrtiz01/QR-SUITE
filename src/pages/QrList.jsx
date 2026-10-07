import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS } from '../lib/schema.js'
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from '../components/ui.jsx'
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
    projects.find((project) => project.id === id)?.name || 'Sin proyecto'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Códigos QR"
        meta={`${filtered.length} de ${qrs.length}`}
      >
        <Link to="/estudio">
          <Button>Crear código QR</Button>
        </Link>
      </PageHeader>

      <Card className="grid gap-3 sm:grid-cols-3">
        <Input
          value={search}
          onChange={(event) => setParam('q', event.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar por título, código o etiqueta"
        />
        <Select
          aria-label="Proyecto"
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
          aria-label="Estado"
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
        <EmptyState title="Sin resultados" />
      ) : (
        <Card className="overflow-x-auto p-0">
          {/* En el móvil la tabla obligaría a desplazarse de lado: cada código
              pasa a ser una fila apilada con los mismos datos. */}
          <ul className="divide-y divide-brand-ink/8 md:hidden">
            {filtered.map((qr) => (
              <li key={qr.short_code}>
                <Link
                  to={`/codigos/${qr.short_code}`}
                  className="flex items-start justify-between gap-3 p-4 transition-colors hover:bg-white/55"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium break-words">{qr.title}</p>
                    <p className="mt-0.5 text-xs text-brand-ink/65">
                      <code className="font-mono">{qr.short_code}</code> ·{' '}
                      {projectName(qr.project_id)} · {qr.total_scans || 0}{' '}
                      escaneos
                    </p>
                    {qr.tags.length > 0 ? (
                      <p className="text-xs text-brand-ink/65">
                        {qr.tags.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={qr.status} />
                </Link>
              </li>
            ))}
          </ul>

          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-brand-ink/10 text-left text-xs font-bold uppercase tracking-[0.12em] text-brand-ink/65">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Escaneos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink/8">
              {filtered.map((qr) => (
                <tr
                  key={qr.short_code}
                  className="transition-colors hover:bg-white/55"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/codigos/${qr.short_code}`}
                      className="font-medium hover:underline"
                    >
                      {qr.title}
                    </Link>
                    {qr.tags.length > 0 ? (
                      <p className="text-xs text-brand-ink/65">
                        {qr.tags.join(' · ')}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {qr.short_code}
                  </td>
                  <td className="px-4 py-3 text-brand-ink/80">
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
