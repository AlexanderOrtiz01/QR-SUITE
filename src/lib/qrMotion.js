/**
 * Entrada en cascada de un QR ya pintado.
 *
 * `qr-code-styling` dibuja cada módulo como una forma suelta dentro de un
 * `clipPath` y rellena el recorte con el color (o el degradado). Escalar esas
 * formas desde su centro hace que los módulos «broten» sin tocar el color ni
 * el SVG que se exporta: la animación vive solo en el DOM de la vista previa.
 *
 * Orden: primero las tres marcas de posición, con un pequeño rebote; después
 * los módulos, que salen de esas esquinas hacia la contraria, cada uno con
 * un leve desfase propio para que el frente no avance como una regla; al
 * final, el logotipo.
 */

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

// Tiempos en milisegundos.
const CORNER_MS = 380
const MODULE_MS = 340
const FRONT_MS = 520 // lo que tarda el frente en cruzar el código
const MODULE_START = 140
const JITTER_MS = 70

// Esquinas con marca de posición, en coordenadas normalizadas del código.
const FINDERS = [
  [0, 0],
  [1, 0],
  [0, 1],
]

/** Desfase determinista por índice: varía entre módulos pero no entre visitas. */
function jitter(index) {
  return (((index * 2654435761) >>> 0) % 1000) / 1000 - 0.5
}

/**
 * Anima una forma desde su centro. Cada forma ya trae `rotate(ángulo, cx, cy)`
 * en su atributo `transform`, girando sobre su propio centro: la propiedad CSS
 * lo sustituye mientras dura la animación, así que el giro se suma a cada
 * fotograma. Al terminar se retira el origen: con él puesto, el atributo
 * giraría sobre otro punto y la forma saldría desplazada. Si la animación se
 * cancela antes (el código cambió a mitad), el SVG ya se ha sustituido entero
 * y no hay nada que restaurar.
 */
function grow(element, keyframes, timing) {
  const angle =
    Number(
      element.getAttribute('transform')?.match(/rotate\(([-\d.]+)/)?.[1],
    ) || 0
  const turn = angle ? ` rotate(${angle}deg)` : ''
  element.style.transformBox = 'fill-box'
  element.style.transformOrigin = 'center'
  const animation = element.animate(
    keyframes.map((frame) =>
      frame.transform ? { ...frame, transform: frame.transform + turn } : frame,
    ),
    { fill: 'both', ...timing },
  )
  // El último fotograma se mantiene (`fill: both`) hasta que este manejador
  // quita el origen y suelta la animación en la misma tarea: así no hay un
  // fotograma intermedio con el atributo girando sobre el punto equivocado.
  function restore() {
    element.style.transformBox = ''
    element.style.transformOrigin = ''
    animation.cancel()
  }
  animation.addEventListener('finish', restore, { once: true })
  return animation
}

/**
 * Lanza la cascada sobre el `<svg>` de la vista previa y devuelve las
 * animaciones, para poder cancelarlas si el código cambia a mitad.
 */
export function playModuleCascade(svg, { delay = 0 } = {}) {
  const animations = []

  svg
    .querySelectorAll(
      'clipPath[id^="clip-path-corners-square"] > *, clipPath[id^="clip-path-corners-dot"] > *',
    )
    .forEach((corner) => {
      animations.push(
        grow(
          corner,
          [
            { transform: 'scale(0.4)' },
            { transform: 'scale(1.08)', offset: 0.7 },
            { transform: 'scale(1)' },
          ],
          { duration: CORNER_MS, delay, easing: EASE_OUT },
        ),
      )
    })

  const modules = [
    ...svg.querySelectorAll('clipPath[id^="clip-path-dot-color"] > *'),
  ]
  if (modules.length > 0) {
    const boxes = modules.map((module) => module.getBBox())
    const minX = Math.min(...boxes.map((box) => box.x))
    const minY = Math.min(...boxes.map((box) => box.y))
    const width = Math.max(...boxes.map((box) => box.x + box.width)) - minX
    const height = Math.max(...boxes.map((box) => box.y + box.height)) - minY

    modules.forEach((module, index) => {
      const box = boxes[index]
      const x = (box.x + box.width / 2 - minX) / width
      const y = (box.y + box.height / 2 - minY) / height
      // Distancia a la marca más cercana: 0 junto a una esquina, 1 en la
      // esquina vacía (abajo a la derecha), que es la última en llenarse.
      const distance = Math.min(
        ...FINDERS.map(([fx, fy]) => Math.hypot(x - fx, y - fy)),
      )
      animations.push(
        grow(module, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
          duration: MODULE_MS,
          delay:
            delay +
            MODULE_START +
            distance * FRONT_MS +
            jitter(index) * JITTER_MS,
          easing: SPRING,
        }),
      )
    })
  }

  svg.querySelectorAll('image').forEach((logo) => {
    animations.push(
      grow(
        logo,
        [
          { opacity: 0, transform: 'scale(0.6) rotate(-8deg)' },
          { opacity: 1, transform: 'scale(1) rotate(0deg)' },
        ],
        {
          duration: 420,
          delay: delay + MODULE_START + FRONT_MS * 0.6,
          easing: SPRING,
        },
      ),
    )
  })

  return animations
}
