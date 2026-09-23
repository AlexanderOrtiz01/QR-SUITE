/**
 * Geometría del maquilishuat que se dibuja al guardar un código.
 *
 * El árbol se genera una sola vez, con un generador de números deterministo:
 * así la copa es siempre la misma y no baila entre renders, pero conserva la
 * irregularidad de un árbol de verdad, que una fórmula simétrica no daría.
 *
 * El lienzo mide 1200 × 1800: alto, porque la cámara recorre de abajo arriba y
 * necesita tronco que recorrer. El suelo queda en y=1800 y la floración
 * alrededor de y=560, que es donde la cámara se detiene.
 */

const SEMILLA = 20260923

function generador(semilla) {
  let estado = semilla
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296
    return estado / 4294967296
  }
}

/** Los cuatro rosas de la floración, del más pálido al más encendido. */
export const TONOS = ['#FBD3E3', '#F4A8C8', '#E87BA8', '#D2588C']

function construir() {
  const azar = generador(SEMILLA)
  const ramas = []
  const racimos = []

  function crecer(x, y, angulo, largo, grosor, profundidad) {
    const finX = x + Math.sin(angulo) * largo
    const finY = y - Math.cos(angulo) * largo
    // El punto de control desvía la rama a un lado: una recta perfecta se
    // lee como un palo, no como madera.
    const curva = (azar() - 0.5) * 0.5
    const ctrlX = x + Math.sin(angulo + curva) * largo * 0.55
    const ctrlY = y - Math.cos(angulo + curva) * largo * 0.55

    ramas.push({
      d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${finX.toFixed(1)} ${finY.toFixed(1)}`,
      grosor,
    })

    if (profundidad === 0) {
      // Las flores se agrupan por racimo, no sueltas: así la copa se abre en
      // oleadas y basta una animación por racimo en lugar de una por flor.
      const flores = []
      const cuantas = 26 + Math.floor(azar() * 16)
      for (let i = 0; i < cuantas; i += 1) {
        const radio = azar() ** 0.55 * 86
        const giro = azar() * Math.PI * 2
        flores.push({
          x: Number((finX + Math.cos(giro) * radio).toFixed(1)),
          y: Number((finY + Math.sin(giro) * radio * 0.82).toFixed(1)),
          r: Number((3.4 + azar() * 8).toFixed(1)),
          tono: Math.floor(azar() * TONOS.length),
        })
      }
      racimos.push({
        x: Number(finX.toFixed(1)),
        y: Number(finY.toFixed(1)),
        flores,
        retardo: Number((0.25 + azar() * 0.6).toFixed(3)),
      })
      return
    }

    const bifurcaciones = azar() > 0.4 ? 3 : 2
    for (let i = 0; i < bifurcaciones; i += 1) {
      const apertura =
        (i - (bifurcaciones - 1) / 2) * (0.42 + azar() * 0.26) +
        (azar() - 0.5) * 0.12
      crecer(
        finX,
        finY,
        angulo + apertura,
        largo * (0.66 + azar() * 0.16),
        grosor * 0.62,
        profundidad - 1,
      )
    }
  }

  crecer(600, 1800, 0, 470, 36, 4)

  // Pétalos sueltos cayendo, repartidos por todo el ancho.
  const petalos = []
  for (let i = 0; i < 18; i += 1) {
    petalos.push({
      x: 60 + azar() * 1080,
      r: 3 + azar() * 4,
      tono: Math.floor(azar() * TONOS.length),
      retardo: Number((azar() * 2.4).toFixed(2)),
      duracion: Number((3.4 + azar() * 2.6).toFixed(2)),
      deriva: Number(((azar() - 0.5) * 90).toFixed(1)),
    })
  }

  return { ramas, racimos, petalos }
}

export const MAQUILISHUAT = construir()
