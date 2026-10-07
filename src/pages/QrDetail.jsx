import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS, RESOURCE_TAGS, resolveTarget } from '../lib/schema.js'
import { legacyKind, sourceOf } from '../lib/importer.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import { can } from '../lib/roles.js'
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
} from '../components/ui.jsx'
import { Tooltip } from '../components/Tooltip.jsx'
import {
  IconAlert,
  IconCheck,
  IconChevronLeft,
  IconCopy,
  IconTrash,
} from '../components/icons.jsx'
import { StyleControls } from '../components/StyleControls.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { LegibilityCheck } from '../components/LegibilityCheck.jsx'
import { TagPicker } from '../components/TagPicker.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

/** Copia un texto y lo confirma durante un momento. */
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      console.error('[qrsuite] no se pudo copiar', error)
    }
  }

  return (
    <Button variant="secondary" size="compact" onClick={copy}>
      {copied ? (
        <IconCheck className="size-4 shrink-0" strokeWidth="2.4" />
      ) : (
        <IconCopy className="size-4 shrink-0" />
      )}
      {copied ? 'Copiada' : label}
    </Button>
  )
}

/**
 * El QR que ya circula impreso, generado en otra plataforma. No se puede
 * cambiar desde aquí. Si pasa por una plataforma de redirección, esa
 * plataforma suele dejar apuntarlo a la URL corta, y entonces los libros ya
 * impresos pasan por QR Suite; si es un enlace directo, solo reimprimir con
 * el código nuevo da control sobre el destino y la analítica.
 *
 * Al importar, el destino de un QR de redirección es el propio enlace de la
 * otra plataforma: el destino real queda detrás y el navegador no puede
 * averiguarlo. Si se apuntara esa plataforma a la URL corta sin cambiar antes
 * el destino aquí, se formaría un bucle (QR Suite → plataforma → QR Suite),
 * así que hasta entonces la tarjeta lo pide en lugar de ofrecer la URL.
 */
function LegacyCard({ qr, shortUrl }) {
  const content = qr.legacy_content || ''
  const source = sourceOf(content) || qr.legacy_source || 'otra plataforma'
  const redirects = legacyKind(content) === 'redireccion'
  const loops = redirects && sourceOf(qr.target_url) === sourceOf(content)

  return (
    <Card className="space-y-3">
      <CardTitle
        info={
          redirects
            ? `Los libros ya impresos pasan por ${source} y esos escaneos no se cuentan aquí. Si en ${source} cambias el destino de ese código por la URL corta, los libros ya impresos pasarán por QR Suite sin reimprimir.`
            : `El código impreso lleva directo a ${source}: nadie puede cambiar su destino ni contar sus escaneos. Para tener ambas cosas, usa la versión dinámica en la próxima reimpresión.`
        }
      >
        QR original
      </CardTitle>
      <p className="text-xs text-brand-ink/65">
        {redirects ? 'Redirige vía ' : 'Enlace directo a '}
        <span className="font-semibold text-brand-ink">{source}</span>
      </p>
      <p className="font-mono text-xs break-all text-brand-ink/80">{content}</p>
      {loops ? (
        <p className="flex gap-2 rounded-2xl bg-red-50/85 p-3 text-xs text-red-800 ring-1 ring-red-200">
          <IconAlert className="mt-px size-4 shrink-0 text-red-600" />
          <span>
            El destino publicado aún es el enlace de {source}. Pon el destino
            real y guarda antes de apuntar {source} a la URL corta, o se formará
            un bucle.
          </span>
        </p>
      ) : redirects ? (
        <CopyButton text={shortUrl} label="Copiar URL corta" />
      ) : null}
    </Card>
  )
}

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
      <header className="flex items-center gap-3">
        <Tooltip content="Volver al listado">
          <Link
            to="/codigos"
            aria-label="Volver al listado"
            className="grid size-9 shrink-0 place-items-center rounded-full text-brand-ink/65 transition-colors hover:bg-white/70 hover:text-brand-ink"
          >
            <IconChevronLeft className="size-5" />
          </Link>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {qr.title}
            </h1>
            <StatusBadge status={qr.status} />
          </div>
          <p className="truncate text-sm text-brand-ink/65">
            <code className="font-mono">{qr.short_code}</code>
            {project ? ` · ${project.name}` : null} · {qr.total_scans || 0}{' '}
            escaneos
          </p>
        </div>
        {allowed ? (
          <IconButton
            label="Eliminar código"
            icon={IconTrash}
            variant="danger"
            onClick={() => {
              removeQr(qr.short_code)
              navigate('/codigos')
            }}
          />
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <CardTitle
              info={`Cambiar el destino no altera la imagen impresa: el QR codifica ${shortUrl} y la redirección se resuelve aquí.`}
            >
              Datos y destino
            </CardTitle>
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

            <div className="glass-well rounded-2xl p-3">
              <p className="text-xs font-medium text-brand-ink">
                Destino activo
              </p>
              <p className="mt-0.5 break-all font-mono text-xs text-brand-ink/80">
                {activeTarget || 'Sin destino configurado para este estado'}
              </p>
              {draft.status === 'deprecated' && !settings.deprecatedUrl ? (
                <p className="mt-1 text-xs text-brand-primary-deep">
                  Falta la página de aviso en Ajustes.
                </p>
              ) : null}
            </div>

            {allowed ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSave}>Guardar cambios</Button>
                {saved ? (
                  <span className="text-sm text-brand-primary">Guardado</span>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Estilo</h2>
            <StyleControls
              style={draft.style}
              disabled={!allowed}
              onChange={(style) => patch({ style })}
            />
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Escaneos</h2>
            {qrScans.length === 0 ? (
              <p className="text-sm text-brand-ink/65">Sin escaneos todavía.</p>
            ) : (
              <ul className="divide-y divide-brand-ink/8 text-sm">
                {qrScans.slice(0, 10).map((scan) => (
                  <li key={scan.id} className="flex justify-between gap-3 py-2">
                    <span className="text-brand-ink/80">
                      {new Date(scan.timestamp).toLocaleString('es')}
                    </span>
                    <span className="text-brand-ink/65">
                      {scan.device_os} · {scan.browser}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {qr.origin === 'importado' ? (
            <LegacyCard qr={qr} shortUrl={shortUrl} />
          ) : null}

          <Card className="space-y-4">
            {qr.origin === 'importado' ? (
              <CardTitle info="Úsala al reimprimir: es el mismo destino, ya con redirección editable y analítica.">
                Versión dinámica
              </CardTitle>
            ) : (
              <h2 className="font-semibold">Código impreso</h2>
            )}
            <div className="glass-well flex justify-center rounded-2xl p-4">
              <QrPreview data={shortUrl} style={draft.style} size={220} />
            </div>
            <p className="break-all font-mono text-xs text-brand-ink/65">
              {shortUrl}
            </p>
            <LegibilityCheck data={shortUrl} style={draft.style} />
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
