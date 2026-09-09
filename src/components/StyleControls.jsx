import {
  BRAND_PRESETS,
  CORNER_STYLES,
  DOT_STYLES,
  ECC_LEVEL,
  GRADIENT_PRESETS,
  GRADIENT_TYPES,
} from '../lib/brand.js'
import { FRAMES, frameThumbnail } from '../lib/frames.js'
import { Field, Input, Select } from './ui.jsx'

const TILE =
  'rounded-lg border p-2 text-left text-xs transition-colors disabled:opacity-50'

function tileClass(active) {
  return `${TILE} ${active ? 'border-ssf-navy bg-ssf-mist' : 'border-slate-200 hover:bg-ssf-mist'}`
}

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

export function GradientControls({ style, onChange, disabled = false }) {
  const gradient = style.gradient

  function setPreset(preset) {
    if (!preset) {
      onChange({ ...style, gradient: null })
      return
    }
    onChange({
      ...style,
      gradient: {
        preset: preset.id,
        from: preset.from,
        to: preset.to,
        type: gradient?.type || 'linear',
        rotation: gradient?.rotation ?? 0,
      },
    })
  }

  return (
    <div className="space-y-4">
      <Field
        label="Degradado"
        hint="Solo combinaciones de la paleta institucional, y siempre entre tonos oscuros: aclarar los módulos reduce el contraste y el código deja de leerse sobre papel."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPreset(null)}
            className={tileClass(!gradient)}
          >
            <span className="flex items-center gap-2">
              <span className="size-8 shrink-0 rounded border border-slate-300 bg-white" />
              <span className="font-medium text-ssf-charcoal">
                Sin degradado
              </span>
            </span>
          </button>
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => setPreset(preset)}
              className={tileClass(gradient?.preset === preset.id)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-8 shrink-0 rounded border border-slate-300"
                  style={{
                    background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                  }}
                />
                <span className="min-w-0 font-medium text-ssf-charcoal">
                  {preset.label}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Field>

      {gradient ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo">
            <Select
              value={gradient.type}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...style,
                  gradient: { ...gradient, type: event.target.value },
                })
              }
            >
              {GRADIENT_TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          {gradient.type === 'linear' ? (
            <Field
              label={`Ángulo (${Math.round(((gradient.rotation ?? 0) * 180) / Math.PI)}°)`}
            >
              <input
                type="range"
                min="0"
                max="6.28"
                step="0.05"
                value={gradient.rotation ?? 0}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...style,
                    gradient: {
                      ...gradient,
                      rotation: Number(event.target.value),
                    },
                  })
                }
                className="w-full accent-ssf-navy"
              />
            </Field>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function FrameControls({ style, onChange, disabled = false }) {
  const withLabel = FRAMES.find((frame) => frame.id === style.frame)?.hasLabel

  return (
    <div className="space-y-4">
      <Field label="Estilo de marco">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FRAMES.map((frame) => (
            <button
              key={frame.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...style, frame: frame.id })}
              className={tileClass(style.frame === frame.id)}
            >
              <span
                className="mx-auto block w-full [&>svg]:h-16 [&>svg]:w-full"
                dangerouslySetInnerHTML={{
                  __html: frameThumbnail(frame.id, {
                    dark: style.dark,
                    light: style.light,
                  }),
                }}
              />
              <span className="mt-1.5 block text-center text-ssf-charcoal">
                {frame.label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      {withLabel ? (
        <Field
          label="Texto del marco"
          hint="Llamada a la acción impresa junto al código."
        >
          <Input
            value={style.frameLabel}
            disabled={disabled}
            maxLength={24}
            onChange={(event) =>
              onChange({ ...style, frameLabel: event.target.value })
            }
          />
        </Field>
      ) : null}
    </div>
  )
}

/** Composición de los bloques, para pantallas sin pestañas. */
export function StyleControls({ style, onChange, disabled = false }) {
  return (
    <div className="space-y-5">
      <ColorControls style={style} onChange={onChange} disabled={disabled} />
      <GradientControls style={style} onChange={onChange} disabled={disabled} />
      <ShapeControls style={style} onChange={onChange} disabled={disabled} />
      <FrameControls style={style} onChange={onChange} disabled={disabled} />
      <LogoControls style={style} onChange={onChange} disabled={disabled} />
    </div>
  )
}
