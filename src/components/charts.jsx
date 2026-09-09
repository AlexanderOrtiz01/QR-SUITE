/**
 * Gráficos del Módulo 5, sobre Recharts.
 *
 * Paleta categórica validada para daltonismo con el azul institucional como
 * primer color (peor par all-pairs: ΔE 9.2 deutan, 15.8 visión normal). Cuatro
 * hues es el máximo que pasa el umbral; a partir del quinto los valores se
 * agrupan en «Otros» con un gris neutro, que nunca es una categoría más.
 *
 * El color sigue a la entidad, no a su posición en el ranking: filtrar por
 * proyecto cambia el orden de las barras pero no repinta las que sobreviven.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const SERIES = '#4375d9'
const CATEGORICAL = ['#4375d9', '#eb6834', '#1baf7a', '#4a3aa7']
const OTHER = '#94a3b8'

/** Rampa secuencial de un solo hue para magnitudes continuas (heatmap). */
const RAMP = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
  '#0d366b',
]

const AXIS = { fontSize: 11, fill: '#64748b' }
const GRID = '#e2e8f0'

/**
 * Asigna un color estable a cada etiqueta. Los valores frecuentes tienen slot
 * fijo para que iOS sea siempre el mismo naranja en cualquier gráfico; el resto
 * se reparte por orden alfabético, que tampoco depende del ranking.
 */
const FIXED = {
  Android: 0,
  iOS: 1,
  Windows: 2,
  macOS: 3,
  Chrome: 0,
  Safari: 1,
  Firefox: 2,
  Edge: 3,
}

function hueFor(label) {
  if (label === 'Otros' || label === 'Desconocido') return OTHER
  const slot = FIXED[label]
  if (slot !== undefined) return CATEGORICAL[slot]
  // Un valor no previsto se reparte por el nombre, no por su posición: si sube
  // o baja en el ranking al filtrar, conserva su color.
  let hash = 0
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) % 997
  }
  return CATEGORICAL[hash % CATEGORICAL.length]
}

function ChartTooltip({ active, payload, label, unit = 'escaneos' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ssf-charcoal">{label}</p>
      <p className="mt-0.5 tabular-nums text-slate-600">
        {payload[0].value} {unit}
      </p>
    </div>
  )
}

/**
 * Barras horizontales para categorías con etiqueta larga (SO, navegador).
 * El valor va rotulado junto a la barra: tres de los cuatro hues quedan por
 * debajo de 3:1 sobre blanco, así que la identidad no puede ser solo el color.
 */
export function BarList({ data, emptyLabel = 'Sin datos' }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  // Más de cuatro categorías dejan de distinguirse: la cola se agrupa.
  const head = data.slice(0, 4)
  const tail = data.slice(4)
  const rows = tail.length
    ? [
        ...head,
        { label: 'Otros', value: tail.reduce((sum, i) => sum + i.value, 0) },
      ]
    : head

  const max = Math.max(...rows.map((item) => item.value), 1)

  return (
    <ResponsiveContainer width="100%" height={rows.length * 38 + 10}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
        barCategoryGap={8}
      >
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tickLine={false}
          axisLine={false}
          tick={AXIS}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: '#f1f5f9' }}
          animationDuration={120}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {rows.map((item) => (
            <Cell key={item.label} fill={hueFor(item.label)} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 11, fill: '#475569' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Serie temporal diaria. Área en lugar de columnas: la tendencia se lee mejor
 * y con 30 días las columnas quedan demasiado finas para apuntarles.
 */
export function ColumnChart({ data, emptyLabel = 'Sin datos' }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }
  // Con muchos días se etiqueta uno de cada tres para que no se solapen.
  const interval = data.length > 20 ? 2 : data.length > 10 ? 1 : 0

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="scanFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          interval={interval}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          tick={AXIS}
        />
        <YAxis
          allowDecimals={false}
          width={44}
          tickLine={false}
          axisLine={false}
          tick={AXIS}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: SERIES, strokeWidth: 1, strokeDasharray: '4 4' }}
          animationDuration={120}
        />
        <Area
          type="linear"
          dataKey="value"
          stroke={SERIES}
          strokeWidth={2}
          fill="url(#scanFill)"
          dot={{ r: 2.5, fill: SERIES, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/**
 * Franja de intensidad por hora del día. Escala secuencial de un solo hue: es
 * magnitud continua, no categorías, así que nunca lleva colores distintos.
 */
export function HourHeatmap({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div>
      <div className="flex gap-0.5">
        {data.map((item) => {
          const step =
            item.value === 0
              ? null
              : RAMP[
                  Math.min(
                    RAMP.length - 1,
                    Math.floor((item.value / max) * RAMP.length),
                  )
                ]
          return (
            <div
              key={item.hour}
              className="h-8 flex-1 rounded-sm border border-slate-200 transition-transform hover:scale-y-110"
              style={{ background: step ?? '#f8fafc' }}
              title={`${String(item.hour).padStart(2, '0')}:00 — ${item.value} escaneos`}
            />
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>00 h</span>
        <span className="flex items-center gap-1">
          <span>0</span>
          {RAMP.map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-xs"
              style={{ background: color }}
            />
          ))}
          <span>{max}</span>
        </span>
        <span>23 h</span>
      </div>
    </div>
  )
}
