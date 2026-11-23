import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { invalidateRecords, keys } from "../../api/hooks";
import type { Deal, Stage } from "../../api/types";
import { todayIso } from "../../lib/format";
import { useNotify } from "../../lib/notify";
import { applyMove } from "./moveDeal";

type Move = { id: number; stage: string; index: number };

/**
 * Moves a card. The cache changes straight away, the server is asked, and if it says no the
 * cache goes back and a message says so. Either way the real data is fetched afterwards.
 */
export function useMoveDeal() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (move: Move) =>
      api<Deal>(`/deals/${move.id}/move`, { method: "POST", body: { stage: move.stage, index: move.index } }),
    onMutate: async (move) => {
      await qc.cancelQueries({ queryKey: keys.deals });
      const previous = qc.getQueryData<Deal[]>(keys.deals);
      const stages = qc.getQueryData<Stage[]>(keys.stages) ?? [];
      if (previous) qc.setQueryData<Deal[]>(keys.deals, applyMove(previous, move, stages, todayIso()));
      return { previous };
    },
    onError: (_error, _move, context) => {
      if (context?.previous) qc.setQueryData(keys.deals, context.previous);
      notify.error("Couldn't save the move. Try again.");
    },
    onSettled: () => invalidateRecords(qc),
  });
}
