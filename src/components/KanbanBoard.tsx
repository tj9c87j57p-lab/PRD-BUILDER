"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Contact, Deal, Stage } from "@prisma/client";
import { StageColumnHeader } from "@/components/StageColumnHeader";
import {
  moveDeal,
  createStage,
  reorderStages,
} from "@/app/(dashboard)/deals/actions";
import { formatCents } from "@/lib/money";

type DealWithContact = Deal & { contact: Contact };
type StageWithDeals = Stage & { deals: DealWithContact[] };

type OptimisticAction =
  | { type: "moveDeal"; dealId: string; toStageId: string }
  | { type: "reorderStages"; orderedIds: string[] };

function applyOptimisticUpdate(
  state: StageWithDeals[],
  action: OptimisticAction
): StageWithDeals[] {
  if (action.type === "moveDeal") {
    let movedDeal: DealWithContact | null = null;
    const withoutDeal = state.map((stage) => {
      const found = stage.deals.find((d) => d.id === action.dealId);
      if (!found) return stage;
      movedDeal = {
        ...found,
        stageId: action.toStageId,
        stageEnteredAt: new Date(),
      };
      return {
        ...stage,
        deals: stage.deals.filter((d) => d.id !== action.dealId),
      };
    });
    if (!movedDeal) return state;
    const deal = movedDeal as DealWithContact;
    return withoutDeal.map((stage) =>
      stage.id === action.toStageId
        ? { ...stage, deals: [...stage.deals, deal] }
        : stage
    );
  }

  if (action.type === "reorderStages") {
    const byId = new Map(state.map((s) => [s.id, s]));
    return action.orderedIds
      .map((id) => byId.get(id))
      .filter((s): s is StageWithDeals => Boolean(s));
  }

  return state;
}

function daysInStage(stageEnteredAt: Date): number {
  const ms = Date.now() - new Date(stageEnteredAt).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function DealCardContent({ deal }: { deal: DealWithContact }) {
  const days = daysInStage(deal.stageEnteredAt);
  return (
    <>
      <Link
        href={`/deals/${deal.id}`}
        onPointerDown={(event) => event.stopPropagation()}
        className="font-medium text-foreground hover:text-accent"
      >
        {deal.contact.name}
      </Link>
      <div className="mt-1 text-muted">{formatCents(deal.valueCents)}</div>
      <div className="mt-1 text-xs text-muted">
        {days} day{days === 1 ? "" : "s"} in stage
      </div>
    </>
  );
}

function DealCard({ deal }: { deal: DealWithContact }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card:${deal.id}`,
    data: { type: "card", dealId: deal.id, stageId: deal.stageId },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-md border border-border bg-background p-3 text-sm ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <DealCardContent deal={deal} />
    </div>
  );
}

function ColumnBody({
  stageId,
  deals,
}: {
  stageId: string;
  deals: DealWithContact[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `body:${stageId}`,
    data: { type: "card", stageId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-b-lg border border-t-0 border-border p-3 transition-colors ${
        isOver ? "bg-surface" : "bg-surface/50"
      }`}
    >
      {deals.length === 0 ? (
        <p className="text-xs text-muted">No deals</p>
      ) : (
        deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
      )}
    </div>
  );
}

function AddStageColumn() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await createStage(trimmed);
      setError(result?.error ?? null);
      if (!result?.error) {
        setName("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-fit shrink-0 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted hover:border-accent hover:text-foreground"
      >
        + Add stage
      </button>
    );
  }

  return (
    <div className="w-64 shrink-0 rounded-lg border border-border bg-surface p-3">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={submit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Stage name"
        disabled={isPending}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

const typeAwareCollisionDetection: CollisionDetection = (args) => {
  const activeType = (args.active.data.current as { type?: string } | undefined)
    ?.type;
  const filteredArgs = {
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) =>
        (container.data.current as { type?: string } | undefined)?.type ===
        activeType
    ),
  };
  const intersections = rectIntersection(filteredArgs);
  return intersections.length > 0 ? intersections : closestCenter(filteredArgs);
};

