import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS, RESOURCE_TAGS, resolveTarget } from '../lib/schema.js'
import { legacyKind, sourceOf } from '../lib/importer.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import { scansLabel } from '../lib/format.js'
import { urlIssue } from '../lib/urls.js'
import { can } from '../lib/roles.js'
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Notice,
  Select,
} from '../components/ui.jsx'
import { Tooltip } from '../components/Tooltip.jsx'
import { IconChevronLeft } from '../components/icons.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { CopyButton } from '../components/CopyButton.jsx'
import {
  DestinationField,
  TestDestinationField,
} from '../components/DestinationField.jsx'
import { UnsavedGuard } from '../components/UnsavedGuard.jsx'
import { StyleControls } from '../components/StyleControls.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { LegibilityCheck } from '../components/LegibilityCheck.jsx'
import { TagPicker } from '../components/TagPicker.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

/** Acciones posibles desde cada estado; el estado ya lo dice la insignia. */
const STATUS_FLOW = {
  draft: {
    actions: [{ to: 'published', label: 'Publicar', primary: true }],
  },
  published: {
    actions: [
      { to: 'draft', label: 'Volver a borrador' },
      { to: 'deprecated', label: 'Retirar' },
    ],
  },
  deprecated: {
    actions: [
      { to: 'draft', label: 'Volver a borrador' },
      { to: 'published', label: 'Volver a publicar', primary: true },
    ],
  },
}

const STATUS_DONE = {
  draft: 'El código volvió a borrador.',
  published: 'Código publicado.',
  deprecated: 'Código retirado.',
}

/** Solo lo que se edita en el formulario: el estado cambia por sus acciones. */
function editableFields(qr) {
  return {
    title: qr.title,
    project_id: qr.project_id || '',
    target_url: qr.target_url || '',
    draft_url: qr.draft_url || '',
    tags: qr.tags,
    style: qr.style,
  }
}

function trimmedFields(draft) {
  return {
    ...editableFields(draft),
    title: draft.title.trim(),
    target_url: (draft.target_url || '').trim(),
    draft_url: (draft.draft_url || '').trim(),
  }
}

function TargetLine({ url }) {
  return <p className="font-mono text-xs break-all text-brand-ink">{url}</p>
}

