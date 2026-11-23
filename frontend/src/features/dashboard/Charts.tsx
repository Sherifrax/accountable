import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import type { Dashboard } from "../../api/types";
import { money, monthLabel, plural, shortMoney } from "../../lib/format";

type Months = Dashboard["months"];
const AXIS = { fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--ink-muted)" };
const SIZE = { width: 640, height: 340 };

function Box({ title, rows }: { title: string; rows: [string, string, string?][] }) {
  return (
    <div className="chart-tip">
      <b>{title}</b>
      {rows.map(([label, value, color]) => (
        <div key={label} className="chart-tip-row">
          {color && <span className="dot" style={{ background: color }} />}
          <span>{label}</span>
          <span className="mono">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** Revenue won by month: a smooth line with a soft area under it (R-DASH-2). */
export function RevenueLine({ months }: { months: Months }) {
  return (
    <div className="chart" role="img" aria-label="Line chart of revenue won by month, for the last 12 months">
      <ResponsiveContainer width="100%" height={340} initialDimension={SIZE}>
        <AreaChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06D6A0" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#06D6A0" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--divider)" />
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => monthLabel(m)}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            interval={0}
          />
          <YAxis
            tickFormatter={(v: number) => shortMoney(v)}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={52}
          />
          <Tooltip
            cursor={{ stroke: "var(--ink-faint)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              const m = active ? (payload?.[0]?.payload as Months[number] | undefined) : undefined;
              return m ? (
                <Box
                  title={monthLabel(m.month, "long")}
                  rows={[
                    ["Revenue won", money(m.revenue), "var(--sea-green)"],
                    ["Deals won", String(m.won)],
                  ]}
                />
              ) : null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#06D6A0"
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Deals won and lost by month, side by side (R-DASH-3). */
export function WonLostBars({ months }: { months: Months }) {
  return (
    <div>
      <div className="chart" role="img" aria-label="Bar chart of deals won and lost by month, for the last 12 months">
        <ResponsiveContainer width="100%" height={240} initialDimension={{ width: 420, height: 240 }}>
          <BarChart data={months} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--divider)" />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => monthLabel(m).slice(0, 1)}
              tickLine={false}
              axisLine={false}
              tick={AXIS}
              interval={0}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS} width={24} />
            <Tooltip
              cursor={{ fill: "var(--hover)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const m = active ? (payload?.[0]?.payload as Months[number] | undefined) : undefined;
                return m ? (
                  <Box
                    title={monthLabel(m.month, "long")}
                    rows={[
                      ["Won", plural(m.won, "deal"), "var(--sea-green)"],
                      ["Lost", plural(m.lost, "deal"), "var(--stage-lost)"],
                    ]}
                  />
                ) : null;
              }}
            />
            <Bar dataKey="won" fill="#06D6A0" radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            <Bar dataKey="lost" fill="#A9B8BD" radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        <span>
          <span className="dot" style={{ background: "var(--sea-green)" }} /> Won
        </span>
        <span>
          <span className="dot" style={{ background: "var(--stage-lost)" }} /> Lost
        </span>
      </div>
    </div>
  );
}
