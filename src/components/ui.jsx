import { cloneElement, isValidElement, useId, useState } from 'react'
import { InfoTip, Tooltip } from './Tooltip.jsx'

const VARIANTS = {
  primary:
    'glass-tint text-white hover:brightness-110 disabled:border-white/60 disabled:bg-white/45 disabled:text-brand-ink/45 disabled:shadow-none disabled:hover:brightness-100',
  secondary:
    'glass text-brand-primary-deep hover:bg-white/80 disabled:text-brand-ink/45',
  danger: 'glass text-red-600 hover:bg-red-50/80',
}

/**
 * Con `loading` el botón conserva su aspecto (no se apaga como uno
 * deshabilitado) y muestra el indicador de actividad: la acción está en marcha,
 * no bloqueada. Mientras tanto ignora los clics, también los de envío.
 */
// El relleno va por tamaño y no se sobrescribe desde fuera: dos utilidades
// de relleno en la misma clase compiten por orden de hoja, no de escritura.
const SIZES = {
  md: 'px-5 py-2.5',
  lg: 'px-5 py-3',
  compact: 'px-3 py-2.5',
  icon: 'size-10 shrink-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  onClick,
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full ${SIZES[size]} text-sm font-semibold transition-[background-color,filter,transform] duration-200 ease-ios focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${
        loading ? 'cursor-progress active:scale-100' : ''
      } ${VARIANTS[variant]} ${className}`}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    >
      {loading ? <Spinner className="size-4 shrink-0" /> : null}
      {children}
    </button>
  )
}

/**
 * Indicador circular: un aro tenue y un arco que gira sobre él. Hereda el
 * color del texto, así sirve igual dentro de un botón azul que sobre vidrio.
 */
export function Spinner({ className = 'size-5', label }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`activity ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2.5"
      />
      {/* Un cuarto de la circunferencia (2π · 9,5 ≈ 60). */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="15 45"
      />
    </svg>
  )
}

/** Hueco con reflejo mientras llega el contenido; su forma la da `className`. */
export function Skeleton({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block rounded-xl ${className}`}
    />
  )
}

/**
 * Imagen que se revela al terminar de cargar: hasta entonces ocupa su sitio un
 * esqueleto, así no salta el diseño ni aparece a medio pintar. Si falla, se
 * retira el esqueleto y queda el texto alternativo.
 */
export function Picture({
  className = '',
  frameClassName = 'rounded-xl',
  ...props
}) {
  const [state, setState] = useState('loading')

  return (
    <span className={`relative inline-block align-middle ${frameClassName}`}>
      {state === 'loading' ? (
        <Skeleton className={`absolute inset-0 ${frameClassName}`} />
      ) : null}
      <img
        {...props}
        onLoad={() => setState('loaded')}
        onError={() => setState('failed')}
        className={`transition-opacity duration-300 ease-out ${
          state === 'loading' ? 'opacity-0' : 'opacity-100'
        } ${className}`}
      />
    </span>
  )
}

/**
 * Cargador de pantalla completa: el arranque, mientras se restaura la sesión y
 * llegan los datos. El logotipo va dentro de una lámina para que la pantalla ya
 * sea la aplicación y no un blanco con un aro.
 */
export function PageLoader({ label = 'Cargando QR Suite' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-dvh place-items-center px-6 [animation:velo-entra_.4s_ease-out_both]"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="glass-thick grid size-24 place-items-center rounded-[1.75rem]">
          <img
            src="/logo-azul-192.webp"
            alt=""
            width="192"
            height="192"
            className="size-14"
          />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-medium text-brand-ink/70">
          <Spinner className="size-5 text-brand-ink/70" />
          {label}…
        </div>
      </div>
    </div>
  )
}

/** Silueta de una pantalla del panel mientras llega su código. */
export function PageSkeleton({ label = 'Cargando' }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">{label}…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="glass space-y-3 rounded-[1.75rem] p-5">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="glass space-y-4 rounded-[1.75rem] p-5">
        <Skeleton className="h-5 w-56 rounded-md" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  )
}

/**
 * Botón de solo icono. El nombre de la acción va en el globo y en
 * `aria-label`: ocupa lo que el icono, sin perder qué hace.
 */
export function IconButton({
  label,
  icon: Icon,
  variant = 'secondary',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <Tooltip content={label}>
      <Button
        variant={variant}
        loading={loading}
        size="icon"
        aria-label={label}
        className={className}
        {...props}
      >
        {loading ? null : <Icon className="size-[1.125rem] shrink-0" />}
      </Button>
    </Tooltip>
  )
}

/**
 * Cabecera de página: título, su explicación en un globo (en lugar de un
 * párrafo debajo) y las acciones a la derecha.
 */
export function PageHeader({ title, info, meta, children }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {title}
          </h1>
          {info ? <InfoTip>{info}</InfoTip> : null}
        </div>
        {meta ? <p className="text-sm text-brand-ink/65">{meta}</p> : null}
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </header>
  )
}

/** Título de tarjeta con su aclaración opcional en un globo. */
export function CardTitle({ children, info, as: Tag = 'h2', className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Tag className="font-semibold">{children}</Tag>
      {info ? <InfoTip>{info}</InfoTip> : null}
    </div>
  )
}

export function Card({ className = '', ...props }) {
  return (
    <div className={`glass rounded-[1.75rem] p-5 ${className}`} {...props} />
  )
}

/**
 * Campo con su rótulo. La ayuda no ocupa una línea bajo el control: va en el
 * globo de un icono junto al rótulo, y el control la recibe como descripción
 * para que el lector de pantalla la siga anunciando.
 *
 * El icono es un botón, así que el rótulo ya no puede envolver al control (lo
 * tomaría por el elemento etiquetado): se enlaza con `htmlFor` cuando el hijo
 * es un control, y queda como texto cuando es un grupo de opciones.
 */
export function Field({ label, hint, children }) {
  const id = useId()
  const hintId = `${id}-ayuda`
  const isControl =
    isValidElement(children) &&
    [Input, Select, 'input', 'select', 'textarea'].includes(children.type)
  const control = isControl
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-describedby': hint ? hintId : undefined,
      })
    : children
  const Label = isControl ? 'label' : 'span'

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Label
          htmlFor={isControl ? children.props.id || id : undefined}
          className="text-sm font-semibold text-brand-ink"
        >
          {label}
        </Label>
        {hint ? <InfoTip>{hint}</InfoTip> : null}
      </div>
      {control}
      {hint ? (
        <span id={hintId} hidden>
          {hint}
        </span>
      ) : null}
    </div>
  )
}

const CONTROL =
  'glass-well w-full rounded-xl px-3.5 py-2.5 text-sm text-brand-ink outline-none transition-[background-color,box-shadow] duration-200 focus:bg-white/90 focus:ring-4 focus:ring-brand-primary/20 disabled:bg-white/35 disabled:text-brand-ink/65'

export function Input({ className = '', ...props }) {
  return <input className={`${CONTROL} ${className}`} {...props} />
}

export function Select({ className = '', ...props }) {
  return <select className={`${CONTROL} ${className}`} {...props} />
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="glass-well rounded-[1.75rem] p-10 text-center">
      <p className="text-sm font-semibold text-brand-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-brand-ink/65">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'glass text-brand-ink',
    warning: 'glass-tint text-white',
  }
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
