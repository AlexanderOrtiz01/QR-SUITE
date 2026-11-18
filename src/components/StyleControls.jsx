import { useState } from 'react'
import {
  BRAND_PRESETS,
  CORNER_STYLES,
  DEFAULT_STYLE,
  DOT_STYLES,
  ECC_LEVEL,
  GRADIENT_PRESETS,
  GRADIENT_TYPES,
} from '../lib/brand.js'
import { FRAMES, frameThumbnail } from '../lib/frames.js'
import { Field, Input, Select } from './ui.jsx'
import { IconChevronLeft } from './icons.jsx'

const TILE =
  'rounded-xl border p-2 text-left text-xs transition-colors disabled:opacity-50'

function tileClass(active) {
  return `${TILE} ${active ? 'border-brand-primary/70 bg-white/90 ring-2 ring-brand-primary/20' : 'border-white/80 bg-white/45 hover:bg-white/75'}`
}

/**
 * Bloque plegable para las opciones de uso infrecuente. Arranca abierto si ya
 * tienen un valor propio, para que no quede oculto lo que se ha cambiado; el
 * estado inicial no se recalcula, así que no se cierra solo al deshacerlo.
 */
export function StyleDisclosure({ summary, defaultOpen = false, children }) {
  const [initialOpen] = useState(defaultOpen)

  return (
    <details open={initialOpen} className="group/opciones">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-primary-deep max-lg:min-h-11 [&::-webkit-details-marker]:hidden">
        <IconChevronLeft className="size-4 shrink-0 rotate-180 transition-transform duration-200 ease-ios group-open/opciones:rotate-270" />
        {summary}
      </summary>
      <div className="mt-4 space-y-6">{children}</div>
    </details>
  )
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
      <div className="@container">
        <div className="grid gap-2 @sm:grid-cols-2">
          {BRAND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              aria-pressed={style.preset === preset.id}
              title={`${preset.dark} sobre ${preset.light}`}
              onClick={() =>
                onChange({
                  ...style,
                  preset: preset.id,
                  dark: preset.dark,
                  light: preset.light,
                })
              }
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                style.preset === preset.id
                  ? 'border-brand-primary/70 bg-white/90 ring-2 ring-brand-primary/20'
                  : 'border-white/80 bg-white/45 hover:bg-white/75'
              }`}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-brand-ink/10 bg-white"
                style={{ background: preset.light }}
              >
                <span
                  className="size-4 rounded-xs"
                  style={{ background: preset.dark }}
                />
              </span>
              <span className="min-w-0 truncate font-semibold text-brand-ink">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Field>
  )
}

export function ShapeControls({ style, onChange, disabled = false }) {
  return (
    <div className="@container">
      <div className="grid gap-4 @sm:grid-cols-2">
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
        hint={`Corrección de errores ${ECC_LEVEL} (30 %): el logo no impide la lectura.`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          disabled={disabled}
          onChange={handleLogo}
          className="w-full text-sm text-brand-ink/80 file:mr-3 file:rounded-full file:border-0 file:bg-brand-primary file:shadow-soft-sm file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
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
              className="w-full accent-brand-primary"
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
      ) : null}
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
    <div className="@container space-y-4">
      <Field
        label="Degradado"
        hint="Solo tonos oscuros: aclarar los módulos resta contraste en papel."
      >
        <div className="grid grid-cols-2 gap-2 @md:grid-cols-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPreset(null)}
            className={tileClass(!gradient)}
          >
            <span className="block h-9 w-full rounded-md border border-brand-ink/10 bg-white" />
            <span className="mt-1.5 block truncate text-brand-ink">
              Sin degradado
            </span>
          </button>
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => setPreset(preset)}
              className={tileClass(gradient?.preset === preset.id)}
              title={`${preset.from} → ${preset.to}`}
            >
              {/* La muestra refleja el tipo elegido, para que no prometa un
                  degradado lineal cuando el código va a salir radial. */}
              <span
                className="block h-9 w-full rounded-md border border-brand-ink/10 bg-white"
                style={{
                  background:
                    gradient?.type === 'radial'
                      ? `radial-gradient(circle, ${preset.from}, ${preset.to})`
                      : `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                }}
              />
              <span className="mt-1.5 block truncate text-brand-ink">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      {gradient ? (
        <div className="grid gap-4 @sm:grid-cols-2">
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
                className="w-full accent-brand-primary"
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
    <div className="@container space-y-4">
      <Field label="Estilo de marco">
        <div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @2xl:grid-cols-4">
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
              <span className="mt-1.5 block text-center text-balance text-brand-ink">
                {frame.label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      {withLabel ? (
        <Field label="Texto del marco" hint="Se imprime junto al código.">
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

/** Si el estilo se aparta del de marca en algo de uso infrecuente. */
function hasAdvancedStyle(style) {
  return Boolean(
    style.gradient ||
    style.logo ||
    style.dotStyle !== DEFAULT_STYLE.dotStyle ||
    style.cornerSquareStyle !== DEFAULT_STYLE.cornerSquareStyle ||
    style.cornerDotStyle !== DEFAULT_STYLE.cornerDotStyle,
  )
}

/**
 * Composición de los bloques, para pantallas sin pestañas: a la vista lo
 * habitual (paleta y marco); degradado, forma y logotipo, plegados.
 */
export function StyleControls({ style, onChange, disabled = false }) {
  return (
    <div className="space-y-6">
      <ColorControls style={style} onChange={onChange} disabled={disabled} />
      <FrameControls style={style} onChange={onChange} disabled={disabled} />
      <StyleDisclosure
        summary="Degradado, forma y logotipo"
        defaultOpen={hasAdvancedStyle(style)}
      >
        <GradientControls
          style={style}
          onChange={onChange}
          disabled={disabled}
        />
        <ShapeControls style={style} onChange={onChange} disabled={disabled} />
        <LogoControls style={style} onChange={onChange} disabled={disabled} />
      </StyleDisclosure>
    </div>
  )
}
