import { useState } from 'react'
import { exportQr, mmToPx } from '../lib/qr.js'
import { Button, Field, Input, Select } from './ui.jsx'

/**
 * Exportación editorial del Módulo 2.
 *
 * SVG cubre el flujo de imprenta (InDesign e Illustrator lo abren sin
 * pérdida). EPS no se genera en el navegador: ver nota en la interfaz.
 */
export function ExportPanel({ data, style, title, disabled = false }) {
  const [sizeMm, setSizeMm] = useState(30)
  const [dpi, setDpi] = useState(300)
  const [busy, setBusy] = useState(false)

  async function handleExport(format) {
    setBusy(true)
    try {
      await exportQr({ data, style, title, format, sizeMm, dpi })
    } catch (error) {
      console.error('[qrsuite] fallo al exportar', error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tamaño impreso (mm)">
          <Input
            type="number"
            min="10"
            max="200"
            value={sizeMm}
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

      <p className="text-xs text-slate-500">
        Rasterizado a {mmToPx(sizeMm, dpi)} × {mmToPx(sizeMm, dpi)} px.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button disabled={disabled || busy} onClick={() => handleExport('svg')}>
          Descargar SVG
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || busy}
          onClick={() => handleExport('png')}
        >
          Descargar PNG
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || busy}
          onClick={() => handleExport('webp')}
        >
          Descargar WebP
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        EPS no se genera desde el navegador. El SVG se abre en Illustrator y se
        guarda como EPS en un paso, o se automatiza en servidor con Inkscape.
      </p>
    </div>
  )
}
