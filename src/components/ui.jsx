const VARIANTS = {
  primary:
    'bg-brand-primary text-white shadow-soft-sm hover:bg-brand-primary-deep disabled:bg-brand-soft disabled:text-brand-ink/50 disabled:shadow-none',
  secondary:
    'border border-brand-soft bg-white text-brand-primary-deep hover:border-brand-primary hover:bg-brand-page disabled:text-brand-ink/45',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-soft ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-brand-ink">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-brand-ink/65">{hint}</span>
      ) : null}
    </label>
  )
}

const CONTROL =
  'w-full rounded-xl border border-brand-soft bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25 disabled:bg-brand-page disabled:text-brand-ink/65'

export function Input({ className = '', ...props }) {
  return <input className={`${CONTROL} ${className}`} {...props} />
}

export function Select({ className = '', ...props }) {
  return <select className={`${CONTROL} ${className}`} {...props} />
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-accent/60 bg-brand-soft/40 p-10 text-center">
      <p className="text-sm font-bold text-brand-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-brand-ink/65">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'bg-brand-soft text-brand-ink',
    warning: 'bg-brand-hero text-white',
  }
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
