import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS } from '../lib/schema.js'
import { can } from '../lib/roles.js'
import { scansLabel } from '../lib/format.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from '../components/ui.jsx'
import { CopyButton } from '../components/CopyButton.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { Tooltip } from '../components/Tooltip.jsx'

/** Marca de los códigos que vienen de otra plataforma. */
function ImportedMark({ qr }) {
  if (qr.origin !== 'importado') return null
  return (
    <Tooltip content={`Importado de ${qr.legacy_source || 'otra plataforma'}`}>
      <span className="relative z-10 ml-2 inline-flex rounded-full bg-brand-ink/6 px-2 py-0.5 align-middle text-[11px] font-bold text-brand-ink/75">
        Importado
      </span>
    </Tooltip>
  )
}

export function QrList() {
  const { qrs, projects, session } = useApp()
  const canCreate = can(session?.role, 'qr:write')
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
        {canCreate ? (
          <>
            <Link to="/importar">
              <Button variant="secondary">Importar</Button>
            </Link>
            <Link to="/estudio">
              <Button>Crear código QR</Button>
            </Link>
          </>
        ) : null}
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
        qrs.length === 0 ? (
          <EmptyState
            title="Todavía no hay códigos"
            description="Cuando se cree el primero, aparecerá aquí."
          />
        ) : (
          <EmptyState
            title="Ningún código coincide con estos filtros"
            action={
              <Button
                variant="secondary"
                onClick={() => setParams({}, { replace: true })}
              >
                Limpiar filtros
              </Button>
            }
          />
        )
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
                    <p className="font-medium break-words">
                      {qr.title}
                      <ImportedMark qr={qr} />
                    </p>
                    <p className="mt-0.5 text-xs text-brand-ink/75">
                      <code className="font-mono">{qr.short_code}</code> ·{' '}
                      {projectName(qr.project_id)} ·{' '}
                      {scansLabel(qr.total_scans)}
                    </p>
                    {qr.tags.length > 0 ? (
                      <p className="text-xs text-brand-ink/75">
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
            <thead className="border-b border-brand-ink/10 text-left text-xs font-bold uppercase tracking-[0.12em] text-brand-ink/75">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Escaneos</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink/8">
              {filtered.map((qr) => (
                <tr
                  key={qr.short_code}
                  className="relative transition-colors hover:bg-white/55"
                >
                  <td className="px-4 py-3">
                    {/* El enlace cubre toda la fila, que ya reacciona al paso
                        del puntero; lo que tiene acción propia va por encima. */}
                    <Link
                      to={`/codigos/${qr.short_code}`}
                      className="font-medium after:absolute after:inset-0 after:content-[''] hover:underline"
                    >
                      {qr.title}
                    </Link>
                    <ImportedMark qr={qr} />
                    {qr.tags.length > 0 ? (
                      <p className="text-xs text-brand-ink/75">
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
                  <td className="px-4 py-1.5">
                    <div className="relative z-10 flex justify-end">
                      <CopyButton
                        iconOnly
                        text={shortUrlFor(qr.short_code)}
                        label="Copiar URL impresa"
                      />
                    </div>
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
