/**
 * Entrada en cascada de un QR ya pintado.
 *
 * Orden: primero las tres marcas de posición, con un pequeño rebote; después
 * los módulos, que brotan desde esas esquinas hacia la contraria, cada uno con
 * un leve desfase propio para que el frente no avance como una regla; al
 * final, el logotipo.
 *
 * Rendimiento: no se anima el SVG. `qr-code-styling` dibuja cada módulo como
 * una forma dentro de un `clipPath`; animar esas 400 y pico formas obligaba a
 * recalcular estilos y a repintar el recorte entero en cada fotograma, en el
 * hilo principal. En su lugar el código terminado se rasteriza una vez a un
 * mapa de bits, se ocultan sus capas de color y un `<canvas>` superpuesto copia
 * cada módulo de ese mapa a su escala del momento: unas 400 copias de imagen
 * por fotograma, que la GPU resuelve en torno a un milisegundo. Al terminar se
 * retira el lienzo y queda el SVG real, idéntico.
 */

// Tiempos en milisegundos.
const CORNER_MS = 380
const MODULE_MS = 340
const LOGO_MS = 420
const FRONT_MS = 520 // lo que tarda el frente en cruzar el código
const MODULE_START = 140
const JITTER_MS = 70

// Esquinas con marca de posición, en coordenadas normalizadas del código.
const FINDERS = [
  [0, 0],
  [1, 0],
  [0, 1],
]

/** Curva de Bézier cúbica como la de CSS, resuelta por Newton y bisección. */
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t) => ((ay * t + by) * t + cy) * t
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx

  return (x) => {
    let t = x
    for (let i = 0; i < 6; i += 1) {
      const error = sampleX(t) - x
      if (Math.abs(error) < 1e-4) return sampleY(t)
      const slope = slopeX(t)
      if (Math.abs(slope) < 1e-6) break
      t -= error / slope
    }
    let low = 0
    let high = 1
    t = x
    for (let i = 0; i < 20; i += 1) {
      const value = sampleX(t)
      if (Math.abs(value - x) < 1e-4) break
      if (value < x) low = t
      else high = t
      t = (low + high) / 2
    }
    return sampleY(t)
  }
}

// Muelle con rebote leve, el mismo que se usaba en CSS.
const spring = cubicBezier(0.34, 1.56, 0.64, 1)

/** Desfase determinista por índice: varía entre módulos pero no entre visitas. */
function jitter(index) {
  return (((index * 2654435761) >>> 0) % 1000) / 1000 - 0.5
}

/**
 * Celda cuadrada centrada en la forma. Las formas traen un `rotate()` sobre su
 * propio centro, que no mueve ese centro; con una celda cuadrada el giro da
 * igual.
 */
function cellOf(element) {
  const box = element.getBBox()
  const side = Math.max(box.width, box.height)
  return {
    x: box.x + box.width / 2 - side / 2,
    y: box.y + box.height / 2 - side / 2,
    side,
  }
}

