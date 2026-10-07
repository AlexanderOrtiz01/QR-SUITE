import { IconChevronLeft } from './icons.jsx'
import { InfoTip } from './Tooltip.jsx'

/**
 * Piezas del asistente por pasos, siguiendo el patrón de QRStuff: barra de
 * progreso, rótulos numerados, cabecera con retroceso y acción de avance, y
 * pestañas dentro de un mismo paso.
 */
export function StepProgress({ steps, current, onSelect }) {
  const percent = ((current + 1) / steps.length) * 100

  return (
    <div className="space-y-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-ink/10">
        <div
          className="h-full rounded-full bg-brand-primary shadow-[0_0_0_1px_rgb(255_255_255/0.4)_inset] transition-[width] duration-500 ease-ios"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={current + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Paso ${current + 1} de ${steps.length}`}
        />
      </div>
      <ol className="flex flex-wrap justify-between gap-x-3 gap-y-1 sm:justify-start sm:gap-x-6">
        {steps.map((step, index) => {
          const done = index < current
          return (
            <li key={step.id}>
              <button
                type="button"
                // Solo se puede retroceder: avanzar exige validar el paso.
                disabled={index > current}
                onClick={() => onSelect(index)}
                className={`text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                  index === current
                    ? 'text-brand-primary-deep'
                    : done
                      ? 'text-brand-ink/65 hover:text-brand-primary-deep'
                      : 'text-brand-ink/45'
                }`}
              >
                {index + 1}. {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function StepHeader({ title, hint, onBack, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Paso anterior"
            className="rounded-full p-1 text-brand-ink/65 transition-colors hover:bg-white/70 hover:text-brand-primary-deep"
          >
            <IconChevronLeft className="size-5" />
          </button>
        ) : null}
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="text-xl font-bold tracking-tight text-brand-ink">
            {title}
          </h2>
          {hint ? <InfoTip>{hint}</InfoTip> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

/**
 * Control segmentado de iOS: un carril hundido y una píldora de vidrio que se
 * desliza hasta la opción elegida. Las opciones tienen el mismo ancho, así que
 * la posición de la píldora sale del índice sin medir nada.
 */
export function TabBar({ tabs, value, onChange }) {
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  )

  // En un contenedor estrecho las opciones no caben en una fila: pasan a una
  // rejilla de dos o tres columnas y cada una marca su propia selección,
  // porque la píldora deslizante solo sabe moverse en horizontal.
  return (
    <div className="@container">
      <div
        className="relative grid grid-cols-2 gap-1 @2xs:grid-cols-3 rounded-3xl bg-brand-ink/8 p-1 shadow-[inset_0_1px_2px_rgb(15_31_99/0.08)] @lg:grid-cols-(--tabs) @lg:gap-0 @lg:rounded-full"
        style={{ '--tabs': `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 hidden rounded-full bg-white shadow-[0_3px_8px_-2px_rgb(15_31_99/0.2),0_0_0_0.5px_rgb(15_31_99/0.06)] transition-transform duration-300 ease-ios @lg:block"
          style={{
            width: `calc((100% - 0.5rem) / ${tabs.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={value === tab.id}
            className={`relative truncate rounded-full px-2 py-1.5 @lg:px-3 text-sm font-semibold transition-colors ${
              value === tab.id
                ? 'bg-white text-brand-ink shadow-[0_3px_8px_-2px_rgb(15_31_99/0.2)] @lg:bg-transparent @lg:shadow-none'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
