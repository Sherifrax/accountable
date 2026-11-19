import { useDashboard } from "../../api/hooks";
import { Async } from "../../components/Async";
import { FigureTile } from "../../components/FigureTile";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { money, plural, shortMoney, signedPercent } from "../../lib/format";
import { RevenueLine, WonLostBars } from "./Charts";
import { Funnel, OpenStack } from "./Funnel";
import { FollowUps, RecentActivity } from "./Lists";
import "./dashboard.css";

export function DashboardPage() {
  const query = useDashboard();
  return (
    <>
      <PageHeader title="Dashboard" />
      <Async query={query} back={{ to: "/deals", label: "Go to deals" }}>
        {(d) => {
          const { open_pipeline: open, expected_revenue: exp, won_this_month: won, win_rate: rate } = d.tiles;
          return (
            <div className="grid">
              <div className="c3"><FigureTile label="Open pipeline" figure={shortMoney(open.value)} full={money(open.value)} context={plural(open.count, "open deal")} /></div>
              <div className="c3"><FigureTile label="Expected revenue" figure={shortMoney(exp.value)} full={money(exp.value)} context="Weighted by probability" /></div>
              <div className="c3">
                <FigureTile
                  label="Won this month"
                  figure={shortMoney(won.value)}
                  full={money(won.value)}
                  tone={won.change_percent === null ? "neutral" : won.change_percent >= 0 ? "up" : "down"}
                  context={won.change_percent === null ? "Nothing won last month" : `${signedPercent(won.change_percent)} on last month`}
                />
              </div>
              <div className="c3">
                <FigureTile
                  label="Win rate"
                  figure={rate.percent === null ? "–" : `${rate.percent}%`}
                  context={rate.percent === null ? "No closed deals in 12 months" : `${rate.won} won, ${rate.lost} lost in 12 months`}
                />
              </div>
              <div className="c8"><Panel title="Revenue won by month"><RevenueLine months={d.months} /></Panel></div>
              <div className="c4"><Panel title="Follow-ups"><div className="follow-scroll"><FollowUps items={d.follow_ups} /></div></Panel></div>
              <div className="c7">
                <Panel title="Pipeline funnel">
                  <Funnel steps={d.funnel} />
                  <OpenStack stages={d.open_by_stage} />
                </Panel>
              </div>
              <div className="c5"><Panel title="Deals won and lost"><WonLostBars months={d.months} /></Panel></div>
              <div className="c12"><Panel title="Recent activity"><RecentActivity items={d.recent_activity} /></Panel></div>
            </div>
          );
        }}
      </Async>
    </>
  );
}
