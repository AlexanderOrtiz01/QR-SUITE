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
  IconEdit,
  IconFolder,
  IconHelp,
  IconImport,
  IconQrPlus,
  IconSearch,
  IconSettings,
  IconUsers,
} from '../components/icons.jsx'

/** Orden fijo de las secciones: de lo básico a lo administrativo. */
const CATEGORIES = ['Primeros pasos', 'Códigos', 'Análisis', 'Administración']

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
 * Cada guía tiene su icono de color, al estilo de los iconos de ajustes de iOS:
 * un azulejo con degradado suave y el símbolo en blanco. Los tonos parten del
 * azul institucional y se abren a vecinos fríos; los cálidos quedan para lo que
 * se distingue (carpetas, analítica).
 */
const TOUR_ART = {
  'conoce-la-plataforma': {
    Icon: IconDashboard,
    tile: 'bg-[linear-gradient(160deg,#5b86ff,#1a48e6)]',
  },
  'crear-qr': {
    Icon: IconQrPlus,
    tile: 'bg-[linear-gradient(160deg,#8b7bff,#4f3fe0)]',
  },
  'organizar-proyectos': {
    Icon: IconFolder,
    tile: 'bg-[linear-gradient(160deg,#ffc24d,#f08a00)]',
  },
  'buscar-codigos': {
    Icon: IconSearch,
    tile: 'bg-[linear-gradient(160deg,#4cc6f5,#0b8fd6)]',
  },
  'gestionar-codigo': {
    Icon: IconEdit,
    tile: 'bg-[linear-gradient(160deg,#b77bff,#7a35e6)]',
  },
  'importar-codigos': {
    Icon: IconImport,
    tile: 'bg-[linear-gradient(160deg,#3fd0c0,#0b968a)]',
  },
  'ver-analitica': {
    Icon: IconChart,
    tile: 'bg-[linear-gradient(160deg,#ff9a5c,#ec5a1c)]',
  },
  'personas-y-roles': {
    Icon: IconUsers,
    tile: 'bg-[linear-gradient(160deg,#ff7aa8,#e0306e)]',
  },
  'ajustes-organizacion': {
    Icon: IconSettings,
    tile: 'bg-[linear-gradient(160deg,#8a97b0,#525e78)]',
  },
}

/** Icono de la guía. Es decorativo: el título ya dice lo mismo. */
function TourIcon({ tour, size = 'md', className = '' }) {
  const { Icon, tile } = TOUR_ART[tour.id] ?? {
    Icon: IconHelp,
    tile: 'bg-[linear-gradient(160deg,#5b86ff,#1a48e6)]',
  }
  const sizes =
    size === 'lg'
      ? 'size-14 rounded-[18px] [&>svg]:size-7'
      : 'size-11 rounded-[14px] [&>svg]:size-[22px]'
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_14px_-6px_rgb(15_31_99/0.45)] ${tile} ${sizes} ${className}`}
    >
      <Icon strokeWidth={2} />
    </span>
  )
}

/**
 * Una guía es una fila entera pulsable con su icono de color; si ya la
 * hiciste, el icono lleva una marca verde. El único
 * botón destacado de la página queda para la guía siguiente.
 */
function TourRow({ tour, done, onStart }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onStart(tour.id)}
        className="group flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-colors duration-200 ease-ios hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none active:bg-white/80"
      >
        <span className="relative shrink-0">
          <TourIcon
            tour={tour}
            className="transition-transform duration-300 ease-ios group-hover:scale-[1.06]"
          />
          {done ? (
            <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
              <IconCheck className="size-3" strokeWidth={3} />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-brand-deep">
            {tour.title}
            {done ? <span className="sr-only"> (completada)</span> : null}
          </span>
          <span className="block text-sm text-brand-ink/70">
            {tour.description}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-brand-ink/70 tabular-nums">
          <span className="max-sm:hidden">{stepsLabel(tour.steps.length)}</span>
          <IconChevronLeft className="size-4 rotate-180 text-brand-ink/40 transition-[color,transform] duration-200 ease-ios group-hover:translate-x-0.5 group-hover:text-brand-primary" />
        </span>
      </button>
    </li>
  )
}

function ProgressPanel({ tours, doneCount, nextTour, onStart }) {
  const total = tours.length
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  return (
    <section aria-labelledby="ayuda-progreso" className="px-1">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="ayuda-progreso"
          className="text-sm font-semibold text-brand-ink/70"
        >
          Tu progreso
        </h2>
        <p className="text-sm text-brand-ink/70 tabular-nums">
          {doneCount} de {total}
        </p>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-brand-ink/10"
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
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <TourIcon tour={nextTour} size="lg" />
            <div className="min-w-0">
              <p className="text-sm text-brand-ink/70">Siguiente</p>
              <p className="leading-snug font-semibold text-brand-deep">
                {nextTour.title}
              </p>
            </div>
          </div>
          <Button className="mt-3 w-full" onClick={() => onStart(nextTour.id)}>
            Iniciar guía
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-brand-ink/70">
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
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[auto_1fr]">
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
              className="px-1 pt-4 pb-1 first:pt-2"
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
          className="space-y-3 xl:col-start-2 xl:row-start-2"
        >
          <h2
            id="ayuda-faq"
            className="px-1 text-sm font-semibold text-brand-ink/70"
          >
            Preguntas rápidas
          </h2>
          <div className="divide-y divide-brand-ink/10 border-y border-brand-ink/10">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-1 py-3">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-lg text-sm font-medium text-brand-deep max-lg:min-h-11 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <IconChevronLeft className="mt-0.5 size-4 shrink-0 -rotate-90 text-brand-ink/50 transition-transform duration-200 ease-ios group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm text-brand-ink/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
