import { QR_STATUS } from '../lib/schema.js'

/**
 * Los tres estados se distinguen por intensidad del mismo azul: publicado es
 * el más sólido, borrador un tinte claro y obsoleto se apaga en gris.
 */
const TONES = {
  draft: 'bg-brand-soft/80 text-brand-primary-deep ring-1 ring-white/80',
  published: 'bg-brand-primary text-white',
  deprecated: 'bg-brand-ink/8 text-brand-ink/65',
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[status] || TONES.draft}`}
    >
      {QR_STATUS[status]?.label || status}
    </span>
  )
}
