import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../ui/utils";
import { gridContainerClass } from "./v2CallStyles";
import { getGridLayout } from "../getGridLayout";
import { getParticipantKey } from "../callParticipantUtils";
import V2ParticipantTile from "./V2ParticipantTile";

const MAX_PER_PAGE = 6;

export default function V2ParticipantGrid({ participants, speakingSet }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1024, height: 768 });
  const [page, setPage] = useState(0);

  // Clamp page whenever participant count changes
  const totalPages = Math.max(1, Math.ceil(participants.length / MAX_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const hasMultiplePages = participants.length > MAX_PER_PAGE;

  const visibleParticipants = participants.slice(
    safePage * MAX_PER_PAGE,
    (safePage + 1) * MAX_PER_PAGE,
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => getGridLayout(visibleParticipants.length, size),
    [visibleParticipants.length, size],
  );

  const gridStyle = {
    gridTemplateColumns: layout.gridTemplateColumns,
    gridTemplateRows: layout.gridTemplateRows,
    justifyItems: layout.justifyItems,
    alignItems: layout.alignItems,
  };

  const gridContent = (
    <div
      className={cn(gridContainerClass(), layout.scrollable && "content-start")}
      style={gridStyle}
    >
      {visibleParticipants.map((participant, index) => {
        const key = getParticipantKey(participant);
        const span = layout.tileSpans[index];
        const spanStyle = span ? { gridColumn: span.col, gridRow: span.row } : undefined;
        const maxWidth = layout.maxTileWidth && index === 0 ? layout.maxTileWidth : undefined;

        return (
          <div
            key={`${key}-${participant.sid || index}`}
            style={{ ...spanStyle, maxWidth, width: maxWidth ? "100%" : undefined }}
            className="flex min-h-0 min-w-0 h-full w-full"
          >
            <V2ParticipantTile
              participant={participant}
              isSpeaking={speakingSet.has(key)}
              fillStage={visibleParticipants.length === 1}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-0">
      {gridContent}

      {/* Page navigation — only shown when > 6 participants */}
      {hasMultiplePages && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity disabled:opacity-30 hover:bg-black/70"
            aria-label="Previous participants"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-black/50 px-2.5 py-0.5 font-body text-[11px] font-medium text-white backdrop-blur-sm">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity disabled:opacity-30 hover:bg-black/70"
            aria-label="Next participants"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
