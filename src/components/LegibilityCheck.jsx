import { useMemo } from 'react'
import { checkLegibility } from '../lib/legibility.js'
import { IconAlert, IconCheck } from './icons.jsx'
import { InfoTip } from './Tooltip.jsx'

/**
 * Semáforo de legibilidad junto a la vista previa: confirma en una línea que
 * el código se leerá, o nombra qué lo impide; cómo arreglarlo va en un globo.
 */
export function LegibilityCheck({ data, style, sizeMm = null }) {
  const issues = useMemo(
    () => checkLegibility({ data, style, sizeMm }),
    [data, style, sizeMm],
  )

  if (issues.length === 0) {
    return (
      <p className="flex items-center gap-2 text-xs font-semibold text-brand-primary-deep">
        <span className="glass-tint grid size-5 shrink-0 place-items-center rounded-full text-white">
          <IconCheck className="size-3" strokeWidth="2.6" />
        </span>
        Lectura óptima para impresión
      </p>
    )
  }

  return (
    <ul className="space-y-2" aria-label="Avisos de legibilidad">
      {issues.map((issue) => (
        <li
          key={issue.id}
          className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
            issue.level === 'error'
              ? 'bg-red-50/85 text-red-800 ring-1 ring-red-200'
              : 'glass-well text-brand-ink/80'
          }`}
        >
          <IconAlert
            className={`size-4 shrink-0 ${
              issue.level === 'error' ? 'text-red-600' : 'text-brand-primary'
            }`}
          />
          <span className="min-w-0 flex-1">{issue.title}</span>
          <InfoTip label="Cómo corregirlo">{issue.detail}</InfoTip>
        </li>
      ))}
    </ul>
  )
}
