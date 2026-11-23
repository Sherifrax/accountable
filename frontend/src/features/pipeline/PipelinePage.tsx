import { Plus } from "lucide-react";
import { useState } from "react";
import { useDeals, useStages } from "../../api/hooks";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { money } from "../../lib/format";
import { DealForm } from "../deals/DealForm";
import { Board } from "./Board";
import { openDeals, totals } from "./moveDeal";
import { useMoveDeal } from "./useMoveDeal";

export function PipelinePage() {
  const query = useDeals();
  useStages(); // the optimistic move needs each stage's usual probability
  const move = useMoveDeal();
  const [form, setForm] = useState<{ stage?: string } | null>(null);
  const open = totals(openDeals(query.data ?? []));

  return (
    <>
      <PageHeader title="Pipeline">
        <div className="totals" aria-label="Open pipeline totals">
          <div>
            <span className="label">Open value</span>
            <span className="mono" data-testid="board-total">
              {money(open.value)}
            </span>
          </div>
          <div>
            <span className="label">Expected revenue</span>
            <span className="mono" data-testid="board-expected">
              {money(open.expected)}
            </span>
          </div>
        </div>
        <Button variant="primary" onClick={() => setForm({})}>
          <Plus size={16} aria-hidden="true" /> New deal
        </Button>
      </PageHeader>
      <Async query={query} back={{ to: "/", label: "Go to the dashboard" }}>
        {(deals) => <Board deals={deals} onMove={(m) => move.mutate(m)} onAdd={(stage) => setForm({ stage })} />}
      </Async>
      {form && <DealForm stage={form.stage} onClose={() => setForm(null)} />}
    </>
  );
}
