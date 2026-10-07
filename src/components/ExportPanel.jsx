import { useState } from 'react'
import { exportQr, mmToPx } from '../lib/qr.js'
import { printMetrics } from '../lib/legibility.js'
import { Button, Field, Input, Select } from './ui.jsx'
import { IconAlert, IconDownload } from './icons.jsx'
import { InfoTip } from './Tooltip.jsx'

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
export function ExportPanel({ data, style, title, disabled = false }) {
  const [sizeMm, setSizeMm] = useState(30)
  const [dpi, setDpi] = useState(300)
  // El formato en curso, para que solo su botón muestre la actividad.
  const [busy, setBusy] = useState('')
  const print = printMetrics(data, style, sizeMm)
  const tooSmall = sizeMm < print.minSizeMm

  async function handleExport(format) {
    setBusy(format)
    try {
      await exportQr({ data, style, title, format, sizeMm, dpi })
    } catch (error) {
      console.error('[qrsuite] fallo al exportar', error)
    } finally {
      setBusy('')
    }
  }

  // El panel vive tanto en la columna ancha del estudio como en la lateral de
  // la ficha, así que se adapta al ancho de su contenedor y no al de la
  // pantalla: en la columna lateral los campos y botones van uno bajo otro.
  return (
    <div className="@container space-y-4">
      <div className="grid gap-3 @md:grid-cols-2">
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
        <Field label="Resolución">
          <Select
            value={dpi}
            onChange={(event) => setDpi(Number(event.target.value))}
          >
            <option value={300}>300 DPI (imprenta)</option>
            <option value={150}>150 DPI</option>
            <option value={72}>72 DPI (pantalla)</option>
          </Select>
        </Field>
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

      <div className="flex items-center gap-1.5 text-xs text-brand-ink/65">
        <span className="tabular-nums">
          {mmToPx(sizeMm, dpi)} × {mmToPx(sizeMm, dpi)} px
        </span>
        <InfoTip label="Sobre la medida y los formatos">
          La medida es la del código en sí; con marco, el archivo es mayor.
          {style.frame === 'none' && print.quietZoneMm > 0
            ? ` Al maquetar, deja ${print.quietZoneMm.toFixed(1)} mm libres alrededor.`
            : ''}{' '}
          ¿EPS? Abre el SVG en Illustrator y guárdalo como EPS.
        </InfoTip>
      </div>

      {/* Tres formatos con el mismo peso salvo el SVG, el de imprenta. Caben
          en una fila incluso en la columna lateral. */}
      <div className="grid grid-cols-3 gap-2">
        {FORMATS.map((format, index) => (
          <Button
            key={format.id}
            variant={index === 0 ? 'primary' : 'secondary'}
            size="compact"
            aria-label={`Descargar ${format.label}`}
            disabled={disabled || (busy && busy !== format.id)}
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
    </div>
  )
}
