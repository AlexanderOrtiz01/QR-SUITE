import { useState } from 'react'
import { exportQr, mmToPx } from '../lib/qr.js'
import { printMetrics } from '../lib/legibility.js'
import { Button, Field, Input } from './ui.jsx'
import { IconAlert, IconDownload } from './icons.jsx'
import { InfoTip } from './Tooltip.jsx'

const RESOLUTIONS = [
  { value: 300, label: '300 DPI (imprenta)' },
  { value: 150, label: '150 DPI' },
  { value: 72, label: '72 DPI (pantalla)' },
]

const FORMATS = [
  { id: 'svg', label: 'SVG' },
  { id: 'png', label: 'PNG' },
  { id: 'webp', label: 'WebP' },
]

/**
 * Exportación editorial del Módulo 2.
 *
 * SVG cubre el flujo de imprenta (InDesign e Illustrator lo abren sin
 * pérdida). EPS no se genera en el navegador: ver nota en la interfaz.
 */
export function ExportPanel({
  data,
  style,
  title,
  disabled = false,
  blockedReason = '',
}) {
  const [sizeMm, setSizeMm] = useState(30)
  const [dpi, setDpi] = useState(300)
  // El formato en curso, para que solo su botón muestre la actividad.
  const [busy, setBusy] = useState('')
  const [failed, setFailed] = useState(false)
  const print = printMetrics(data, style, sizeMm)
  const tooSmall = sizeMm < print.minSizeMm

  async function handleExport(format) {
    setBusy(format)
    setFailed(false)
    try {
      await exportQr({ data, style, title, format, sizeMm, dpi })
    } catch (error) {
      console.error('[qrsuite] fallo al exportar', error)
      setFailed(true)
    } finally {
      setBusy('')
    }
  }

  // A la vista, lo que se decide casi siempre: el tamaño y el formato. La
  // resolución (casi siempre la de imprenta) va como un selector discreto en
  // la línea de la medida resultante.
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Field
          label="Tamaño impreso (mm)"
          hint={`Mínimo para papel: ${print.minSizeMm} mm.`}
        >
          <Input
            type="number"
            min="10"
            max="200"
            value={sizeMm}
            aria-invalid={tooSmall || undefined}
            className={tooSmall ? 'ring-2 ring-red-300' : ''}
            onChange={(event) => setSizeMm(Number(event.target.value) || 10)}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-brand-ink/75">
          <span className="tabular-nums">
            {mmToPx(sizeMm, dpi)} × {mmToPx(sizeMm, dpi)} px a
          </span>
          <select
            aria-label="Resolución"
            value={dpi}
            onChange={(event) => setDpi(Number(event.target.value))}
            className="rounded-lg bg-transparent py-1 font-semibold text-brand-ink/80 outline-none hover:bg-brand-ink/5 focus-visible:ring-2 focus-visible:ring-brand-primary/30 max-lg:min-h-11"
          >
            {RESOLUTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <InfoTip label="Sobre la medida y los formatos">
            La medida es la del código en sí; con marco, el archivo es mayor.
            {style.frame === 'none' && print.quietZoneMm > 0
              ? ` Al maquetar, deja ${print.quietZoneMm.toFixed(1)} mm libres alrededor.`
              : ''}{' '}
            ¿EPS? Abre el SVG en Illustrator y guárdalo como EPS.
          </InfoTip>
        </div>
      </div>

      {tooSmall ? (
        <p
          role="alert"
          className="flex gap-2 rounded-2xl bg-red-50/85 p-3 text-xs text-red-800 ring-1 ring-red-200"
        >
          <IconAlert className="mt-px size-4 shrink-0 text-red-600" />
          <span>
            Demasiado pequeño para papel: usa {print.minSizeMm} mm o más.
          </span>
        </p>
      ) : null}

      {/* Tres formatos con el mismo peso salvo el SVG, el de imprenta. Caben
          en una fila incluso en la columna lateral. */}
      <div className="grid grid-cols-3 gap-2">
        {FORMATS.map((format, index) => (
          <Button
            key={format.id}
            variant={index === 0 ? 'primary' : 'secondary'}
            size="compact"
            aria-label={`Descargar ${format.label}`}
            disabled={
              disabled || Boolean(blockedReason) || (busy && busy !== format.id)
            }
            loading={busy === format.id}
            onClick={() => handleExport(format.id)}
          >
            {busy === format.id ? null : (
              <IconDownload className="size-4 shrink-0" />
            )}
            {format.label}
          </Button>
        ))}
      </div>

      {blockedReason ? (
        <p className="text-xs font-semibold text-brand-ink/80">
          {blockedReason}
        </p>
      ) : null}

      {failed ? (
        <p role="alert" className="text-xs font-semibold text-red-700">
          No se pudo generar el archivo. Inténtalo de nuevo o con otro formato.
        </p>
      ) : null}
    </div>
  )
}
