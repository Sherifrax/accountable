import type { Dashboard } from "../../api/types";
import { StageDot } from "../../components/StageDot";
import { money, shortMoney } from "../../lib/format";
import { stageStyle } from "../../lib/stages";

const ON_COLOR: Record<string, string> = { New: "#fff", Negotiation: "#fff" };

/** Value that reached each stage, as centered bars that narrow (R-DASH-4). */
export function Funnel({ steps }: { steps: Dashboard["funnel"] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="funnel" role="list" aria-label="Pipeline funnel">
      {steps.map((s) => (
        <div className="funnel-row" role="listitem" key={s.stage}>
          <span className="stage-label">
            <StageDot stage={s.stage} />
            {s.stage}
          </span>
          <div className="funnel-bar-wrap">
            <div
              className="funnel-bar"
              title={`${s.stage}: ${money(s.value)} across ${s.count} deals`}
              style={{
                width: `${Math.max((s.value / max) * 100, 14)}%`,
                background: stageStyle(s.stage).color,
                color: ON_COLOR[s.stage] ?? "var(--midnight)",
              }}
            >
              {shortMoney(s.value)}
            </div>
          </div>
          <span className="funnel-kept">{s.kept_percent === null ? "Start" : `${s.kept_percent}% kept`}</span>
        </div>
      ))}
    </div>
  );
}

/** Today's open pipeline by stage, as one stacked bar. */
export function OpenStack({ stages }: { stages: Dashboard["open_by_stage"] }) {
  const total = stages.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="open-stack">
      <div className="sub-head">
        <h3 className="section-title">Open pipeline today</h3>
        <span className="mono">{money(total)}</span>
      </div>
      <div className="stack" role="img" aria-label="Open pipeline by stage">
        {stages
          .filter((s) => s.value > 0)
          .map((s) => (
            <span
              key={s.stage}
              title={`${s.stage}: ${money(s.value)}`}
              style={{ flex: s.value, background: stageStyle(s.stage).color }}
            />
          ))}
      </div>
      <div className="legend">
        {stages.map((s) => (
          <span key={s.stage}>
            <StageDot stage={s.stage} /> {s.stage} <span className="mono">{shortMoney(s.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
