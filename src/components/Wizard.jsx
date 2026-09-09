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
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-ssf-navy transition-[width] duration-300"
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
                className={`text-xs font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed ${
                  index === current
                    ? 'text-ssf-navy'
                    : done
                      ? 'text-slate-500 hover:text-ssf-navy'
                      : 'text-slate-400'
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
            className="mt-0.5 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ssf-navy"
          >
            <IconChevronLeft className="size-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-ssf-charcoal">
            {title}
          </h2>
          {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

export function TabBar({ tabs, value, onChange }) {
  return (
    <div className="flex gap-6 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-current={value === tab.id}
          className={`shrink-0 border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors ${
            value === tab.id
              ? 'border-ssf-navy text-ssf-navy'
              : 'border-transparent text-slate-500 hover:text-ssf-charcoal'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
