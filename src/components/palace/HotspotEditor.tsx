import { useState, useRef, useEffect } from 'react';
import type { Room } from '../../types';
import { useRoomHotspots } from '../../hooks/useRoomHotspots';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import styles from './HotspotEditor.module.css';

interface HotspotEditorProps {
  palaceId: number;
  artworkUrl: string;
  rooms: Room[];
  onDone: () => void;
}

interface HotspotDraft {
  id?: number;
  roomId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

type DragMode = 'none' | 'creating' | 'moving' | 'resizing';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

export function HotspotEditor({ palaceId, artworkUrl, rooms, onDone }: HotspotEditorProps) {
  const { hotspots, addHotspot, deleteHotspot } = useRoomHotspots(palaceId);
  const containerRef = useRef<HTMLDivElement>(null);

  const [drafts, setDrafts] = useState<HotspotDraft[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [dragOriginal, setDragOriginal] = useState<HotspotDraft | null>(null);

  // Initialize drafts from existing hotspots
  useEffect(() => {
    setDrafts(
      hotspots.map((h) => ({
        id: h.id,
        roomId: h.roomId,
        x: h.x,
        y: h.y,
        width: h.width,
        height: h.height,
        label: h.label,
      }))
    );
  }, [hotspots]);

  const roomOptions = rooms.map((r) => ({
    value: String(r.id),
    label: r.name,
  }));

  function getRelativePosition(e: React.MouseEvent): { x: number; y: number } {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    // Only create new hotspot if clicking on empty space (not on a hotspot)
    if ((e.target as HTMLElement).closest(`.${styles.hotspot}`)) return;
    if ((e.target as HTMLElement).closest(`.${styles.handle}`)) return;

    const pos = getRelativePosition(e);
    setDragMode('creating');
    setDragStart(pos);
    setSelectedIndex(null);
    e.preventDefault();
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragMode === 'none' || !dragStart) return;

    const pos = getRelativePosition(e);

    if (dragMode === 'creating') {
      // Show a preview rectangle
      const x = Math.min(dragStart.x, pos.x);
      const y = Math.min(dragStart.y, pos.y);
      const width = Math.abs(pos.x - dragStart.x);
      const height = Math.abs(pos.y - dragStart.y);

      // Update the last draft (the one being created) or create temp
      setDrafts((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.roomId === -1 && !last.id) {
          // Update temp draft
          return [...prev.slice(0, -1), { ...last, x, y, width, height }];
        }
        // Create temp draft
        return [...prev, { roomId: -1, x, y, width, height }];
      });
    } else if (dragMode === 'moving' && selectedIndex !== null && dragOriginal) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      setDrafts((prev) =>
        prev.map((d, i) =>
          i === selectedIndex
            ? {
                ...d,
                x: Math.max(0, Math.min(100 - d.width, dragOriginal.x + dx)),
                y: Math.max(0, Math.min(100 - d.height, dragOriginal.y + dy)),
              }
            : d
        )
      );
    } else if (dragMode === 'resizing' && selectedIndex !== null && resizeHandle && dragOriginal) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      let { x, y, width, height } = dragOriginal;

      if (resizeHandle.includes('e')) {
        width = Math.max(5, width + dx);
      }
      if (resizeHandle.includes('w')) {
        const newX = Math.max(0, x + dx);
        width = Math.max(5, width - (newX - x));
        x = newX;
      }
      if (resizeHandle.includes('s')) {
        height = Math.max(5, height + dy);
      }
      if (resizeHandle.includes('n')) {
        const newY = Math.max(0, y + dy);
        height = Math.max(5, height - (newY - y));
        y = newY;
      }

      setDrafts((prev) =>
        prev.map((d, i) => (i === selectedIndex ? { ...d, x, y, width, height } : d))
      );
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (dragMode === 'creating' && dragStart) {
      const pos = getRelativePosition(e);
      const width = Math.abs(pos.x - dragStart.x);
      const height = Math.abs(pos.y - dragStart.y);

      if (width < 3 || height < 3) {
        // Too small, remove temp draft
        setDrafts((prev) => prev.filter((d) => !(d.roomId === -1 && !d.id)));
      } else {
        // Finalize the draft, select it
        const newIndex = drafts.length - 1;
        if (newIndex >= 0 && drafts[newIndex]?.roomId === -1) {
          setSelectedIndex(newIndex);
        }
      }
    }

