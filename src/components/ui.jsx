const VARIANTS = {
  primary:
    'bg-ssf-navy text-white hover:bg-ssf-blue disabled:bg-slate-300 disabled:text-slate-500',
  secondary:
    'border border-ssf-line bg-white text-ssf-charcoal hover:border-ssf-blue hover:text-ssf-navy disabled:text-slate-400',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ssf-blue focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ssf-charcoal">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}

const CONTROL =
  'w-full rounded-lg border border-ssf-line bg-white px-3 py-2 text-sm text-ssf-charcoal outline-none focus:border-ssf-blue focus:ring-2 focus:ring-ssf-blue/25 disabled:bg-slate-50 disabled:text-slate-500'

export function Input({ className = '', ...props }) {
  return <input className={`${CONTROL} ${className}`} {...props} />
}

export function Select({ className = '', ...props }) {
  return <select className={`${CONTROL} ${className}`} {...props} />
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-ssf-line bg-ssf-mist p-10 text-center">
      <p className="text-sm font-semibold text-ssf-charcoal">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'border-ssf-blue/30 bg-ssf-mist text-ssf-charcoal',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
