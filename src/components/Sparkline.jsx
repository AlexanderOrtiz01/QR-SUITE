/**
 * Curva compacta de escaneos para el Dashboard.
 *
 * Vive en su propio módulo porque arrastra Recharts: el Dashboard lo carga en
 * diferido para que la librería no entre en el bundle inicial.
 */
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'

const SERIES = '#4375d9'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ssf-charcoal">{label}</p>
      <p className="mt-0.5 tabular-nums text-slate-600">
        {payload[0].value} escaneos
      </p>
    </div>
  )
}

export function Sparkline({ data }) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity={0.25} />
            <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: SERIES, strokeWidth: 1, strokeDasharray: '4 4' }}
          animationDuration={120}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={SERIES}
          strokeWidth={2}
          fill="url(#sparkFill)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 2, stroke: '#ffffff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
