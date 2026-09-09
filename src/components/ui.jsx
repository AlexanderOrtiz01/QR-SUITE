const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-300',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
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
      <span className="mb-1 block text-sm font-medium text-slate-700">
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
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-500'

export function Input({ className = '', ...props }) {
  return <input className={`${CONTROL} ${className}`} {...props} />
}

export function Select({ className = '', ...props }) {
  return <select className={`${CONTROL} ${className}`} {...props} />
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Banner({ tone = 'info', children }) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
