import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  CardTitle,
  Field,
  Input,
  PageHeader,
  Select,
} from '../components/ui.jsx'
import { Tooltip } from '../components/Tooltip.jsx'
import { StepHeader, StepProgress, TabBar } from '../components/Wizard.jsx'
import {
  ColorControls,
  FrameControls,
  GradientControls,
  LogoControls,
  ShapeControls,
} from '../components/StyleControls.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
import { ExportPanel } from '../components/ExportPanel.jsx'
import { TagPicker } from '../components/TagPicker.jsx'
import { SaveReveal } from '../components/SaveReveal.jsx'
import { LegibilityCheck } from '../components/LegibilityCheck.jsx'

const STEPS = [
  {
    id: 'contenido',
    label: 'Contenido',
    title: 'Describe el recurso',
  },
  {
    id: 'destino',
    label: 'Destino',
    title: 'Define a dónde lleva',
    hint: 'Se puede cambiar después sin reimprimir el código.',
  },
  {
    id: 'estilo',
    label: 'Estilo',
    title: 'Personaliza el código',
    hint: 'Solo opciones dentro del manual de marca.',
  },
  {
    id: 'guardar',
    label: 'Guardar',
    title: 'Revisa y guarda',
  },
]

const STYLE_TABS = [
  { id: 'colores', label: 'Colores' },
  { id: 'degradado', label: 'Degradado' },
  { id: 'forma', label: 'Forma' },
  { id: 'marco', label: 'Marco' },
  { id: 'logo', label: 'Logotipo' },
]

function Summary({ rows }) {
  return (
    <dl className="divide-y divide-brand-ink/8 text-sm">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 py-2.5 sm:grid-cols-[10rem_minmax(0,1fr)]"
        >
          <dt className="text-brand-ink/65">{row.label}</dt>
          <dd className="text-brand-ink wrap-anywhere">
            {row.value || 'Sin definir'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Studio() {
  const navigate = useNavigate()
  const { projects, qrs, addQr, session } = useApp()
  const allowed = can(session?.role, 'qr:write')

  const [step, setStep] = useState(0)
  const [guardado, setGuardado] = useState(false)
  const [styleTab, setStyleTab] = useState('colores')
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
  const project = projects.find((item) => item.id === projectId)

  // Cada paso se valida antes de dejar avanzar, igual que en el asistente de
  // referencia: no tiene sentido llegar a Guardar sin destino.
  const stepValid = [
    Boolean(title.trim() && projectId),
    Boolean(targetUrl.trim()),
    true,
    Boolean(title.trim() && projectId && targetUrl.trim()),
  ]

  function handleSave() {
    if (!allowed || !stepValid[3]) return
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
    // El código ya está guardado: la escena solo cubre el salto a su ficha.
    setGuardado(true)
  }

  const isLast = step === STEPS.length - 1
  const action = isLast ? (
    <Button onClick={handleSave} disabled={!allowed || !stepValid[3]}>
      Guardar código
    </Button>
  ) : (
    <Button onClick={() => setStep(step + 1)} disabled={!stepValid[step]}>
      Siguiente ›
    </Button>
  )

  return (
    <div className="space-y-6">
      {guardado ? (
        <SaveReveal
          data={shortUrl}
          style={style}
          title={title.trim() || shortCode}
          onDone={() => navigate(`/codigos/${shortCode}`)}
        />
      ) : null}

      <PageHeader
        title="Crear código QR"
        info="El QR codifica la URL corta, no el destino: el destino se puede cambiar después sin reimprimir el libro."
      />

      {!allowed ? (
        <Banner tone="warning">Solo lectura: no puedes guardar.</Banner>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6">
          <StepProgress steps={STEPS} current={step} onSelect={setStep} />

          <StepHeader
            title={STEPS[step].title}
            hint={STEPS[step].hint}
            onBack={step > 0 ? () => setStep(step - 1) : null}
            action={action}
          />

          {step === 0 ? (
            <div className="space-y-4">
              <Field label="Título">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Video explicativo: Ecuaciones cuadráticas"
                />
              </Field>
              <Field label="Proyecto">
                <Select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  <option value="">Selecciona un proyecto…</option>
                  {projects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {projects.length === 0 ? (
                <p className="text-xs font-semibold text-brand-primary-deep">
                  Sin proyectos.{' '}
                  <Link
                    to="/proyectos"
                    className="underline underline-offset-2"
                  >
                    Crear uno
                  </Link>
                </p>
              ) : null}
              <TagPicker
                options={RESOURCE_TAGS}
                value={tags}
                onChange={setTags}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
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
                hint="Adónde lleva el QR una vez publicado."
              >
                <Input
                  type="url"
                  value={targetUrl}
                  onChange={(event) => setTargetUrl(event.target.value)}
                  placeholder="https://recursos.clases.edu.sv/videos/eq-cuad.mp4"
                />
              </Field>
              <Field
                label="Destino de borrador"
                hint="Vista previa interna (Drive). Se usa mientras esté en Borrador."
              >
                <Input
                  type="url"
                  value={draftUrl}
                  onChange={(event) => setDraftUrl(event.target.value)}
                  placeholder="https://drive.google.com/…"
                />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <TabBar
                tabs={STYLE_TABS}
                value={styleTab}
                onChange={setStyleTab}
              />
              {styleTab === 'colores' ? (
                <ColorControls style={style} onChange={setStyle} />
              ) : null}
              {styleTab === 'degradado' ? (
                <GradientControls style={style} onChange={setStyle} />
              ) : null}
              {styleTab === 'forma' ? (
                <ShapeControls style={style} onChange={setStyle} />
              ) : null}
              {styleTab === 'marco' ? (
                <FrameControls style={style} onChange={setStyle} />
              ) : null}
              {styleTab === 'logo' ? (
                <LogoControls style={style} onChange={setStyle} />
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <Summary
                rows={[
                  { label: 'Título', value: title },
                  { label: 'Proyecto', value: project?.name },
                  { label: 'Etiquetas', value: tags.join(' · ') },
                  { label: 'Estado', value: QR_STATUS[status]?.label },
                  { label: 'Destino publicado', value: targetUrl },
                  { label: 'Destino de borrador', value: draftUrl },
                  { label: 'URL impresa', value: shortUrl },
                ]}
              />
              <div className="border-t border-brand-ink/10 pt-5">
                <CardTitle as="h3" className="mb-3">
                  Descargar
                </CardTitle>
                <ExportPanel
                  data={shortUrl}
                  style={style}
                  title={title || shortCode}
                  disabled={!can(session?.role, 'qr:export')}
                />
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-semibold">Vista previa</h2>
          <div className="glass-well flex justify-center rounded-2xl p-4">
            <QrPreview data={shortUrl} style={style} size={200} />
          </div>
          <Tooltip content="URL que se imprime en el código">
            <p className="font-mono text-xs break-all text-brand-ink/65">
              {shortUrl}
            </p>
          </Tooltip>
          <LegibilityCheck data={shortUrl} style={style} />
        </Card>
      </div>
    </div>
  )
}
