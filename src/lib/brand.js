/**
 * Configuración de marca institucional.
 *
 * Colores tomados del tema oficial que usa ssf.gob.sv: el charcoal #303845 de
 * su hoja de estilo y el azul #094680 de su kit. Todas las combinaciones
 * mantienen contraste alto entre módulo y fondo, que es lo que necesita un
 * lector de QR sobre papel impreso.
 */
export const BRAND_PRESETS = [
  { id: 'institucional', label: 'Charcoal', dark: '#303845', light: '#FFFFFF' },
  { id: 'azul-ssf', label: 'Azul SSF', dark: '#094680', light: '#FFFFFF' },
  {
    id: 'sobre-claro',
    label: 'Sobre fondo claro',
    dark: '#303845',
    light: '#F5F7FE',
  },
  { id: 'invertido', label: 'Invertido', dark: '#FFFFFF', light: '#303845' },
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
  dark: '#303845',
  light: '#FFFFFF',
  dotStyle: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  logo: null,
  logoSize: 0.22,
}
