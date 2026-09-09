import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { DEFAULT_STYLE } from '../lib/brand.js'
import { QR_STATUS, RESOURCE_TAGS, createQr } from '../lib/schema.js'
import { generateUniqueShortCode } from '../lib/shortcode.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import { can } from '../lib/roles.js'
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Select,
  StepCard,
} from '../components/ui.jsx'
import { StyleControls } from '../components/StyleControls.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { TagPicker } from '../components/TagPicker.jsx'

/**
 * Estudio de diseño, organizado como el asistente por pasos numerados de
 * QRStuff: el trabajo baja por la columna izquierda mientras la vista previa y
 * la descarga permanecen fijas a la derecha.
 */
export function Studio() {
  const navigate = useNavigate()
  const { projects, qrs, addQr, session } = useApp()
  const allowed = can(session?.role, 'qr:write')

  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [status, setStatus] = useState('draft')
  const [tags, setTags] = useState([])
  const [style, setStyle] = useState(DEFAULT_STYLE)

  // El código corto se reserva al abrir el estudio, de modo que la vista
  // previa muestre exactamente la URL que se va a imprimir.
  const shortCode = useMemo(
    () => generateUniqueShortCode(qrs.map((qr) => qr.short_code)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const shortUrl = shortUrlFor(shortCode)

  function handleSubmit(event) {
    event.preventDefault()
    if (!allowed) return
    addQr(
      createQr({
        shortCode,
        projectId,
        title: title.trim(),
        targetUrl: targetUrl.trim(),
        draftUrl: draftUrl.trim(),
        status,
        tags,
        style,
        createdBy: session?.email,
      }),
    )
    navigate(`/codigos/${shortCode}`)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Crear código QR</h1>
        <p className="text-sm text-slate-500">
          El QR codifica la URL corta, no el destino: por eso el destino se
          puede cambiar después sin reimprimir el libro.
        </p>
      </header>

      {!allowed ? (
        <Banner tone="warning">
          Tu rol es de solo lectura. Puedes previsualizar, pero no guardar
          códigos nuevos.
        </Banner>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr_340px]"
      >
        <div className="space-y-5">
          <StepCard
            step="1"
            title="Contenido"
            hint="Qué recurso representa este código"
          >
            <Field label="Título">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Video explicativo — Ecuaciones cuadráticas"
                required
              />
            </Field>
            <Field label="Proyecto">
              <Select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
              >
                <option value="">Selecciona un proyecto…</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            {projects.length === 0 ? (
              <p className="text-xs text-amber-700">
                No hay proyectos todavía. Crea uno en la sección Proyectos.
              </p>
            ) : null}
            <TagPicker
              options={RESOURCE_TAGS}
              value={tags}
              onChange={setTags}
            />
          </StepCard>

          <StepCard
            step="2"
            title="Destino"
            hint="A dónde lleva el código al escanearlo"
          >
            <Field label="Estado" hint={QR_STATUS[status]?.hint}>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {Object.values(QR_STATUS).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Destino publicado"
              hint="URL definitiva a la que apunta el QR cuando está publicado."
            >
              <Input
                type="url"
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                placeholder="https://recursos.clases.edu/videos/eq-cuad.mp4"
                required
              />
            </Field>
            <Field
              label="Destino de borrador"
              hint="Vista previa interna en Drive. Se usa mientras el estado sea Borrador."
            >
              <Input
                type="url"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                placeholder="https://drive.google.com/…"
              />
            </Field>
          </StepCard>

          <StepCard
            step="3"
            title="Personalización"
            hint="Dentro de los límites del manual de marca"
          >
            <StyleControls style={style} onChange={setStyle} />
          </StepCard>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card className="space-y-4">
            <h2 className="font-semibold">Vista previa</h2>
            <div className="flex justify-center rounded-lg bg-ssf-mist p-4">
              <QrPreview data={shortUrl} style={style} size={220} />
            </div>
            <div>
              <p className="text-xs font-medium text-ssf-charcoal">
                URL impresa
              </p>
              <p className="mt-0.5 break-all font-mono text-xs text-slate-500">
                {shortUrl}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={!allowed}>
              Guardar código
            </Button>
          </Card>

          <StepCard
            step="4"
            title="Descargar"
            hint="Formatos para imprenta y digital"
          >
            <ExportPanel
              data={shortUrl}
              style={style}
              title={title || shortCode}
              disabled={!can(session?.role, 'qr:export')}
            />
          </StepCard>
        </div>
      </form>
    </div>
  )
}
