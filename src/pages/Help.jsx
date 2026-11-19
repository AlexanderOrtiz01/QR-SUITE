import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { TOURS } from '../lib/tours.js'
import { useTour } from '../components/tour/TourProvider.jsx'
import { Button, PageHeader } from '../components/ui.jsx'
import {
  IconChart,
  IconCheck,
  IconChevronLeft,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconImport,
  IconList,
  IconQrPlus,
  IconSettings,
  IconUsers,
} from '../components/icons.jsx'

/** Orden fijo de las secciones: de lo básico a lo administrativo. */
const CATEGORIES = ['Primeros pasos', 'Códigos', 'Análisis', 'Administración']

/** Cada guía lleva el icono de la sección del menú que recorre. */
const TOUR_ICONS = {
  'conoce-la-plataforma': IconDashboard,
  'crear-qr': IconQrPlus,
  'organizar-proyectos': IconFolder,
  'buscar-codigos': IconList,
  'gestionar-codigo': IconQrPlus,
  'importar-codigos': IconImport,
  'ver-analitica': IconChart,
  'personas-y-roles': IconUsers,
  'ajustes-organizacion': IconSettings,
}

const FAQ = [
  {
    q: '¿Qué pasa si cambio el destino de un código ya impreso?',
    a: 'Nada en el papel: el QR apunta a una URL corta, y esta redirige al nuevo destino en cuanto guardas.',
  },
  {
    q: '¿Por qué no puedo crear ni editar códigos?',
    a: 'Tu rol es de solo lectura. Pide a un administrador que te asigne el rol Editor / Maquetador en Ajustes.',
  },
  {
    q: '¿En qué formato descargo el QR para imprenta?',
    a: 'En SVG, que es vectorial y no pierde nitidez al ampliarse. PNG y WebP sirven para pantallas y documentos.',
  },
]

const stepsLabel = (n) => `${n} ${n === 1 ? 'paso' : 'pasos'}`

/**
 * Una guía es una fila entera pulsable: el icono dice qué sección recorre, y
 * el final de la fila dice si ya la hiciste. Así la página no repite nueve
 * botones idénticos y el único botón destacado queda para la guía siguiente.
 */
function TourRow({ tour, done, onStart }) {
  const Icon = TOUR_ICONS[tour.id] ?? IconHelp
  return (
    <li>
      <button
        type="button"
        onClick={() => onStart(tour.id)}
        className="group flex w-full items-center gap-4 rounded-[1.25rem] px-3 py-3 text-left transition-colors duration-200 ease-ios hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none active:bg-white/80"
      >
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
            done
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-brand-primary/10 text-brand-primary'
          }`}
        >
          {done ? (
            <IconCheck className="size-5" />
          ) : (
            <Icon className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-brand-deep">
            {tour.title}
          </span>
          <span className="mt-0.5 block text-sm text-brand-ink/75">
            {tour.description}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-brand-ink/70">
          <span className="max-sm:hidden">
            {done ? 'Completada · repetir' : stepsLabel(tour.steps.length)}
          </span>
          <IconChevronLeft className="size-4 rotate-180 text-brand-ink/50 transition-transform duration-200 ease-ios group-hover:translate-x-0.5 group-hover:text-brand-primary" />
        </span>
      </button>
    </li>
  )
}

function ProgressPanel({ tours, doneCount, nextTour, onStart }) {
  const total = tours.length
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  return (
    <section
      aria-labelledby="ayuda-progreso"
      className="glass rounded-[1.75rem] p-5"
    >
      <h2 id="ayuda-progreso" className="font-semibold text-brand-deep">
        Tu progreso
      </h2>
      <p className="mt-1 text-sm text-brand-ink/75">
        <span className="font-semibold text-brand-ink tabular-nums">
          {doneCount} de {total}
        </span>{' '}
        guías completadas
      </p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-primary/12"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneCount}
        aria-label="Guías completadas"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-ios"
          style={{ width: `${pct}%` }}
        />
      </div>

      {nextTour ? (
        <div className="mt-5 border-t border-brand-ink/10 pt-5">
          <h3 className="text-sm text-brand-ink/75">Siguiente guía</h3>
          <p className="mt-1 text-lg leading-snug font-semibold text-brand-deep">
            {nextTour.title}
          </p>
          <p className="mt-1 text-sm text-brand-ink/75">
            {nextTour.description}
          </p>
          <Button className="mt-4 w-full" onClick={() => onStart(nextTour.id)}>
            Iniciar guía · {stepsLabel(nextTour.steps.length)}
          </Button>
        </div>
      ) : (
        <p className="mt-5 border-t border-brand-ink/10 pt-5 text-sm text-brand-ink/75">
          Ya recorriste todas las guías. Puedes repetir cualquiera desde la
          lista.
        </p>
      )}
    </section>
  )
}

export function Help() {
  const { session } = useApp()
  const { start, isDone } = useTour()
  const tours = TOURS.filter(
    (tour) => !tour.requires || can(session?.role, tour.requires),
  )
  // Las categorías desconocidas van al final, para no perder ninguna guía.
  const categories = [
    ...CATEGORIES,
    ...new Set(tours.map((tour) => tour.category)),
  ].filter(
    (category, index, all) =>
      all.indexOf(category) === index &&
      tours.some((tour) => tour.category === category),
  )
  const ordered = categories.flatMap((category) =>
    tours.filter((tour) => tour.category === category),
  )
  const done = (id) => Boolean(isDone?.(id))
  const doneCount = ordered.filter((tour) => done(tour.id)).length
  const nextTour = ordered.find((tour) => !done(tour.id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayuda"
        meta="Guías paso a paso que te señalan cada parte del panel."
      />

      {/* En pantallas estrechas el progreso va primero: lleva la única acción
          destacada. En escritorio pasa a la columna derecha, junto a la lista. */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:grid-rows-[auto_1fr]">
        <div className="xl:col-start-2 xl:row-start-1">
          <ProgressPanel
            tours={ordered}
            doneCount={doneCount}
            nextTour={nextTour}
            onStart={start}
          />
        </div>

        <div className="glass divide-y xl:col-start-1 xl:row-span-2 xl:row-start-1 divide-brand-ink/8 rounded-[1.75rem] px-2 py-2">
          {categories.map((category) => (
            <section
              key={category}
              aria-labelledby={`ayuda-${category}`}
              className="px-2 pt-4 pb-2 first:pt-3"
            >
              <h2
                id={`ayuda-${category}`}
                className="px-3 pb-1 text-sm font-semibold text-brand-ink/70"
              >
                {category}
              </h2>
              <ul>
                {tours
                  .filter((tour) => tour.category === category)
                  .map((tour) => (
                    <TourRow
                      key={tour.id}
                      tour={tour}
                      done={done(tour.id)}
                      onStart={start}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <section
          aria-labelledby="ayuda-faq"
          className="space-y-2 xl:col-start-2 xl:row-start-2"
        >
          <h2
            id="ayuda-faq"
            className="px-1 text-sm font-semibold text-brand-ink/70"
          >
            Preguntas rápidas
          </h2>
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="glass group rounded-[1.5rem] px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl text-sm font-semibold max-lg:min-h-11 [&::-webkit-details-marker]:hidden">
                {item.q}
                <IconChevronLeft className="size-4 shrink-0 -rotate-90 text-brand-ink/60 transition-transform duration-200 ease-ios group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-sm text-brand-ink/75">{item.a}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  )
}
