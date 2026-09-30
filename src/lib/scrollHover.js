/**
 * Scroll sin repintados.
 *
 * Al desplazar con el cursor encima, cada fila o gráfico que pasa bajo el
 * puntero activa su hover, y su transición obliga a repintar en cada
 * fotograma. Mientras dura el scroll se desactiva el puntero en la página
 * (ver `data-scrolling` en index.css) y se restaura en cuanto se detiene: el
 * desplazamiento queda como pura composición, sin trabajo de pintado.
 */
const IDLE_MS = 120

export function installScrollHoverGuard() {
  const root = document.documentElement
  let timer = 0

  function release() {
    delete root.dataset.scrolling
    timer = 0
  }

  window.addEventListener(
    'scroll',
    () => {
      if (timer) clearTimeout(timer)
      else root.dataset.scrolling = ''
      timer = setTimeout(release, IDLE_MS)
    },
    { passive: true },
  )
}
