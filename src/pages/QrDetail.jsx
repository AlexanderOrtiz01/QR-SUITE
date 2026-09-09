import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS, RESOURCE_TAGS, resolveTarget } from '../lib/schema.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import { can } from '../lib/roles.js'
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
} from '../components/ui.jsx'
import { StyleControls } from '../components/StyleControls.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { TagPicker } from '../components/TagPicker.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function QrDetail() {
  const { shortCode } = useParams()
  const { qrs } = useApp()
  const qr = qrs.find((item) => item.short_code === shortCode)

  if (!qr) {
    return (
      <EmptyState
        title="Código no encontrado"
        description={`No existe ningún QR con el código ${shortCode}.`}
        action={
          <Link to="/codigos">
            <Button>Volver al listado</Button>
          </Link>
        }
      />
    )
  }

  // La `key` reinicia el borrador al cambiar de código, en lugar de
  // sincronizarlo con un efecto.
  return <QrEditor key={qr.short_code} qr={qr} />
}

function QrEditor({ qr }) {
  const navigate = useNavigate()
  const { projects, scans, settings, updateQr, removeQr, session } = useApp()
  const allowed = can(session?.role, 'qr:write')

  const [draft, setDraft] = useState(qr)
  const [saved, setSaved] = useState(false)

  const shortUrl = shortUrlFor(qr.short_code)
  const activeTarget = resolveTarget(draft, settings)
  const qrScans = scans.filter((scan) => scan.short_code === qr.short_code)
  const project = projects.find((item) => item.id === qr.project_id)

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }))
    setSaved(false)
  }

  function handleSave() {
    updateQr(qr.short_code, {
      title: draft.title,
      target_url: draft.target_url,
      draft_url: draft.draft_url,
      status: draft.status,
      tags: draft.tags,
      style: draft.style,
      project_id: draft.project_id,
    })
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {qr.title}
            </h1>
            <StatusBadge status={qr.status} />
          </div>
          <p className="text-sm text-slate-500">
            <code className="font-mono">{qr.short_code}</code>
            {project ? ` · ${project.name}` : null} · {qr.total_scans || 0}{' '}
            escaneos
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/codigos">
            <Button variant="secondary">Volver</Button>
          </Link>
          {allowed ? (
            <Button
              variant="danger"
              onClick={() => {
                removeQr(qr.short_code)
                navigate('/codigos')
              }}
            >
              Eliminar
            </Button>
          ) : null}
        </div>
      </header>

      <Banner tone="info">
        Cambiar el destino no altera la imagen impresa: el QR codifica{' '}
        <code className="font-mono">{shortUrl}</code>, y la redirección se
        resuelve aquí.
      </Banner>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-semibold">Redirección en caliente</h2>
            <Field label="Título">
              <Input
                value={draft.title}
                disabled={!allowed}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </Field>
            <Field label="Proyecto">
              <Select
                value={draft.project_id}
                disabled={!allowed}
                onChange={(event) => patch({ project_id: event.target.value })}
              >
                <option value="">Sin proyecto</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estado" hint={QR_STATUS[draft.status]?.hint}>
              <Select
                value={draft.status}
                disabled={!allowed}
                onChange={(event) => patch({ status: event.target.value })}
              >
                {Object.values(QR_STATUS).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Destino publicado">
              <Input
                type="url"
                value={draft.target_url}
                disabled={!allowed}
                onChange={(event) => patch({ target_url: event.target.value })}
              />
            </Field>
            <Field label="Destino de borrador">
              <Input
                type="url"
                value={draft.draft_url || ''}
                disabled={!allowed}
                onChange={(event) => patch({ draft_url: event.target.value })}
              />
            </Field>
            <TagPicker
              options={RESOURCE_TAGS}
              value={draft.tags}
              onChange={(tags) => patch({ tags })}
            />

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-700">
                Destino activo ahora
              </p>
              <p className="mt-0.5 break-all font-mono text-xs text-slate-600">
                {activeTarget || 'Sin destino configurado para este estado'}
              </p>
              {draft.status === 'deprecated' && !settings.deprecatedUrl ? (
                <p className="mt-1 text-xs text-amber-700">
                  Falta definir la página institucional de aviso en Ajustes.
                </p>
              ) : null}
            </div>

            {allowed ? (
              <div className="flex items-center gap-3">
                <Button onClick={handleSave}>Guardar cambios</Button>
                {saved ? (
                  <span className="text-sm text-emerald-600">Guardado</span>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Estilo institucional</h2>
            <StyleControls
              style={draft.style}
              disabled={!allowed}
              onChange={(style) => patch({ style })}
            />
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Escaneos registrados</h2>
            {qrScans.length === 0 ? (
              <p className="text-sm text-slate-500">
                Todavía no hay escaneos con detalle técnico para este código.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {qrScans.slice(0, 10).map((scan) => (
                  <li key={scan.id} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-600">
                      {new Date(scan.timestamp).toLocaleString('es')}
                    </span>
                    <span className="text-slate-500">
                      {scan.device_os} · {scan.browser}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-semibold">Código impreso</h2>
            <div className="flex justify-center rounded-lg bg-slate-50 p-4">
              <QrPreview data={shortUrl} style={draft.style} size={220} />
            </div>
            <p className="break-all font-mono text-xs text-slate-500">
              {shortUrl}
            </p>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Exportar</h2>
            <ExportPanel
              data={shortUrl}
              style={draft.style}
              title={draft.title}
              disabled={!can(session?.role, 'qr:export')}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
