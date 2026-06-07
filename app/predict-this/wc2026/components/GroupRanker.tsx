'use client';

// Phase 1: drag-to-rank 4 teams within a group + wildcard star toggle.
// Uses @dnd-kit/sortable with framer-motion-friendly transforms for the
// smooth 60fps animation the spec calls for.

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Team } from '@/app/lib/wc2026/types';
import { WILDCARD_CAP } from '@/app/lib/wc2026/types';

interface Props {
  ranking: string[];                     // 4 codes in user order
  teams: Record<string, Team>;           // metadata lookup
  starredTeam: string | null;            // which team is currently starred in THIS group (null = none)
  totalStarred: number;                  // total stars used across all groups
  onChangeRanking: (next: string[]) => void;
  onToggleStar: (teamCode: string | null) => void;
}

export default function GroupRanker({
  ranking,
  teams,
  starredTeam,
  totalStarred,
  onChangeRanking,
  onToggleStar,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 100, tolerance: 8 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = ranking.indexOf(String(active.id));
    const newIdx = ranking.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onChangeRanking(arrayMove(ranking, oldIdx, newIdx));
  };

  const thirdPlaceTeam = ranking[2];
  const canStarMore =
    totalStarred < WILDCARD_CAP ||
    (starredTeam !== null && starredTeam === thirdPlaceTeam);
  const isStarred = starredTeam === thirdPlaceTeam;

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ranking} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {ranking.map((code, i) => (
              <SortableRow
                key={code}
                id={code}
                position={i + 1}
                team={teams[code] ?? { code, name: code, fifaRank: null }}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4">
        <button
          type="button"
          onClick={() => onToggleStar(isStarred ? null : thirdPlaceTeam)}
          disabled={!canStarMore && !isStarred}
          className={`flex w-full items-center gap-3 text-left transition-opacity ${
            !canStarMore && !isStarred ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className={`text-2xl ${isStarred ? 'text-accent-500' : 'text-neutral-300'}`}>
            {isStarred ? '★' : '☆'}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">
              Star {thirdPlaceTeam} as a wildcard 3rd-place pick
            </span>
            <span className="block text-xs text-neutral-500">
              Wildcards used: {totalStarred} of {WILDCARD_CAP}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function SortableRow({ id, position, team }: { id: string; position: number; team: Team }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 ${
        isDragging ? 'shadow-large' : 'shadow-soft'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag handle"
        className="touch-none cursor-grab text-neutral-400 active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold">
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{team.name}</div>
      </div>
      {team.fifaRank != null && (
        <div className="text-xs text-neutral-500 tabular-nums">
          #{team.fifaRank}
        </div>
      )}
    </li>
  );
}
