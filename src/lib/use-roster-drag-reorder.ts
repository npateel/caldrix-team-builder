import { useState, type DragEvent } from "react";

// Drag-and-drop reordering mechanics for a list, decoupled from what the
// list actually contains -- callers get index positions and an
// insertion-line indicator; `onReorder(fromIndex, toIndex)` is only called
// for an actual position change (dropping back where you started, or right
// after yourself, is a no-op).
export function useRosterDragReorder(onReorder: (fromIndex: number, toIndex: number) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  // Updates `insertIndex` to whichever side of the hovered row the cursor is
  // on, so the drop line can show exactly where the drop will land.
  function handleDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (draggedIndex === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    setInsertIndex(isAfter ? index + 1 : index);
  }

  function resetDrag() {
    setDraggedIndex(null);
    setInsertIndex(null);
  }

  function handleDrop() {
    if (draggedIndex === null || insertIndex === null) {
      resetDrag();
      return;
    }
    let target = insertIndex;
    if (draggedIndex < insertIndex) target -= 1;
    if (target !== draggedIndex) onReorder(draggedIndex, target);
    resetDrag();
  }

  return { draggedIndex, insertIndex, handleDragStart, handleDragOver, handleDrop, resetDrag };
}
