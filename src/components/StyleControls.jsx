import {
  BRAND_PRESETS,
  CORNER_STYLES,
  DOT_STYLES,
  ECC_LEVEL,
} from '../lib/brand.js'
import { Field, Select } from './ui.jsx'

/**
 * Controles del Módulo 2, separados por pestaña.
 *
 * La paleta se limita a los presets institucionales: no se ofrece color libre
 * a propósito, para que ningún QR impreso salga fuera del manual de marca.
 */
export function ColorControls({ style, onChange, disabled = false }) {
  return (
    <Field label="Paleta institucional">
      <div className="grid gap-2 sm:grid-cols-2">
        {BRAND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...style,
                preset: preset.id,
                dark: preset.dark,
                light: preset.light,
              })
            }
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
              style.preset === preset.id
                ? 'border-ssf-navy bg-ssf-mist'
                : 'border-slate-200 hover:bg-ssf-mist'
            }`}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded border border-slate-300"
              style={{ background: preset.light }}
            >
              <span
                className="size-4 rounded-xs"
                style={{ background: preset.dark }}
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-ssf-charcoal">
                {preset.label}
              </span>
              <span className="block font-mono text-xs text-slate-500">
                {preset.dark}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Field>
  )
}

export function ShapeControls({ style, onChange, disabled = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Estilo de módulos">
        <Select
          value={style.dotStyle}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...style, dotStyle: event.target.value })
          }
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
            onChange({ ...style, cornerSquareStyle: event.target.value })
          }
        >
          {CORNER_STYLES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Centro de las esquinas">
        <Select
          value={style.cornerDotStyle}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...style, cornerDotStyle: event.target.value })
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
  )
}

export function LogoControls({ style, onChange, disabled = false }) {
  function handleLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange({ ...style, logo: reader.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <Field
        label="Logotipo central"
        hint={`Corrección de errores fijada en nivel ${ECC_LEVEL} (30%) para admitirlo sin perder lectura.`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          disabled={disabled}
          onChange={handleLogo}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ssf-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
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
                onChange({ ...style, logoSize: Number(event.target.value) })
              }
              className="w-full accent-ssf-navy"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...style, logo: null })}
              className="shrink-0 text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        </Field>
      ) : (
        <p className="text-sm text-slate-500">
          Sin logotipo. El código se genera igualmente con corrección de errores
          alta.
        </p>
      )}
    </div>
  )
}

/** Composición de los tres bloques, para pantallas sin pestañas. */
export function StyleControls({ style, onChange, disabled = false }) {
  return (
    <div className="space-y-5">
      <ColorControls style={style} onChange={onChange} disabled={disabled} />
      <ShapeControls style={style} onChange={onChange} disabled={disabled} />
      <LogoControls style={style} onChange={onChange} disabled={disabled} />
    </div>
  )
}