async function rasterize(qr, units, scale) {
  const clone = qr.cloneNode(true)
  // Sin el fondo: los módulos se copian sueltos sobre el fondo real, que sigue
  // a la vista, y así una celda escalada no tapa a sus vecinas con blanco.
  clone
    .querySelectorAll('rect[clip-path*="background"]')
    .forEach((rect) => rect.remove())
  // En el original ya están ocultas para que las pinte el lienzo.
  clone.querySelectorAll('[style]').forEach((element) => {
    element.style.visibility = ''
  })
  clone.setAttribute('viewBox', `0 0 ${units.width} ${units.height}`)
  clone.setAttribute('width', String(Math.ceil(units.width * scale)))
  clone.setAttribute('height', String(Math.ceil(units.height * scale)))

  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(clone),
  )}`
  await image.decode()

  // Se vuelca a un lienzo: copiar trozos de un SVG decodificado puede hacer
  // que el navegador lo rasterice de nuevo en cada llamada.
  const bitmap = document.createElement('canvas')
  bitmap.width = image.width
  bitmap.height = image.height
  bitmap.getContext('2d').drawImage(image, 0, 0)
  return bitmap
}

function svgUnits(qr) {
  const viewBox = qr.viewBox.baseVal
  return viewBox && viewBox.width
    ? { width: viewBox.width, height: viewBox.height }
    : { width: qr.width.baseVal.value, height: qr.height.baseVal.value }
}

/** Qué se anima, cuándo y cómo: marcas, módulos y logotipo. */
function buildItems(qr, units, delay) {
  const items = []

  qr.querySelectorAll('clipPath[id^="clip-path-corners-square"] > *').forEach(
    (corner) => {
      // La celda del cuadro exterior ya contiene el punto interior: la marca
      // entera rebota como una pieza.
      items.push({
        cell: cellOf(corner),
        delay,
        duration: CORNER_MS,
        scale: (p) => 0.4 + 0.6 * spring(p),
      })
    },
  )

  qr.querySelectorAll('clipPath[id^="clip-path-dot-color"] > *').forEach(
    (module, index) => {
      const cell = cellOf(module)
      const x = (cell.x + cell.side / 2) / units.width
      const y = (cell.y + cell.side / 2) / units.height
      // Distancia a la marca más cercana: 0 junto a una esquina, 1 en la
      // esquina vacía (abajo a la derecha), que es la última en llenarse.
      const distance = Math.min(
        ...FINDERS.map(([fx, fy]) => Math.hypot(x - fx, y - fy)),
      )
      items.push({
        cell,
        delay:
          delay +
          MODULE_START +
          distance * FRONT_MS +
          jitter(index) * JITTER_MS,
        duration: MODULE_MS,
        scale: spring,
      })
    },
  )

  qr.querySelectorAll('image').forEach((logo) => {
    items.push({
      cell: cellOf(logo),
      delay: delay + MODULE_START + FRONT_MS * 0.6,
      duration: LOGO_MS,
      scale: (p) => 0.6 + 0.4 * spring(p),
      alpha: (p) => Math.min(1, p * 1.6),
      turn: (p) => (-8 * (1 - spring(p)) * Math.PI) / 180,
    })
  })

  return items
}

/**
 * Lanza la cascada sobre el contenedor de la vista previa y devuelve una
 * función que la detiene, deja el SVG tal cual e indica si aún no había
 * terminado.
 */
export function playModuleCascade(container, { delay = 0 } = {}) {
  const qr =
    container.querySelector('svg svg') || container.querySelector('svg')
  if (!qr) return () => false

  const units = svgUnits(qr)
  const items = buildItems(qr, units, delay)
  if (items.length === 0) return () => false
  const end = Math.max(...items.map((item) => item.delay + item.duration))

  // Capas de color que pinta el lienzo mientras dura la entrada; el fondo y
  // el marco siguen siendo los del SVG.
  const painted = [...qr.querySelectorAll('rect[clip-path], image')].filter(
    (element) =>
      element.tagName === 'image' ||
      /dot-color|corners/.test(element.getAttribute('clip-path')),
  )
  painted.forEach((element) => {
    element.style.visibility = 'hidden'
  })

  // Correspondencia entre unidades del SVG y píxeles del lienzo. Las medidas
  // de pantalla llegan escaladas si un antecesor está entrando con
  // `transform` (la lámina de guardado lo hace), así que se pasan al espacio
  // propio del contenedor dividiendo por esa escala.
  const width = container.offsetWidth
  const height = container.offsetHeight
  const bounds = container.getBoundingClientRect()
  const zoom = bounds.width / width || 1
  const ctm = qr.getScreenCTM()
  const ratio = window.devicePixelRatio || 1
  const unit = ctm ? ctm.a / zoom : width / units.width
  const originX = ctm ? (ctm.e - bounds.left) / zoom : 0
  const originY = ctm ? (ctm.f - bounds.top) / zoom : 0
  const sourceScale = unit * ratio

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: 'none',
  })
  const previousPosition = container.style.position
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative'
  }
  container.append(canvas)
  const context = canvas.getContext('2d')

  let frame = 0
  let stopped = false
  const start = performance.now()

  // Devuelve si la cascada seguía en marcha: quien la detiene sabe así si la
  // entrada llegó a completarse.
  function stop() {
    if (stopped) return false
    stopped = true
    cancelAnimationFrame(frame)
    painted.forEach((element) => {
      element.style.visibility = ''
    })
    canvas.remove()
    container.style.position = previousPosition
    return true
  }

  function draw(source, now) {
    const elapsed = now - start
    context.clearRect(0, 0, canvas.width, canvas.height)

    for (const item of items) {
      const progress = (elapsed - item.delay) / item.duration
      if (progress <= 0) continue
      const p = Math.min(progress, 1)
      const scale = item.scale(p)
      if (scale <= 0) continue

      const { x, y, side } = item.cell
      const size = side * sourceScale * scale
      const centerX = (originX + (x + side / 2) * unit) * ratio
      const centerY = (originY + (y + side / 2) * unit) * ratio
      const sourceX = x * sourceScale
      const sourceY = y * sourceScale
      const sourceSide = side * sourceScale

      if (item.alpha || item.turn) {
        context.save()
        context.globalAlpha = item.alpha ? item.alpha(p) : 1
        context.translate(centerX, centerY)
        if (item.turn) context.rotate(item.turn(p))
        context.drawImage(
          source,
          sourceX,
          sourceY,
          sourceSide,
          sourceSide,
          -size / 2,
          -size / 2,
          size,
          size,
        )
        context.restore()
      } else {
        context.drawImage(
          source,
          sourceX,
          sourceY,
          sourceSide,
          sourceSide,
          centerX - size / 2,
          centerY - size / 2,
          size,
          size,
        )
      }
    }

    if (elapsed >= end) stop()
    else frame = requestAnimationFrame((time) => draw(source, time))
  }

  rasterize(qr, units, sourceScale)
    .then((source) => {
      if (!stopped) frame = requestAnimationFrame((time) => draw(source, time))
    })
    // Si no se puede rasterizar, el código se muestra sin entrada.
    .catch(stop)

  return stop
}
