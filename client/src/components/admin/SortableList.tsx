import { useState } from "react";
import { GripVertical } from "lucide-react";

type SortableListProps<T extends { id: string }> = {
  items: T[];
  onReorder: (orderedIds: string[]) => void | Promise<void>;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
};

/** Drag-and-drop list — reorder by dragging the grip handle. */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setDragId(null);
    setOverId(null);
    await onReorder(next);
  };

  return (
    <div className={className ?? "space-y-2"}>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverId(item.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            void handleDrop(item.id);
          }}
          className={`rounded-lg border px-4 py-3 transition ${
            dragId === item.id
              ? "border-[var(--cyan)] opacity-60"
              : overId === item.id && dragId
                ? "border-[var(--cyan)] bg-[rgba(9,247,223,0.06)]"
                : "border-zinc-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 shrink-0 cursor-grab text-zinc-500 active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
