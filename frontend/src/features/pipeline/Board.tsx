import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Deal } from "../../api/types";
import { IconButton } from "../../components/Button";
import { StageDot } from "../../components/StageDot";
import { money } from "../../lib/format";
import { STAGE_NAMES, stageStyle } from "../../lib/stages";
import { CardFace } from "./Card";
import { columnOf, totals } from "./moveDeal";
import "./pipeline.css";

type Columns = Record<string, Deal[]>;
const colId = (stage: string) => `col:${stage}`;
const stageOfColId = (id: string | number) => (typeof id === "string" && id.startsWith("col:") ? id.slice(4) : null);

function SortableCard({ deal }: { deal: Deal }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  return (
    // The deal's name is a link inside the card (CardFace, link), so keyboard users open the deal that way.
    // This click handler is only for the mouse, so the keyboard rules for clickable elements don't apply.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card ${deal.late ? "late" : ""} ${isDragging ? "slot" : ""}`}
      data-testid={`card-${deal.id}`}
      aria-label={`${deal.name}, ${deal.stage}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // A click that isn't the end of a drag opens the deal (R-PIPE-8).
        if (!(e.target as HTMLElement).closest("a")) navigate(`/deals/${deal.id}`);
      }}
    >
      <CardFace deal={deal} link />
    </div>
  );
}

function Column({ stage, deals, onAdd }: { stage: string; deals: Deal[]; onAdd: (stage: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: colId(stage) });
  const sums = totals(deals);
  const style = stageStyle(stage);
  return (
    <section
      className={`col ${isOver ? "over" : ""}`}
      style={{ background: style.tint }}
      aria-label={`${stage} column`}
      data-stage={stage}
    >
      <div className="col-head">
        <div className="col-name">
          <StageDot stage={stage} />
          <h2>{stage}</h2>
          <span className="count" aria-label={`${sums.count} deals`}>
            {sums.count}
          </span>
          <IconButton label={`Add deal to ${stage}`} onClick={() => onAdd(stage)}>
            <Plus size={16} />
          </IconButton>
        </div>
        <div className="col-sums">
          <span>
            <span className="label">Total </span>
            <span className="mono" data-testid={`total-${stage}`}>
              {money(sums.value)}
            </span>
          </span>
          <span>
            <span className="label">Expected </span>
            <span className="mono" data-testid={`expected-${stage}`}>
              {money(sums.expected)}
            </span>
          </span>
        </div>
      </div>
      <div ref={setNodeRef} className="cards" data-testid={`cards-${stage}`}>
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((d) => (
            <SortableCard key={d.id} deal={d} />
          ))}
        </SortableContext>
        {deals.length === 0 && <div className="col-empty">No deals</div>}
      </div>
    </section>
  );
}

type Props = {
  deals: Deal[];
  onMove: (move: { id: number; stage: string; index: number }) => void;
  onAdd: (stage: string) => void;
};

/** The six columns with drag and drop (R-PIPE-4, R-PIPE-9). */
export function Board({ deals, onMove, onAdd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const base = useMemo<Columns>(() => Object.fromEntries(STAGE_NAMES.map((s) => [s, columnOf(deals, s)])), [deals]);
  const [live, setLive] = useState<Columns | null>(null);
  const [active, setActive] = useState<Deal | null>(null);
  const columns = live ?? base;

  const findStage = (cols: Columns, id: string | number) =>
    stageOfColId(id) ?? STAGE_NAMES.find((s) => cols[s].some((d) => d.id === id)) ?? null;

  function onDragStart(event: DragStartEvent) {
    setLive(base);
    setActive(deals.find((d) => d.id === event.active.id) ?? null);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || !live) return;
    const from = findStage(live, active.id);
    const to = findStage(live, over.id);
    if (!from || !to || from === to) return;
    const moving = live[from].find((d) => d.id === active.id)!;
    const target = [...live[to]];
    const overIndex = target.findIndex((d) => d.id === over.id);
    target.splice(overIndex >= 0 ? overIndex : target.length, 0, { ...moving, stage: to });
    setLive({ ...live, [from]: live[from].filter((d) => d.id !== active.id), [to]: target });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const cols = live ?? base;
    setLive(null);
    setActive(null);
    if (!over) return;
    const original = deals.find((d) => d.id === active.id);
    if (!original) return;
    const stage = findStage(cols, active.id)!;
    // The place it was dropped: on a card, that card's place; on empty column space, where it sits.
    const overIndex = cols[stage].findIndex((d) => d.id === over.id);
    const index = overIndex >= 0 ? overIndex : cols[stage].findIndex((d) => d.id === active.id);
    const startedAt = base[original.stage].findIndex((d) => d.id === original.id);
    if (stage === original.stage && index === startedAt) return;
    onMove({ id: original.id, stage, index });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setLive(null);
        setActive(null);
      }}
    >
      <div className="board">
        {STAGE_NAMES.map((stage) => (
          <Column key={stage} stage={stage} deals={columns[stage]} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <div className={`card lifted ${active.late ? "late" : ""}`}>
            <CardFace deal={active} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
