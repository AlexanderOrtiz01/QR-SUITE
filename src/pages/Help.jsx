import { useApp } from '../store/useApp.js'
import { can } from '../lib/roles.js'
import { TOURS } from '../lib/tours.js'
import { useTour } from '../components/tour/TourProvider.jsx'
import { Button, Card, CardTitle, PageHeader } from '../components/ui.jsx'
import { IconCheck, IconChevronLeft } from '../components/icons.jsx'

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

function TourCard({ tour, done, onStart }) {
  const steps = tour.steps.length
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <CardTitle as="h3">{tour.title}</CardTitle>
        {done ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <IconCheck className="size-3.5" />
            Completada
          </span>
        ) : null}
      </div>
      <p className="flex-1 text-sm text-brand-ink/75">{tour.description}</p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-brand-ink/75">
          {steps} {steps === 1 ? 'paso' : 'pasos'}
        </p>
        <Button
          size="compact"
          variant={done ? 'secondary' : 'primary'}
          onClick={() => onStart(tour.id)}
        >
          {done ? 'Repetir guía' : 'Iniciar guía'}
        </Button>
      </div>
    </Card>
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ayuda"
        meta="Guías paso a paso que te señalan cada parte del panel."
      />

      {categories.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-brand-ink/75 uppercase">
            {category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tours
              .filter((tour) => tour.category === category)
              .map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  done={isDone?.(tour.id)}
                  onStart={start}
                />
              ))}
          </div>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-brand-ink/75 uppercase">
          Preguntas rápidas
        </h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="glass group rounded-[1.75rem] px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl font-semibold max-lg:min-h-11 [&::-webkit-details-marker]:hidden">
                {item.q}
                <IconChevronLeft className="size-5 shrink-0 -rotate-90 text-brand-ink/75 transition-transform duration-200 ease-ios group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-brand-ink/75">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
