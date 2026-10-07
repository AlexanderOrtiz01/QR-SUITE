import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/useApp.js'
import { QR_STATUS, RESOURCE_TAGS, createQr } from '../lib/schema.js'
import { generateUniqueShortCode } from '../lib/shortcode.js'
import { shortUrlFor } from '../lib/shortUrl.js'
import { can } from '../lib/roles.js'
import {
  ENTRY_STATES,
  classifyEntries,
  normalizeUrl,
  parseLinks,
  sourceOf,
  titleFromUrl,
} from '../lib/importer.js'
import { decodeQrImage } from '../lib/qrDecode.js'
import {
  Banner,
  Button,
  Card,
  CardTitle,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '../components/ui.jsx'
import { TabBar } from '../components/Wizard.jsx'
import { TagPicker } from '../components/TagPicker.jsx'
import { InfoTip, Tooltip } from '../components/Tooltip.jsx'
import {
  IconCheck,
  IconClose,
  IconImage,
  IconLink,
} from '../components/icons.jsx'

const SOURCES = [
  { id: 'imagenes', label: 'Imágenes de QR' },
  { id: 'enlaces', label: 'Lista de enlaces' },
]

// Nombres que pone la cámara o el sistema: no describen el recurso.
const CAMERA_NAMES =
  /^(img|dsc|pxl|photo|foto|image|imagen|captura|screenshot|whatsapp)/i

let nextId = 0
const newId = (prefix) => `${prefix}-${(nextId += 1)}`

/** Título a partir del nombre del archivo, si es descriptivo. */
function titleFromFile(name) {
  const base = name.replace(/\.[^.]+$/, '')
  if (CAMERA_NAMES.test(base) || !/[a-záéíóúñ]{3,}/i.test(base)) return ''
  // «qr-unidad-3» o «codigo_qr_lectura»: la palabra «qr» sobra en el título.
  const words = base
    .replace(/[-_]+/g, ' ')
    .replace(/\b(c[oó]digo\s+)?qr\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!words) return ''
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const CHIP_TONES = {
  listo: 'bg-brand-primary/10 text-brand-primary-deep',
  leyendo: 'bg-brand-ink/6 text-brand-ink/65',
  ilegible: 'bg-red-50 text-red-700',
}

function StateChip({ state }) {
  const meta = ENTRY_STATES[state]
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${
          CHIP_TONES[state] || 'bg-brand-ink/6 text-brand-ink/65'
        }`}
      >
        {state === 'leyendo' ? <Spinner className="size-3" /> : null}
        {meta.label}
      </span>
      {meta.hint ? <InfoTip label="Por qué">{meta.hint}</InfoTip> : null}
    </span>
  )
}

/**
 * Importación de códigos que ya están impresos y se generaron en otra
 * plataforma: desde imágenes de los QR (se leen en el navegador) o desde una
 * lista de enlaces pegada o en CSV. Todo se revisa antes de guardar.
 */
export function Import() {
  const { projects, qrs, importQrs, session } = useApp()
  const allowed = can(session?.role, 'qr:write')

  const [source, setSource] = useState('imagenes')
  const [entries, setEntries] = useState([])
  const [text, setText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState('published')
  const [tags, setTags] = useState([])
  const [done, setDone] = useState(null)

  // Miniaturas creadas con `createObjectURL`: se liberan al salir.
  const thumbsRef = useRef(new Set())
  useEffect(() => {
    const thumbs = thumbsRef.current
    return () => thumbs.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const classified = useMemo(
    () => classifyEntries(entries, { qrs, shortUrlBase: shortUrlFor('') }),
    [entries, qrs],
  )
  const ready = classified.filter((entry) => entry.state === 'listo')
  const reading = classified.some((entry) => entry.state === 'leyendo')
  const skipped = classified.length - ready.length

  function patchEntry(id, patch) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    )
  }

  function removeEntry(id) {
    setEntries((current) => {
      const entry = current.find((item) => item.id === id)
      if (entry?.thumb) {
        URL.revokeObjectURL(entry.thumb)
        thumbsRef.current.delete(entry.thumb)
      }
      return current.filter((item) => item.id !== id)
    })
  }

  async function addFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'))
    if (files.length === 0) return
    setDone(null)
    const added = files.map((file) => {
      const thumb = URL.createObjectURL(file)
      thumbsRef.current.add(thumb)
      return {
        id: newId('imagen'),
        kind: 'imagen',
        file,
        name: file.name,
        thumb,
        title: titleFromFile(file.name),
        pending: true,
      }
    })
    setEntries((current) => [...current, ...added])

    // Una a una: leer varias fotos grandes a la vez bloquearía la pantalla.
    for (const entry of added) {
      try {
        const content = await decodeQrImage(entry.file)
        if (!content) {
          patchEntry(entry.id, { pending: false, unreadable: true })
          continue
        }
        const url = normalizeUrl(content)
        patchEntry(entry.id, {
          pending: false,
          content,
          url,
          title: entry.title || (url ? titleFromUrl(url) : ''),
        })
      } catch (error) {
        console.error('[qrsuite] no se pudo leer la imagen', error)
        patchEntry(entry.id, { pending: false, unreadable: true })
      }
    }
  }

  function addLinks() {
    const parsed = parseLinks(text).map((entry) => ({
      ...entry,
      id: newId('enlace'),
      kind: 'enlace',
    }))
    if (parsed.length === 0) return
    setDone(null)
    setEntries((current) => [...current, ...parsed])
    setText('')
  }

  async function loadCsv(file) {
    if (!file) return
    const content = (await file.text()).trim()
    setText((current) => [current.trim(), content].filter(Boolean).join('\n'))
  }

  function handleImport() {
    if (!allowed || !projectId || ready.length === 0) return
    const taken = qrs.map((qr) => qr.short_code)
    const list = ready.map((entry) => {
      const shortCode = generateUniqueShortCode(taken)
      taken.push(shortCode)
      return createQr({
        shortCode,
        projectId,
        title: entry.title.trim() || titleFromUrl(entry.url),
        targetUrl: entry.url,
        status,
        tags,
        createdBy: session?.email,
        legacy: { content: entry.content, source: sourceOf(entry.url) },
      })
    })
    importQrs(list)
    // Las entradas importadas salen de la lista; las omitidas se quedan por
    // si se quieren revisar.
    const imported = new Set(ready.map((entry) => entry.id))
    entries
      .filter((entry) => imported.has(entry.id) && entry.thumb)
      .forEach((entry) => {
        URL.revokeObjectURL(entry.thumb)
        thumbsRef.current.delete(entry.thumb)
      })
    setEntries((current) => current.filter((entry) => !imported.has(entry.id)))
    setDone({ count: list.length, projectId })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar códigos"
        info="Para QR que ya están impresos en los libros y se generaron en otra plataforma. Cada uno queda en el catálogo y recibe una URL corta con el mismo destino."
      />

      {!allowed ? (
        <Banner tone="warning">Solo lectura: no puedes importar.</Banner>
      ) : null}

      {done ? (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="glass-tint grid size-9 shrink-0 place-items-center rounded-full text-white">
              <IconCheck className="size-5" strokeWidth="2.4" />
            </span>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold">
                {done.count}{' '}
                {done.count === 1 ? 'código importado' : 'códigos importados'}
              </p>
              <InfoTip>
                Cada uno ya tiene su URL corta. En su ficha verás cómo usarla
                con el QR original.
              </InfoTip>
            </div>
          </div>
          <Link to={`/codigos?proyecto=${done.projectId}`}>
            <Button variant="secondary">Ver códigos</Button>
          </Link>
        </Card>
      ) : null}

      <Card className="space-y-5">
        <TabBar tabs={SOURCES} value={source} onChange={setSource} />

        {source === 'imagenes' ? (
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              addFiles(event.dataTransfer.files)
            }}
            className={`glass-well flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging
                ? 'border-brand-primary bg-white/90'
                : 'border-brand-ink/15 hover:border-brand-primary/50'
            }`}
          >
            <IconImage className="size-8 text-brand-primary" />
            <span className="text-sm font-semibold">
              Arrastra las imágenes o haz clic para elegirlas
            </span>
            <span className="flex items-center gap-1 text-xs text-brand-ink/60">
              Un QR por imagen
              <InfoTip>
                Sirve el archivo que exportó la otra plataforma, o una foto o
                captura de la página del libro con el código completo y nítido.
                Se leen en este equipo: las imágenes no se suben.
              </InfoTip>
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <Field
              label="Enlaces"
              hint="Uno por línea. Puedes pegar dos columnas (título y enlace) desde una hoja de cálculo, o abrir un CSV."
            >
              <textarea
                rows={6}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  'https://qrco.de/bfK2pQ\nVideo unidad 3\thttps://youtu.be/…'
                }
                className="glass-well w-full rounded-xl px-3.5 py-2.5 font-mono text-xs leading-relaxed text-brand-ink outline-none transition-[background-color,box-shadow] duration-200 focus:bg-white/90 focus:ring-4 focus:ring-brand-primary/20"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={addLinks} disabled={!text.trim()}>
                Añadir a la lista
              </Button>
              <label className="glass inline-flex cursor-pointer items-center rounded-full px-5 py-2.5 text-sm font-semibold text-brand-primary-deep transition-colors hover:bg-white/80">
                Abrir CSV
                <input
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="sr-only"
                  onChange={(event) => {
                    loadCsv(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </Card>

      {classified.length > 0 ? (
        <Card className="space-y-5">
          <CardTitle info="Revisa los títulos antes de importar. Solo se importan las entradas marcadas como Listo.">
            Revisión
          </CardTitle>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          {projects.length === 0 ? (
            <p className="text-xs font-semibold text-brand-primary-deep">
              Sin proyectos.{' '}
              <Link to="/proyectos" className="underline underline-offset-2">
                Crear uno
              </Link>
            </p>
          ) : null}
          <TagPicker options={RESOURCE_TAGS} value={tags} onChange={setTags} />

          <ul className="divide-y divide-brand-ink/8 border-t border-brand-ink/8">
            {classified.map((entry) => {
              const importable = entry.state === 'listo'
              return (
                <li key={entry.id} className="flex items-start gap-3 py-3">
                  {entry.thumb ? (
                    <img
                      src={entry.thumb}
                      alt=""
                      className="size-12 shrink-0 rounded-xl bg-white object-cover ring-1 ring-brand-ink/8"
                    />
                  ) : (
                    <span className="glass-well grid size-12 shrink-0 place-items-center rounded-xl text-brand-ink/50">
                      <IconLink className="size-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Input
                      value={entry.title || ''}
                      aria-label="Título"
                      placeholder={entry.name || 'Título'}
                      disabled={!importable}
                      onChange={(event) =>
                        patchEntry(entry.id, { title: event.target.value })
                      }
                    />
                    <div className="flex min-w-0 items-center gap-2">
                      <Tooltip
                        content={entry.content || entry.name}
                        className="flex min-w-0 flex-1"
                      >
                        <p className="truncate font-mono text-xs text-brand-ink/60">
                          {entry.url || entry.content || entry.name}
                        </p>
                      </Tooltip>
                      <StateChip state={entry.state} />
                    </div>
                  </div>
                  <IconButton
                    label="Quitar de la lista"
                    icon={IconClose}
                    onClick={() => removeEntry(entry.id)}
                  />
                </li>
              )
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-ink/8 pt-4">
            <p className="text-sm text-brand-ink/65">
              {ready.length} {ready.length === 1 ? 'listo' : 'listos'}
              {skipped > 0 ? ` · ${skipped} sin importar` : ''}
            </p>
            <Button
              onClick={handleImport}
              disabled={!allowed || !projectId || ready.length === 0 || reading}
            >
              {ready.length === 1
                ? 'Importar 1 código'
                : `Importar ${ready.length} códigos`}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