    setDragMode('none');
    setDragStart(null);
    setResizeHandle(null);
    setDragOriginal(null);
  }

  function handleHotspotMouseDown(e: React.MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex(index);
    const pos = getRelativePosition(e);
    setDragMode('moving');
    setDragStart(pos);
    setDragOriginal({ ...drafts[index] });
  }

  function handleResizeMouseDown(e: React.MouseEvent, index: number, handle: ResizeHandle) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex(index);
    const pos = getRelativePosition(e);
    setDragMode('resizing');
    setDragStart(pos);
    setResizeHandle(handle);
    setDragOriginal({ ...drafts[index] });
  }

  function handleRoomChange(index: number, roomIdStr: string) {
    const roomId = Number(roomIdStr);
    const room = rooms.find((r) => r.id === roomId);
    setDrafts((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, roomId, label: room?.name } : d
      )
    );
  }

  function handleDeleteDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(null);
  }

  async function handleSave() {
    // Delete all existing hotspots for this palace
    for (const h of hotspots) {
      if (h.id) await deleteHotspot(h.id);
    }

    // Create all valid drafts
    for (const draft of drafts) {
      if (draft.roomId <= 0) continue; // Skip unassigned
      await addHotspot({
        palaceId,
        roomId: draft.roomId,
        x: draft.x,
        y: draft.y,
        width: draft.width,
        height: draft.height,
        label: draft.label,
      });
    }

    onDone();
  }

  const selectedDraft = selectedIndex !== null ? drafts[selectedIndex] : null;

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Edit Hotspots</span>
        <span className={styles.toolbarHint}>Click and drag on the image to create a hotspot</span>
        <div className={styles.toolbarActions}>
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Hotspots
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={artworkUrl} alt="Palace artwork" className={styles.artwork} draggable={false} />

        {drafts.map((draft, index) => (
          <div
            key={index}
            className={`${styles.hotspot} ${selectedIndex === index ? styles.hotspotSelected : ''} ${draft.roomId === -1 ? styles.hotspotUnassigned : ''}`}
            style={{
              left: `${draft.x}%`,
              top: `${draft.y}%`,
              width: `${draft.width}%`,
              height: `${draft.height}%`,
            }}
            onMouseDown={(e) => handleHotspotMouseDown(e, index)}
          >
            <span className={styles.hotspotLabel}>
              {draft.label || (draft.roomId === -1 ? 'Unassigned' : 'Room')}
            </span>

            {/* Resize handles */}
            {selectedIndex === index && (
              <>
                <div className={`${styles.handle} ${styles.handleNW}`} onMouseDown={(e) => handleResizeMouseDown(e, index, 'nw')} />
                <div className={`${styles.handle} ${styles.handleNE}`} onMouseDown={(e) => handleResizeMouseDown(e, index, 'ne')} />
                <div className={`${styles.handle} ${styles.handleSW}`} onMouseDown={(e) => handleResizeMouseDown(e, index, 'sw')} />
                <div className={`${styles.handle} ${styles.handleSE}`} onMouseDown={(e) => handleResizeMouseDown(e, index, 'se')} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected hotspot config panel */}
      {selectedDraft && selectedIndex !== null && (
        <div className={styles.configPanel}>
          <Select
            label="Assign Room"
            value={String(selectedDraft.roomId === -1 ? '' : selectedDraft.roomId)}
            onChange={(e) => handleRoomChange(selectedIndex, e.target.value)}
            options={[
              { value: '', label: 'Select a room...' },
              ...roomOptions,
            ]}
          />
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteDraft(selectedIndex)}
          >
            Delete Hotspot
          </Button>
        </div>
      )}
    </div>
  );
}
