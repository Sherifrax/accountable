import type { Deal, Stage } from "../../api/types";
import { isOpenStage, STAGE_NAMES } from "../../lib/stages";

/** Deals of one column in board order. */
export function columnOf(deals: Deal[], stage: string): Deal[] {
  return deals.filter((d) => d.stage === stage).sort((a, b) => a.position - b.position || a.id - b.id);
}

/** Totals for a set of deals: value and expected revenue (R-PIPE-1, R-PIPE-2). */
export function totals(deals: Deal[]) {
  return {
    count: deals.length,
    value: deals.reduce((sum, d) => sum + d.value, 0),
    expected: deals.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0),
  };
}

export function openDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => isOpenStage(d.stage));
}

/**
 * What the server will do for `POST /deals/{id}/move`, worked out here first so the board and its
 * totals change the moment the card is dropped (R-PIPE-5). The server stays the owner of the
 * order: after it replies, the real data replaces this.
 */
export function applyMove(
  deals: Deal[],
  move: { id: number; stage: string; index: number },
  stages: Stage[],
  today: string,
): Deal[] {
  const deal = deals.find((d) => d.id === move.id);
  if (!deal) return deals;
  const changed = deal.stage !== move.stage;
  const moved: Deal = { ...deal, stage: move.stage };
  if (changed) {
    moved.probability = stages.find((s) => s.name === move.stage)?.probability ?? deal.probability;
    if (!isOpenStage(move.stage)) moved.close_date = today;
    moved.expected_revenue = (moved.value * moved.probability) / 100;
    moved.late = isOpenStage(move.stage) && !!moved.close_date && moved.close_date < today;
  }
  const next = deals.filter((d) => d.id !== move.id).map((d) => ({ ...d }));
  const target = columnOf(next, move.stage);
  target.splice(Math.min(move.index, target.length), 0, moved);
  const renumber = (column: Deal[]) => column.forEach((d, i) => (d.position = i));
  renumber(target);
  if (changed) renumber(columnOf(next, deal.stage));
  return [...next.filter((d) => d.stage !== move.stage), ...target];
}

export const STAGES_IN_ORDER = STAGE_NAMES;
