import { lazy } from 'react'

/**
 * Páginas que se cargan bajo demanda.
 *
 * El Dashboard es la entrada y va en el paquete inicial; el resto se descarga
 * al visitarlas. En particular el Estudio y la ficha de un código arrastran el
 * generador de QR, y la Analítica arrastra Recharts: quien solo consulta el
 * panel no debe pagarlos al arrancar.
 */
const PANEL = {
  Studio: () => import('./Studio.jsx'),
  Projects: () => import('./Projects.jsx'),
  QrList: () => import('./QrList.jsx'),
  QrDetail: () => import('./QrDetail.jsx'),
  Import: () => import('./Import.jsx'),
  Analytics: () => import('./Analytics.jsx'),
  Settings: () => import('./Settings.jsx'),
}

const PUBLIC = {
  Login: () => import('./Login.jsx'),
  Redirect: () => import('./Redirect.jsx'),
  Privacy: () => import('./Privacy.jsx'),
}

function page(loaders, name) {
  return lazy(() =>
    loaders[name]().then((module) => ({ default: module[name] })),
  )
}

export const Studio = page(PANEL, 'Studio')
export const Projects = page(PANEL, 'Projects')
export const QrList = page(PANEL, 'QrList')
export const QrDetail = page(PANEL, 'QrDetail')
export const Import = page(PANEL, 'Import')
export const Analytics = page(PANEL, 'Analytics')
export const Settings = page(PANEL, 'Settings')
export const Login = page(PUBLIC, 'Login')
export const Redirect = page(PUBLIC, 'Redirect')
export const Privacy = page(PUBLIC, 'Privacy')

/**
 * Precarga las páginas del panel cuando el navegador queda libre, para que
 * navegar siga siendo inmediato. `import()` memoriza el módulo, así que la
 * visita posterior no vuelve a pedirlo.
 */
export function preloadPanelPages() {
  const run = () => Object.values(PANEL).forEach((load) => load())
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(run, { timeout: 4000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(run, 1500)
  return () => clearTimeout(id)
}
