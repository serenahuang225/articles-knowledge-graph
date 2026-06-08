"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  showRight?: boolean;
}

export default function ResizableSplitPane({
  left,
  right,
  defaultLeftPercent = 60,
  minLeftPercent = 25,
  maxLeftPercent = 75,
  showRight = true,
}: ResizableSplitPaneProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const clampPercent = useCallback(
    (value: number) =>
      Math.min(maxLeftPercent, Math.max(minLeftPercent, value)),
    [maxLeftPercent, minLeftPercent],
  );

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(clampPercent(next));
    }

    function handleMouseUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [clampPercent]);

  function startDrag() {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  if (!showRight) {
    return (
      <div ref={containerRef} className="flex h-full min-h-0 flex-1">
        <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden">
          {left}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-1 overflow-hidden"
    >
      <div
        className="relative h-full min-h-0 min-w-0 shrink-0 overflow-hidden"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPercent)}
        onMouseDown={startDrag}
        className="theme-resize-handle relative z-20 w-1.5 shrink-0 cursor-col-resize transition-colors"
      />

      <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
