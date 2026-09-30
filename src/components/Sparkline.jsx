import { useState } from 'react'

/**
 * Curva compacta de escaneos para el Dashboard.
 *
 * Es un SVG propio y no Recharts: para una línea con relleno y un punto
 * activo, la librería eran más de 300 KB que el Dashboard descargaba al
 * arrancar. El trazo se dibuja en un lienzo de 100 unidades de ancho que se
 * estira al contenedor; los puntos van en HTML para que no se deformen.
 */
const SERIES = '#1a48e6'

export function Sparkline({ data, height = 90 }) {
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...data.map((day) => day.value))
  const last = Math.max(1, data.length - 1)

  const x = (index) => (index / last) * 100
  const y = (value) => 5 + (1 - value / max) * (height - 8)

  const line = data
    .map((day, index) => `${index ? 'L' : 'M'}${x(index)} ${y(day.value)}`)
    .join(' ')
  const area = `${line} L100 ${height} L0 ${height} Z`
  const point = active === null ? null : data[active]
  const total = data.reduce((sum, day) => sum + day.value, 0)

  return (
    <div
      role="img"
      aria-label={`${total} escaneos en los últimos ${data.length} días`}
      className="relative"
      style={{ height }}
      onMouseLeave={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity="0.25" />
            <stop offset="100%" stopColor={SERIES} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkFill)" />
        {point ? (
          <line
            x1={x(active)}
            x2={x(active)}
            y1="0"
            y2={height}
            stroke={SERIES}
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <path
          d={line}
          fill="none"
          stroke={SERIES}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {data.map((day, index) => (
        <span
          key={day.label}
          aria-hidden="true"
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary transition-[width,height,box-shadow] duration-150 ${
            active === index ? 'size-2.5 ring-2 ring-white' : 'size-1'
          }`}
          style={{ left: `${x(index)}%`, top: y(day.value) }}
        />
      ))}

      {/* Franjas invisibles que reciben el puntero, una por día. */}
      <div className="absolute inset-0 flex">
        {data.map((day, index) => (
          <span
            key={day.label}
            className="h-full flex-1"
            onMouseEnter={() => setActive(index)}
          />
        ))}
      </div>

      {point ? (
        <div
          className={`glass-thick pointer-events-none absolute bottom-full mb-2 rounded-xl px-3 py-2 text-xs whitespace-nowrap ${
            x(active) > 70
              ? '-translate-x-full'
              : x(active) < 30
                ? ''
                : '-translate-x-1/2'
          }`}
          style={{ left: `${x(active)}%` }}
        >
          <p className="font-bold text-brand-ink">{point.label}</p>
          <p className="mt-0.5 text-brand-ink/80 tabular-nums">
            {point.value} escaneos
          </p>
        </div>
      ) : null}
    </div>
  )
}
