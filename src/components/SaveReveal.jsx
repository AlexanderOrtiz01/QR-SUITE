import { useEffect, useRef, useState } from 'react'
import { MAQUILISHUAT, TONOS } from '../lib/maquilishuat.js'
import { QrPreview } from './QrPreview.jsx'

/**
 * Transición de guardado.
 *
 * Guardar un código es el único instante del asistente en que algo se crea de
 * verdad, así que es el momento que merece la escena: la cámara sube por el
 * tronco de un maquilishuat —el árbol nacional— y el código aparece entre la
 * floración. Es un único momento autorado, no un efecto repartido por la app.
 *
 * Se puede saltar con un clic o con una tecla, y con `prefers-reduced-motion`
 * se resuelve de inmediato sin recorrido de cámara.
 */

/** Momento en que el código empieza a aparecer, y final de la escena. */
const APARECE_MS = 1350
const TOTAL_MS = 2600

function Escena() {
  const { ramas, racimos, petalos } = MAQUILISHUAT

  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bcd4ff" />
          <stop offset="34%" stopColor="#5b86ec" />
          <stop offset="72%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f1f63" />
        </linearGradient>
        <linearGradient id="madera" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f241e" />
          <stop offset="55%" stopColor="#5a463a" />
          <stop offset="100%" stopColor="#2a201a" />
        </linearGradient>
      </defs>

      {/* El cielo no viaja con el árbol: es el fondo por el que este pasa. */}
      <rect x="0" y="-400" width="1200" height="2600" fill="url(#cielo)" />

      {/* Es el árbol el que baja; la cámara, en realidad, sube por él. */}
      <g className="[animation:camara-arriba_2s_cubic-bezier(.22,1,.3,1)_both]">
        <g
          stroke="url(#madera)"
          strokeLinecap="round"
          fill="none"
          opacity="0.96"
        >
          {ramas.map((rama, indice) => (
            <path key={indice} d={rama.d} strokeWidth={rama.grosor} />
          ))}
        </g>

        {racimos.map((racimo, indice) => (
          <g
            key={indice}
            style={{
              animation: `flor-abre .8s cubic-bezier(.22,1,.3,1) ${racimo.retardo}s both`,
              transformOrigin: `${racimo.x}px ${racimo.y}px`,
            }}
          >
            {racimo.flores.map((flor, i) => (
              <circle
                key={i}
                cx={flor.x}
                cy={flor.y}
                r={flor.r}
                fill={TONOS[flor.tono]}
                opacity="0.94"
              />
            ))}
          </g>
        ))}
      </g>

      {/* Los pétalos caen sobre la escena, sin viajar con el árbol. */}
      <g>
        {petalos.map((petalo, indice) => (
          <ellipse
            key={indice}
            cx={petalo.x}
            cy={-40}
            rx={petalo.r}
            ry={petalo.r * 0.62}
            fill={TONOS[petalo.tono]}
            style={{
              '--deriva': `${petalo.deriva}px`,
              animation: `petalo-cae ${petalo.duracion}s linear ${petalo.retardo}s infinite`,
              transformOrigin: `${petalo.x}px -40px`,
            }}
          />
        ))}
      </g>
    </svg>
  )
}

function prefiereQuietud() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function SaveReveal({ data, style, title, onDone }) {
  // Sin recorrido de cámara el código no espera a nadie: se muestra ya.
  const [mostrarCodigo, setMostrarCodigo] = useState(prefiereQuietud)
  const terminado = useRef(false)

  // Con la barra de desplazamiento visible, un `fixed inset-0` se queda unos
  // píxeles corto y se cuela la pantalla de debajo.
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])

  useEffect(() => {
    const sinMovimiento = prefiereQuietud()

    function terminar() {
      if (terminado.current) return
      terminado.current = true
      onDone()
    }

    if (sinMovimiento) {
      const salida = setTimeout(terminar, 900)
      return () => clearTimeout(salida)
    }

    const aparicion = setTimeout(() => setMostrarCodigo(true), APARECE_MS)
    const salida = setTimeout(terminar, TOTAL_MS)

    // La escena se puede saltar: quien guarda diez códigos seguidos no quiere
    // verla diez veces.
    window.addEventListener('keydown', terminar)
    return () => {
      clearTimeout(aparicion)
      clearTimeout(salida)
      window.removeEventListener('keydown', terminar)
    }
  }, [onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-50 flex h-dvh w-dvw cursor-pointer items-center justify-center overflow-hidden bg-brand-deep"
    >
      <Escena />
      <div className="relative flex flex-col items-center px-6 text-center">
        {mostrarCodigo ? (
          <>
            <div className="rounded-3xl bg-white p-4 shadow-[0_24px_60px_rgb(15_31_99/0.45)] [animation:codigo-aparece_.8s_cubic-bezier(.22,1,.3,1)_both]">
              <QrPreview data={data} style={style} size={200} />
            </div>
            <p className="mt-5 text-lg font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgb(15_31_99/0.85)] [animation:codigo-aparece_.8s_cubic-bezier(.22,1,.3,1)_.12s_both]">
              {title}
            </p>
            <p className="mt-1 text-sm font-semibold text-white/85 drop-shadow-[0_2px_8px_rgb(15_31_99/0.85)] [animation:codigo-aparece_.8s_cubic-bezier(.22,1,.3,1)_.2s_both]">
              Código guardado
            </p>
          </>
        ) : (
          <span className="sr-only">Guardando el código</span>
        )}
      </div>
    </div>
  )
}