/** Bloque secundario plegado: el título queda a la vista y el resto, a mano. */
function Section({ title, meta, children }) {
  return (
    <details className="glass group rounded-[1.75rem] p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl max-lg:min-h-11 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          {meta ? (
            <span className="block text-xs text-brand-ink/75">{meta}</span>
          ) : null}
        </span>
        <IconChevronLeft className="size-5 shrink-0 -rotate-90 text-brand-ink/75 transition-transform duration-200 ease-ios group-open:rotate-90" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
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
            ? `Sus escaneos se cuentan en ${source}, no aquí. Si allí lo apuntas a la URL corta, los libros impresos pasarán por QR Suite sin reimprimir.`
            : `Lleva directo a ${source}: no se puede cambiar su destino ni contar sus escaneos. Usa la versión dinámica al reimprimir.`
        }
      >
        QR original
      </CardTitle>
      <p className="text-xs text-brand-ink/75">
        {redirects ? 'Redirige vía ' : 'Enlace directo a '}
        <span className="font-semibold text-brand-ink">{source}</span>
      </p>
      <p className="font-mono text-xs break-all text-brand-ink/80">{content}</p>
      {loops ? (
        <Notice tone="danger">
          El destino final aún es el enlace de {source}. Guarda el real antes de
          apuntar {source} a la URL corta, o se formará un bucle.
        </Notice>
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
  const location = useLocation()
  const { projects, scans, settings, updateQr, removeQr, notify, session } =
    useApp()
  const allowed = can(session?.role, 'qr:write')
  const canDelete = can(session?.role, 'qr:delete')
  const canEditSettings = can(session?.role, 'settings:write')

  const [draft, setDraft] = useState(qr)
  const [attempted, setAttempted] = useState(false)
  // 'delete', o el estado al que se quiere pasar.
  const [dialog, setDialog] = useState(null)
  const rootRef = useRef(null)
  const leavingRef = useRef(false)

  const shortUrl = shortUrlFor(qr.short_code)
  const savedTarget = resolveTarget(qr, settings)
  const qrScans = scans.filter((scan) => scan.short_code === qr.short_code)
  const project = projects.find((item) => item.id === qr.project_id)
  const flow = STATUS_FLOW[qr.status] || STATUS_FLOW.draft
  const justCreated = Boolean(location.state?.created)

  const dirty =
    JSON.stringify(editableFields(draft)) !== JSON.stringify(editableFields(qr))
  const invalid = Boolean(
    !draft.title.trim() ||
    urlIssue(draft.target_url, { required: true }) ||
    urlIssue(draft.draft_url),
  )
  const destinationChanged =
    qr.status === 'published' &&
    (draft.target_url || '').trim() !== (qr.target_url || '')
  const hasScans = (qr.total_scans || 0) > 0
  const risky = qr.status === 'published' || hasScans

  function patch(next) {
    setDraft((current) => ({ ...current, ...next }))
  }

  /** Lleva el foco al primer campo con error, para que no pase inadvertido. */
  function revealErrors() {
    setAttempted(true)
    requestAnimationFrame(() => {
      rootRef.current?.querySelector('[aria-invalid="true"]')?.focus()
    })
  }

  function handleSave() {
    if (invalid) {
      revealErrors()
      return
    }
    updateQr(qr.short_code, trimmedFields(draft))
    setDraft((current) => ({ ...current, ...trimmedFields(current) }))
    setAttempted(false)
    notify(
      destinationChanged
        ? 'Cambios guardados. Los libros impresos ya van al nuevo destino.'
        : 'Cambios guardados.',
    )
  }

  function requestStatus(to) {
    // Publicar exige un destino válido; el resto solo si hay cambios que
    // viajarían con el nuevo estado.
    if (invalid && (to === 'published' || dirty)) {
      revealErrors()
      return
    }
    setDialog(to)
  }

  function applyStatus(to) {
    updateQr(qr.short_code, { ...trimmedFields(draft), status: to })
    setDraft((current) => ({ ...current, ...trimmedFields(current) }))
    setDialog(null)
    setAttempted(false)
    notify(STATUS_DONE[to])
  }

  function handleDelete() {
    leavingRef.current = true
    removeQr(qr.short_code)
    notify('Código eliminado.')
    navigate('/codigos')
  }

  return (
    <div ref={rootRef} className="space-y-6">
      <UnsavedGuard
        when={dirty}
        bypassRef={leavingRef}
        message="Tus cambios en este código no se han guardado y se perderán."
      />

      <header className="flex items-start gap-3">
        <Tooltip content="Volver al listado">
          <Link
            to="/codigos"
            aria-label="Volver al listado"
            className="grid size-9 shrink-0 place-items-center rounded-full text-brand-ink/75 transition-colors hover:bg-white/70 hover:text-brand-ink max-lg:size-11"
          >
            <IconChevronLeft className="size-5" />
          </Link>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold tracking-tight wrap-anywhere">
              {qr.title}
            </h1>
            <StatusBadge status={qr.status} />
          </div>
          <p className="text-sm wrap-anywhere text-brand-ink/75">
            <code className="font-mono">{qr.short_code}</code>
            {project ? ` · ${project.name}` : null} ·{' '}
            {scansLabel(qr.total_scans)}
          </p>
        </div>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 basis-72 space-y-1">
          {savedTarget ? (
            <>
              <p className="text-xs text-brand-ink/75">Al escanear lleva a</p>
              <TargetLine url={savedTarget} />
            </>
          ) : (
            <Notice tone="danger">
              Falta la página para códigos retirados: quien escanee verá un
              aviso de recurso no disponible.{' '}
              {canEditSettings ? (
                <Link to="/ajustes" className="font-semibold underline">
                  Configúrala en Ajustes
                </Link>
              ) : (
                'Pide a un administrador que la configure.'
              )}
            </Notice>
          )}
        </div>
        {allowed ? (
          <div className="flex flex-wrap gap-2">
            {flow.actions.map((action) => (
              <Button
                key={action.to}
                variant={action.primary ? 'primary' : 'secondary'}
                onClick={() => requestStatus(action.to)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4">
            <CardTitle
              info={`El QR impreso codifica ${shortUrl}: el destino se cambia aquí sin reimprimir.`}
            >
              Datos
            </CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Título"
                error={
                  attempted && !draft.title.trim() ? 'Escribe un título.' : ''
                }
              >
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
                  onChange={(event) =>
                    patch({ project_id: event.target.value })
                  }
                >
                  <option value="">Sin proyecto</option>
                  {projects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <DestinationField
              label="Destino final"
              hint="Adónde lleva el código publicado."
              value={draft.target_url}
              required
              disabled={!allowed}
              showError={attempted}
              onChange={(target_url) => patch({ target_url })}
            />
            {destinationChanged ? (
              <Notice>
                Al guardar, los libros ya impresos llevarán a este destino.
              </Notice>
            ) : null}
            <TestDestinationField
              value={draft.draft_url || ''}
              disabled={!allowed}
              showError={attempted}
              onChange={(draft_url) => patch({ draft_url })}
            />
            <TagPicker
              options={RESOURCE_TAGS}
              value={draft.tags}
              disabled={!allowed}
              onChange={(tags) => patch({ tags })}
            />
          </Card>

          <Section
            title="Estilo"
            meta="Solo afecta a las próximas impresiones."
          >
            <StyleControls
              style={draft.style}
              disabled={!allowed}
              onChange={(style) => patch({ style })}
            />
          </Section>

          <Section title="Últimos escaneos" meta={scansLabel(qr.total_scans)}>
            <div className="space-y-3">
              {qrScans.length === 0 ? (
                <p className="text-sm text-brand-ink/75">
                  Sin escaneos todavía.
                </p>
              ) : (
                <ul className="divide-y divide-brand-ink/8 text-sm">
                  {qrScans.slice(0, 5).map((scan) => (
                    <li
                      key={scan.id}
                      className="flex flex-wrap justify-between gap-x-3 py-2"
                    >
                      <span className="text-brand-ink/80">
                        {new Date(scan.timestamp).toLocaleString('es')}
                      </span>
                      <span className="text-brand-ink/75">
                        {scan.device_os} · {scan.browser}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/analitica"
                className="inline-flex items-center text-sm font-semibold text-brand-primary-deep hover:underline max-lg:min-h-11"
              >
                Ver analítica
              </Link>
            </div>
          </Section>

          {canDelete ? (
            <div className="flex justify-end">
              <Button variant="danger" onClick={() => setDialog('delete')}>
                Eliminar código
              </Button>
            </div>
          ) : null}
        </div>

        {/* En móvil va primero: casi siempre se viene a descargar o a copiar. */}
        <div className="order-first min-w-0 space-y-6 lg:order-none">
          {justCreated ? (
            <Notice tone="success">
              Código creado. Descárgalo para enviarlo a imprenta.
            </Notice>
          ) : null}

          <Card className="space-y-4">
            {qr.origin === 'importado' ? (
              <CardTitle info="Úsala al reimprimir: mismo destino, con redirección editable y analítica.">
                Versión dinámica
              </CardTitle>
            ) : (
              <h2 className="font-semibold">Código impreso</h2>
            )}
            <div className="glass-well flex justify-center rounded-2xl p-4">
              <QrPreview data={shortUrl} style={draft.style} size={220} />
            </div>
            <p className="break-all font-mono text-xs text-brand-ink/75">
              {shortUrl}
            </p>
            <CopyButton text={shortUrl} label="Copiar URL impresa" />
            <LegibilityCheck data={shortUrl} style={draft.style} />
            <div className="space-y-4 border-t border-brand-ink/8 pt-4">
              <h3 className="font-semibold">Descargar</h3>
              <ExportPanel
                data={shortUrl}
                style={draft.style}
                title={draft.title}
                disabled={!can(session?.role, 'qr:export')}
                blockedReason={
                  dirty ? 'Guarda o descarta los cambios para descargar.' : ''
                }
              />
            </div>
          </Card>

          {qr.origin === 'importado' ? (
            <LegacyCard qr={qr} shortUrl={shortUrl} />
          ) : null}
        </div>
      </div>

      {allowed && dirty ? (
        <div
          role="status"
          className="glass-thick sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[1.75rem] py-2.5 pr-2.5 pl-5 [animation:aviso-entra_.3s_var(--ease-ios)_both]"
        >
          <p className="text-sm font-semibold">Cambios sin guardar</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(qr)
                setAttempted(false)
              }}
            >
              Descartar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      ) : null}

      {dialog === 'published' ? (
        <ConfirmDialog
          title={`¿${qr.status === 'deprecated' ? 'Volver a publicar' : 'Publicar'} este código?`}
          confirmLabel="Publicar"
          onConfirm={() => applyStatus('published')}
          onCancel={() => setDialog(null)}
        >
          <p>Quien escanee irá a:</p>
          <TargetLine url={draft.target_url.trim()} />
          {dirty ? <p>También se guardarán tus cambios pendientes.</p> : null}
        </ConfirmDialog>
      ) : null}

      {dialog === 'draft' ? (
        <ConfirmDialog
          title="¿Volver a borrador?"
          confirmLabel="Volver a borrador"
          onConfirm={() => applyStatus('draft')}
          onCancel={() => setDialog(null)}
        >
          <p>Aunque el libro ya esté impreso, quien escanee irá a:</p>
          <TargetLine
            url={resolveTarget(
              { ...trimmedFields(draft), status: 'draft' },
              settings,
            )}
          />
          {dirty ? <p>También se guardarán tus cambios pendientes.</p> : null}
        </ConfirmDialog>
      ) : null}

      {dialog === 'deprecated' ? (
        settings.deprecatedUrl ? (
          <ConfirmDialog
            title="¿Retirar este código?"
            confirmLabel="Retirar"
            onConfirm={() => applyStatus('deprecated')}
            onCancel={() => setDialog(null)}
          >
            <p>Quien escanee irá a la página de aviso:</p>
            <TargetLine url={settings.deprecatedUrl} />
            {dirty ? <p>También se guardarán tus cambios pendientes.</p> : null}
          </ConfirmDialog>
        ) : (
          <ConfirmDialog
            title="Falta la página de aviso"
            cancelLabel="Cerrar"
            extraAction={
              canEditSettings ? (
                <Link to="/ajustes">
                  <Button className="w-full">Ir a Ajustes</Button>
                </Link>
              ) : null
            }
            onCancel={() => setDialog(null)}
          >
            <p>
              Para retirar un código, primero hay que configurar la página de
              aviso en Ajustes.
              {canEditSettings ? '' : ' Pide a un administrador que lo haga.'}
            </p>
          </ConfirmDialog>
        )
      ) : null}

      {dialog === 'delete' ? (
        <ConfirmDialog
          title={risky ? '¿Eliminar este código?' : '¿Eliminar este borrador?'}
          confirmLabel="Eliminar para siempre"
          cancelLabel="Conservar"
          tone="danger"
          typeToConfirm={risky ? qr.short_code : ''}
          extraAction={
            qr.status === 'published' ? (
              <Button
                variant="secondary"
                onClick={() => requestStatus('deprecated')}
              >
                Retirar en su lugar
              </Button>
            ) : null
          }
          onConfirm={handleDelete}
          onCancel={() => setDialog(null)}
        >
          {risky ? (
            <>
              <p>
                Los libros impresos con <code>{qr.short_code}</code> dejarán de
                funcionar para siempre.
                {hasScans ? ` Se perderán ${scansLabel(qr.total_scans)}.` : ''}
              </p>
              {qr.status === 'published' ? (
                <p>Si solo quieres dejar de usarlo, mejor retíralo.</p>
              ) : null}
            </>
          ) : (
            <p>
              Si ya enviaste su archivo a imprenta, ese QR dejará de funcionar.
            </p>
          )}
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