export function KanbanBoard({ stages }: { stages: StageWithDeals[] }) {
  const [optimisticStages, applyOptimistic] = useOptimistic(
    stages,
    applyOptimisticUpdate
  );
  const [, startTransition] = useTransition();
  const [activeCard, setActiveCard] = useState<DealWithContact | null>(null);
  const [activeColumnName, setActiveColumnName] = useState<string | null>(
    null
  );
  const [boardError, setBoardError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | { type: "card"; dealId: string }
      | { type: "column"; stageId: string }
      | undefined;
    if (data?.type === "card") {
      for (const stage of optimisticStages) {
        const found = stage.deals.find((d) => d.id === data.dealId);
        if (found) {
          setActiveCard(found);
          break;
        }
      }
    } else if (data?.type === "column") {
      const stage = optimisticStages.find((s) => s.id === data.stageId);
      setActiveColumnName(stage?.name ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveColumnName(null);

    const activeData = event.active.data.current as
      | { type: "card"; dealId: string; stageId: string }
      | { type: "column"; stageId: string }
      | undefined;
    const overData = event.over?.data.current as
      | { type: "card"; stageId: string }
      | { type: "column"; stageId: string }
      | undefined;

    if (!activeData || !overData) return;

    if (activeData.type === "card" && overData.type === "card") {
      if (activeData.stageId === overData.stageId) return;
      const { dealId } = activeData;
      const toStageId = overData.stageId;
      startTransition(async () => {
        applyOptimistic({ type: "moveDeal", dealId, toStageId });
        const result = await moveDeal(dealId, toStageId);
        setBoardError(result?.error ?? null);
      });
      return;
    }

    if (activeData.type === "column" && overData.type === "column") {
      if (activeData.stageId === overData.stageId) return;
      const currentOrder = optimisticStages.map((s) => s.id);
      const fromIndex = currentOrder.indexOf(activeData.stageId);
      const toIndex = currentOrder.indexOf(overData.stageId);
      if (fromIndex === -1 || toIndex === -1) return;
      const newOrder = [...currentOrder];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, activeData.stageId);
      startTransition(async () => {
        applyOptimistic({ type: "reorderStages", orderedIds: newOrder });
        const result = await reorderStages(newOrder);
        setBoardError(result?.error ?? null);
      });
    }
  }

  const totalCents = optimisticStages.reduce(
    (sum, stage) =>
      sum + stage.deals.reduce((s, d) => s + d.valueCents, 0),
    0
  );

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Total pipeline value:{" "}
        <span className="font-medium text-foreground">
          {formatCents(totalCents)}
        </span>
      </p>

      {boardError ? (
        <div className="mb-4 rounded-md border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          {boardError}
        </div>
      ) : null}

      <DndContext
        id="deals-kanban-board"
        sensors={sensors}
        collisionDetection={typeAwareCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveCard(null);
          setActiveColumnName(null);
        }}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {optimisticStages.map((stage) => {
            const stageTotalCents = stage.deals.reduce(
              (s, d) => s + d.valueCents,
              0
            );
            return (
              <div key={stage.id} className="flex w-64 shrink-0 flex-col">
                <StageColumnHeader
                  stageId={stage.id}
                  name={stage.name}
                  totalCents={stageTotalCents}
                  dealCount={stage.deals.length}
                />
                <ColumnBody stageId={stage.id} deals={stage.deals} />
              </div>
            );
          })}
          <AddStageColumn />
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rounded-md border border-accent bg-background p-3 text-sm shadow-lg">
              <DealCardContent deal={activeCard} />
            </div>
          ) : null}
          {activeColumnName ? (
            <div className="rounded-lg border border-accent bg-surface p-3 text-sm font-semibold text-foreground shadow-lg">
              {activeColumnName}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
