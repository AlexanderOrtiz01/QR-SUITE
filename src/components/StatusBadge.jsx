import { QR_STATUS } from '../lib/schema.js'

/**
 * Los tres estados se distinguen por intensidad del mismo azul: publicado es
 * el más sólido, borrador un tinte claro y obsoleto se apaga en gris.
 */
const TONES = {
  draft: 'bg-brand-soft text-brand-primary-deep',
  published: 'bg-brand-primary text-white',
  deprecated: 'bg-brand-page text-brand-ink/65',
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
