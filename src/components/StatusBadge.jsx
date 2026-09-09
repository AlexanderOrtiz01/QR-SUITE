import { QR_STATUS } from '../lib/schema.js'

const TONES = {
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  deprecated: 'bg-slate-200 text-slate-600',
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONES[status] || TONES.draft}`}
    >
      {QR_STATUS[status]?.label || status}
    </span>
  )
}
