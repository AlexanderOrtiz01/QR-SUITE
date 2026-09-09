/**
 * Configuración de marca institucional.
 *
 * PENDIENTE: sustituir por los colores oficiales de la organización.
 * Estos valores son marcadores de posición hasta recibir el manual de marca.
 */
export const BRAND_PRESETS = [
  {
    id: 'institucional',
    label: 'Institucional',
    dark: '#1B3A6B',
    light: '#FFFFFF',
  },
  { id: 'acento', label: 'Acento', dark: '#0F766E', light: '#FFFFFF' },
  { id: 'neutro', label: 'Neutro', dark: '#111827', light: '#FFFFFF' },
  { id: 'invertido', label: 'Invertido', dark: '#FFFFFF', light: '#1B3A6B' },
]

export const DOT_STYLES = [
  { id: 'square', label: 'Cuadrado' },
  { id: 'rounded', label: 'Redondeado' },
  { id: 'dots', label: 'Puntos' },
  { id: 'classy', label: 'Clásico' },
  { id: 'extra-rounded', label: 'Extra redondeado' },
]

export const CORNER_STYLES = [
  { id: 'square', label: 'Cuadrado' },
  { id: 'dot', label: 'Punto' },
  { id: 'extra-rounded', label: 'Extra redondeado' },
]

/** Nivel de corrección de errores forzado por el plan (30%) para admitir logo central. */
export const ECC_LEVEL = 'H'

/** Margen de seguridad del logo, en proporción del lado del QR. */
export const LOGO_MARGIN_RATIO = 0.08

export const DEFAULT_STYLE = {
  preset: 'institucional',
  dark: '#1B3A6B',
  light: '#FFFFFF',
  dotStyle: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  logo: null,
  logoSize: 0.22,
}
