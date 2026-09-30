import { IconChevronLeft } from './icons.jsx'

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
      <ol className="flex flex-wrap gap-x-6 gap-y-1">
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
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Paso anterior"
            className="mt-0.5 rounded-full p-1 text-brand-ink/65 transition-colors hover:bg-white/70 hover:text-brand-primary-deep"
          >
            <IconChevronLeft className="size-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-brand-ink">
            {title}
          </h2>
          {hint ? <p className="text-sm text-brand-ink/65">{hint}</p> : null}
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

  return (
    <div className="overflow-x-auto">
      <div
        className="relative grid min-w-[26rem] rounded-full bg-brand-ink/8 p-1 shadow-[inset_0_1px_2px_rgb(15_31_99/0.08)]"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-full bg-white shadow-[0_3px_8px_-2px_rgb(15_31_99/0.2),0_0_0_0.5px_rgb(15_31_99/0.06)] transition-transform duration-300 ease-ios"
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
            className={`relative rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              value === tab.id
                ? 'text-brand-ink'
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
