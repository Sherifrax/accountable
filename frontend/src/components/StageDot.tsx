import { stageStyle } from "../lib/stages";

export function StageDot({ stage }: { stage: string }) {
  return <span className="dot" style={{ background: stageStyle(stage).color }} aria-hidden="true" />;
}

/** A small dot plus the stage name (spec 4.4). */
export function StageLabel({ stage }: { stage: string }) {
  return (
    <span className="stage-label">
      <StageDot stage={stage} />
      {stage}
    </span>
  );
}
