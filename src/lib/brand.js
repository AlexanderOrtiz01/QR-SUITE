import { DEFAULT_FRAME_LABEL } from './frames.js'

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

/**
 * Tonos institucionales disponibles para los degradados: los de la hoja de
 * estilo del tema de gobierno más el azul del emblema del Ministerio.
 */
const TONES = {
  charcoal: '#303845',
  pizarra: '#3C4557',
  navySsf: '#094680',
  azul: '#4375D9',
  navyMined: '#001860',
  tinta: '#111827',
}

/**
 * Degradados institucionales.
 *
 * Todos van de un tono oscuro a otro tono oscuro. Un degradado que aclare los
 * módulos reduce el contraste con el fondo y el código deja de leerse sobre
 * papel, que es el destino de este proyecto.
 */
export const GRADIENT_PRESETS = [
  {
    id: 'charcoal-navy',
    label: 'Charcoal → Azul SSF',
    from: TONES.charcoal,
    to: TONES.navySsf,
  },
  {
    id: 'navy-blue',
    label: 'Azul SSF → Azul',
    from: TONES.navySsf,
    to: TONES.azul,
  },
  {
    id: 'charcoal-blue',
    label: 'Charcoal → Azul',
    from: TONES.charcoal,
    to: TONES.azul,
  },
  {
    id: 'navy-charcoal',
    label: 'Azul SSF → Charcoal',
    from: TONES.navySsf,
    to: TONES.charcoal,
  },
  {
    id: 'mined-navy',
    label: 'Azul MINED → Azul SSF',
    from: TONES.navyMined,
    to: TONES.navySsf,
  },
  {
    id: 'mined-blue',
    label: 'Azul MINED → Azul',
    from: TONES.navyMined,
    to: TONES.azul,
  },
  {
    id: 'navy-mined',
    label: 'Azul SSF → Azul MINED',
    from: TONES.navySsf,
    to: TONES.navyMined,
  },
  {
    id: 'pizarra-mined',
    label: 'Pizarra → Azul MINED',
    from: TONES.pizarra,
    to: TONES.navyMined,
  },
  {
    id: 'charcoal-pizarra',
    label: 'Charcoal → Pizarra',
    from: TONES.charcoal,
    to: TONES.pizarra,
  },
  {
    id: 'tinta-navy',
    label: 'Tinta → Azul SSF',
    from: TONES.tinta,
    to: TONES.navySsf,
  },
  {
    id: 'tinta-charcoal',
    label: 'Tinta → Charcoal',
    from: TONES.tinta,
    to: TONES.charcoal,
  },
  {
    id: 'blue-navy',
    label: 'Azul → Azul SSF',
    from: TONES.azul,
    to: TONES.navySsf,
  },
  {
    id: 'blue-mined',
    label: 'Azul → Azul MINED',
    from: TONES.azul,
    to: TONES.navyMined,
  },
  {
    id: 'pizarra-azul',
    label: 'Pizarra → Azul',
    from: TONES.pizarra,
    to: TONES.azul,
  },
]

export const GRADIENT_TYPES = [
  { id: 'linear', label: 'Lineal' },
  { id: 'radial', label: 'Radial' },
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
  gradient: null,
  frame: 'none',
  frameLabel: DEFAULT_FRAME_LABEL,
}
