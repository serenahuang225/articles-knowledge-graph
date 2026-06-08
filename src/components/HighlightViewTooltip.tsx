"use client";

import { Highlighter } from "lucide-react";
import { type RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useTimeTheme } from "@/components/TimeThemeProvider";
import { clampTooltipPosition } from "@/lib/tooltipPosition";
import type { ArticleComment } from "@/lib/types";

interface HighlightViewTooltipProps {
  comment: ArticleComment;
  top: number;
  left: number;
  containerRef?: RefObject<HTMLElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HighlightViewTooltip({
  comment,
  top,
  left,
  containerRef,
  onMouseEnter,
  onMouseLeave,
}: HighlightViewTooltipProps) {
  const theme = useTimeTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { left: clampedLeft, top: clampedTop } = clampTooltipPosition(
    left,
    top,
    containerRef?.current,
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className="theme-popover fixed z-[9998] w-72 rounded-lg border p-3 shadow-xl"
      style={{ top: clampedTop, left: clampedLeft }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
    >
      <div
        className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
        style={{ color: theme.highlight }}
      >
        <Highlighter className="h-3.5 w-3.5" />
        Highlight
      </div>

      {comment.quote && (
        <blockquote
          className="theme-text-muted mb-2 max-h-20 overflow-y-auto border-l-2 pl-2 text-xs italic"
          style={{ borderColor: theme.highlight }}
        >
          &ldquo;{comment.quote}&rdquo;
        </blockquote>
      )}

      <p className="theme-text whitespace-pre-wrap text-sm leading-relaxed">
        {comment.body}
      </p>

      <p className="theme-text-muted mt-2 text-xs">
        {formatDate(comment.createdAt)}
      </p>
    </div>,
    document.body,
  );
}
