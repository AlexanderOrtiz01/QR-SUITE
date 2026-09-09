/**
 * Gráficos del Módulo 5, dibujados con HTML/CSS.
 *
 * Cada gráfico representa una sola serie (número de escaneos), así que usa un
 * único color: las categorías ya quedan identificadas por sus etiquetas de eje
 * y colorear cada barra distinta sería ruido, no información.
 */
const SERIES = '#4375d9'

/** Barras horizontales para categorías con etiqueta larga (SO, navegador). */
export function BarList({ data, emptyLabel = 'Sin datos' }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <ul className="space-y-2.5">
      {data.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3"
        >
          <span className="truncate text-sm text-slate-600" title={item.label}>
            {item.label}
          </span>
          <span
            className="h-5 rounded-sm bg-slate-100"
            title={`${item.value} escaneos`}
          >
            <span
              className="block h-5 rounded-r-sm"
              style={{
                width: `${Math.max((item.value / max) * 100, 1.5)}%`,
                background: SERIES,
              }}
            />
          </span>
          <span className="text-right text-sm tabular-nums text-slate-700">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Columnas para la serie temporal diaria. */
export function ColumnChart({ data, emptyLabel = 'Sin datos' }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div>
      <div className="flex h-40 items-end gap-0.5">
        {data.map((item) => (
          <div
            key={item.label}
            className="group flex h-full flex-1 flex-col justify-end"
            title={`${item.label}: ${item.value} escaneos`}
          >
            <span
              className="w-full rounded-t-sm transition-opacity group-hover:opacity-80"
              style={{
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? '2px' : '0',
                background: SERIES,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{data[0]?.label}</span>
        <span>máx. {max}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

/**
 * Franja de intensidad por hora del día. Un solo tono, de claro a oscuro según
 * la magnitud: es una escala secuencial, no categorías.
 */
export function HourHeatmap({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div>
      <div className="flex gap-0.5">
        {data.map((item) => {
          const intensity =
            item.value === 0 ? 0 : 0.15 + (item.value / max) * 0.85
          return (
            <div
              key={item.hour}
              className="h-8 flex-1 rounded-sm border border-slate-200"
              style={{
                background:
                  item.value === 0
                    ? '#f8fafc'
                    : `color-mix(in srgb, ${SERIES} ${intensity * 100}%, white)`,
              }}
              title={`${String(item.hour).padStart(2, '0')}:00 — ${item.value} escaneos`}
            />
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>00 h</span>
        <span>12 h</span>
        <span>23 h</span>
      </div>
    </div>
  )
}
