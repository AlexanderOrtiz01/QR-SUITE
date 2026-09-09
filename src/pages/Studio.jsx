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
} from '../components/ui.jsx'
import { StyleControls } from '../components/StyleControls.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { TagPicker } from '../components/TagPicker.jsx'

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
        <h1 className="text-2xl font-bold tracking-tight">Estudio de diseño</h1>
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
        className="grid gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-semibold">Contenido</h2>
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
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Destinos y estado</h2>
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
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Estilo institucional</h2>
            <StyleControls style={style} onChange={setStyle} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-semibold">Vista previa</h2>
            <div className="flex justify-center rounded-lg bg-slate-50 p-4">
              <QrPreview data={shortUrl} style={style} size={220} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700">URL impresa</p>
              <p className="mt-0.5 break-all font-mono text-xs text-slate-500">
                {shortUrl}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={!allowed}>
              Guardar código
            </Button>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Exportar</h2>
            <ExportPanel
              data={shortUrl}
              style={style}
              title={title || shortCode}
              disabled={!can(session?.role, 'qr:export')}
            />
          </Card>
        </div>
      </form>
    </div>
  )
}
