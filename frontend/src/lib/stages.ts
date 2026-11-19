export const STAGE_NAMES = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
export type StageName = (typeof STAGE_NAMES)[number];

export const OPEN_STAGES: StageName[] = ["New", "Qualified", "Proposal", "Negotiation"];

export function isOpenStage(stage: string): boolean {
  return (OPEN_STAGES as string[]).includes(stage);
}

export const STAGE_STYLE: Record<StageName, { color: string; ink: string; tint: string }> = {
  New: { color: "var(--stage-new)", ink: "var(--cerulean-ink)", tint: "rgba(17,138,178,.06)" },
  Qualified: { color: "var(--stage-qualified)", ink: "var(--marigold-ink)", tint: "rgba(255,193,69,.09)" },
  Proposal: { color: "var(--stage-proposal)", ink: "var(--coral-ink)", tint: "rgba(247,140,107,.07)" },
  Negotiation: { color: "var(--stage-negotiation)", ink: "#2F5560", tint: "rgba(61,107,122,.06)" },
  Won: { color: "var(--stage-won)", ink: "var(--sea-green-ink)", tint: "rgba(6,214,160,.07)" },
  Lost: { color: "var(--stage-lost)", ink: "#5E7480", tint: "rgba(169,184,189,.12)" },
};

export function stageStyle(stage: string) {
  return STAGE_STYLE[stage as StageName] ?? STAGE_STYLE.Lost;
}
