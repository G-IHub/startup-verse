import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../ui/utils";
import { ScrollArea } from "../ui/scroll-area";
import { gridContainerClass } from "./callStyles";
import { getGridLayout } from "./getGridLayout";
import { getParticipantKey } from "./callParticipantUtils";
import ParticipantTile from "./ParticipantTile";

export default function ParticipantGrid({ participants, speakingSet }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1024, height: 768 });

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
    () => getGridLayout(participants.length, size),
    [participants.length, size],
  );

  const gridStyle = {
    gridTemplateColumns: layout.gridTemplateColumns,
    gridTemplateRows: layout.gridTemplateRows,
    justifyItems: layout.justifyItems,
    alignItems: layout.alignItems,
  };

  const gridContent = (
    <div
      className={cn(
        gridContainerClass(),
        layout.scrollable && "content-start",
      )}
      style={gridStyle}
    >
      {participants.map((participant, index) => {
        const key = getParticipantKey(participant);
        const span = layout.tileSpans[index];
        const spanStyle = span
          ? { gridColumn: span.col, gridRow: span.row }
          : undefined;
        const maxWidth = layout.maxTileWidth && index === 0 ? layout.maxTileWidth : undefined;

        return (
          <div
            key={`${key}-${participant.sid || index}`}
            style={{
              ...spanStyle,
              maxWidth,
              width: maxWidth ? "100%" : undefined,
            }}
            className="flex min-h-0 min-w-0 h-full w-full"
          >
            <ParticipantTile
              participant={participant}
              isSpeaking={speakingSet.has(key)}
              fillStage={participants.length === 1}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={containerRef} className="h-full w-full min-h-0">
      {layout.scrollable ? (
        <ScrollArea className="h-full w-full">{gridContent}</ScrollArea>
      ) : (
        gridContent
      )}
    </div>
  );
}
