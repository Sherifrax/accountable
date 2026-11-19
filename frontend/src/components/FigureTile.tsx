import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

type Props = {
  label: string;
  figure: string;
  /** The full amount, shown when the figure is shortened. */
  full?: string;
  context?: ReactNode;
  tone?: "up" | "down" | "neutral";
};

export function FigureTile({ label, figure, full, context, tone = "neutral" }: Props) {
  const figureEl = <div className="figure">{figure}</div>;
  return (
    <div className="panel tile">
      <div className="label">{label}</div>
      {full && full !== figure ? (
        <Tooltip.Provider delayDuration={150}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>{figureEl}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip" sideOffset={6}>
                {full}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ) : (
        figureEl
      )}
      {context && <div className={`context ${tone === "neutral" ? "" : tone}`}>{context}</div>}
    </div>
  );
}
