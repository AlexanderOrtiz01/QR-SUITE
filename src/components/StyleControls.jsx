import {
  BRAND_PRESETS,
  CORNER_STYLES,
  DOT_STYLES,
  ECC_LEVEL,
} from '../lib/brand.js'
import { Field, Select } from './ui.jsx'

/**
 * Controles del Módulo 2. La paleta se limita a los presets institucionales:
 * el color libre no se ofrece a propósito, para que ningún QR impreso salga
 * fuera del manual de marca.
 */
export function StyleControls({ style, onChange, disabled = false }) {
  function patch(next) {
    onChange({ ...style, ...next })
  }

  async function handleLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => patch({ logo: reader.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <Field label="Paleta institucional">
        <div className="grid grid-cols-2 gap-2">
          {BRAND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                patch({
                  preset: preset.id,
                  dark: preset.dark,
                  light: preset.light,
                })
              }
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                style.preset === preset.id
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className="size-5 shrink-0 rounded border border-slate-300"
                style={{ background: preset.dark }}
              />
              <span className="truncate">{preset.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estilo de módulos">
          <Select
            value={style.dotStyle}
            disabled={disabled}
            onChange={(event) => patch({ dotStyle: event.target.value })}
          >
            {DOT_STYLES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Esquinas">
          <Select
            value={style.cornerSquareStyle}
            disabled={disabled}
            onChange={(event) =>
              patch({ cornerSquareStyle: event.target.value })
            }
          >
            {CORNER_STYLES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Logotipo central"
        hint={`Corrección de errores fijada en nivel ${ECC_LEVEL} (30%) para admitirlo sin perder lectura.`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          disabled={disabled}
          onChange={handleLogo}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </Field>

      {style.logo ? (
        <Field label={`Tamaño del logo (${Math.round(style.logoSize * 100)}%)`}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.12"
              max="0.3"
              step="0.01"
              value={style.logoSize}
              disabled={disabled}
              onChange={(event) =>
                patch({ logoSize: Number(event.target.value) })
              }
              className="w-full"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => patch({ logo: null })}
              className="shrink-0 text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        </Field>
      ) : null}
    </div>
  )
}
