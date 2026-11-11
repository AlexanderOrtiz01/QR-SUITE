import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { DEFAULT_STYLE } from '../lib/brand.js'
import { RESOURCE_TAGS, createProject, createQr } from '../lib/schema.js'
import { generateUniqueShortCode } from '../lib/shortcode.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import { urlIssue } from '../lib/urls.js'
import { can } from '../lib/roles.js'
import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Notice,
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
import {
  DestinationField,
  TestDestinationField,
} from '../components/DestinationField.jsx'
import { UnsavedGuard } from '../components/UnsavedGuard.jsx'
import { QrPreview } from '../components/QrPreview.jsx'
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
    hint: 'Opcional: ya lleva el estilo de la marca, y solo se ofrecen opciones del manual.',
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
          <dt className="text-brand-ink/75">{row.label}</dt>
          <dd className="text-brand-ink wrap-anywhere">
            {row.value || 'Sin definir'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Alta de un proyecto sin salir del asistente. No es un formulario propio: iría
 * anidado en el del paso, así que Enter se atiende aquí.
 */
function NewProject({ onCreate, onCancel }) {
  const [name, setName] = useState('')

  function create() {
    if (name.trim()) onCreate(name.trim())
  }

  return (
    <div className="glass-well space-y-3 rounded-2xl p-3">
      <Field label="Nombre del proyecto nuevo">
        <Input
          value={name}
          autoFocus={Boolean(onCancel)}
          placeholder="Matemáticas 1.º Bachillerato"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              create()
            }
          }}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button size="compact" disabled={!name.trim()} onClick={create}>
          Crear proyecto
        </Button>
        {onCancel ? (
          <Button variant="secondary" size="compact" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

const STEP_FIELDS = [['title', 'project'], ['target', 'draft'], [], []]

export function Studio() {
  const navigate = useNavigate()
  const { projects, qrs, addQr, addProject, session } = useApp()
  const allowed = can(session?.role, 'qr:write')
  const canCreateProject = can(session?.role, 'project:write')

  const [step, setStep] = useState(0)
  // Con qué estado se guardó: abre la confirmación y libera la salida.
  const [savedAs, setSavedAs] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [addingProject, setAddingProject] = useState(false)
  const [styleTab, setStyleTab] = useState('colores')
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [tags, setTags] = useState([])
  const [style, setStyle] = useState(DEFAULT_STYLE)
  const formRef = useRef(null)
  const headingRef = useRef(null)

  // El código corto se reserva al abrir el estudio, de modo que la vista
  // previa muestre exactamente la URL que se va a imprimir.
  const shortCode = useMemo(
    () => generateUniqueShortCode(qrs.map((qr) => qr.short_code)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const shortUrl = shortUrlFor(shortCode)
  const project = projects.find((item) => item.id === projectId)

  const errors = {
    title: title.trim() ? '' : 'Escribe un título.',
    project: projectId ? '' : 'Elige un proyecto.',
    target: urlIssue(targetUrl, { required: true }),
    draft: urlIssue(draftUrl),
  }
  const stepHasErrors = (index) =>
    STEP_FIELDS[index].some((field) => errors[field])

  const hasInput = Boolean(
    title || projectId || targetUrl || draftUrl || tags.length,
  )

  /** Al cambiar de paso el foco va a su título, para que se anuncie. */
  function goToStep(index) {
    setStep(index)
    setAttempted(false)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  /** Lleva el foco al primer campo con error, para que no pase inadvertido. */
  function revealErrors() {
    setAttempted(true)
    requestAnimationFrame(() => {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
    })
  }

  function handleNext(event) {
    event.preventDefault()
    if (step === STEPS.length - 1) return
    if (stepHasErrors(step)) {
      revealErrors()
      return
    }
    goToStep(step + 1)
  }

  function handleSave(status) {
    if (!allowed) return
    const firstInvalid = STEP_FIELDS.findIndex((_, index) =>
      stepHasErrors(index),
    )
    if (firstInvalid !== -1) {
      setStep(firstInvalid)
      revealErrors()
      return
    }
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
    setSavedAs(status)
  }

  function handleCreateProject(name) {
    const created = createProject({ name, createdBy: session?.email })
    addProject(created)
    setProjectId(created.id)
    setAddingProject(false)
  }

  const isLast = step === STEPS.length - 1

  return (
    <div className="space-y-6">
      <UnsavedGuard
        when={hasInput && !savedAs}
        message="Este código todavía no se ha guardado y se perderá lo que has escrito."
      />

      {savedAs ? (
        <SaveReveal
          data={shortUrl}
          style={style}
          title={title.trim() || shortCode}
          label={
            savedAs === 'published' ? 'Código publicado' : 'Borrador guardado'
          }
          onDone={() =>
            navigate(`/codigos/${shortCode}`, { state: { created: true } })
          }
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
        <Card className="min-w-0">
          <form
            ref={formRef}
            noValidate
            onSubmit={handleNext}
            className="space-y-6"
          >
            <StepProgress steps={STEPS} current={step} onSelect={goToStep} />

            <StepHeader
              ref={headingRef}
              title={STEPS[step].title}
              hint={STEPS[step].hint}
            />

            {step === 0 ? (
              <div className="space-y-4">
                <Field label="Título" error={attempted ? errors.title : ''}>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Video explicativo: Ecuaciones cuadráticas"
                  />
                </Field>
                {projects.length > 0 ? (
                  <Field
                    label="Proyecto"
                    error={attempted ? errors.project : ''}
                    action={
                      canCreateProject && !addingProject ? (
                        <button
                          type="button"
                          onClick={() => setAddingProject(true)}
                          className="text-xs font-semibold text-brand-primary-deep underline-offset-2 hover:underline max-lg:min-h-11"
                        >
                          Nuevo proyecto
                        </button>
                      ) : null
                    }
                  >
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
                ) : canCreateProject ? (
                  <Notice tone={attempted ? 'danger' : 'info'}>
                    Todo código pertenece a un proyecto, que agrupa los de un
                    libro o asignatura. Crea el primero:
                  </Notice>
                ) : (
                  <Notice tone={attempted ? 'danger' : 'info'}>
                    Todavía no hay proyectos y solo un administrador puede
                    crearlos. Pídele que cree uno para poder continuar.
                  </Notice>
                )}
                {canCreateProject &&
                (addingProject || projects.length === 0) ? (
                  <NewProject
                    onCreate={handleCreateProject}
                    onCancel={
                      projects.length > 0 ? () => setAddingProject(false) : null
                    }
                  />
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
                <DestinationField
                  label="Destino final"
                  hint="Adónde lleva el código cuando está publicado."
                  value={targetUrl}
                  required
                  showError={attempted}
                  onChange={setTargetUrl}
                  placeholder="https://recursos.clases.edu.sv/videos/eq-cuad.mp4"
                />
                <TestDestinationField
                  value={draftUrl}
                  showError={attempted}
                  onChange={setDraftUrl}
                />
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
              <div className="space-y-4">
                <Summary
                  rows={[
                    { label: 'Título', value: title },
                    { label: 'Proyecto', value: project?.name },
                    { label: 'Etiquetas', value: tags.join(' · ') },
                    { label: 'Destino final', value: targetUrl },
                    ...(draftUrl
                      ? [{ label: 'Destino de prueba', value: draftUrl }]
                      : []),
                    { label: 'URL impresa', value: shortUrl },
                  ]}
                />
                <p className="text-sm text-brand-ink/75">
                  Si publicas, quien escanee irá al destino final. Si guardas un
                  borrador, irá{' '}
                  {draftUrl
                    ? 'al destino de prueba'
                    : 'también al destino final, porque no hay destino de prueba'}
                  . Después de guardar podrás descargar el archivo para
                  imprenta.
                </p>
              </div>
            ) : null}

            <div
              className={`flex flex-wrap gap-2 border-t border-brand-ink/10 pt-5 ${
                step > 0 ? 'justify-between' : 'justify-end'
              }`}
            >
              {step > 0 ? (
                <Button variant="secondary" onClick={() => goToStep(step - 1)}>
                  Atrás
                </Button>
              ) : null}
              {isLast ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={!allowed}
                    onClick={() => handleSave('draft')}
                  >
                    Guardar borrador
                  </Button>
                  <Button
                    disabled={!allowed}
                    onClick={() => handleSave('published')}
                  >
                    Guardar y publicar
                  </Button>
                </div>
              ) : (
                <Button type="submit">Siguiente</Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <h2 className="font-semibold">Vista previa</h2>
          <div className="glass-well flex justify-center rounded-2xl p-4">
            <QrPreview data={shortUrl} style={style} size={200} />
          </div>
          <Tooltip content="URL que se imprime en el código">
            <p className="font-mono text-xs break-all text-brand-ink/75">
              {shortUrl}
            </p>
          </Tooltip>
          <p className="text-xs text-brand-ink/75">
            Este enlace empezará a funcionar al guardar.
          </p>
          <LegibilityCheck data={shortUrl} style={style} />
        </Card>
      </div>
    </div>
  )
}
