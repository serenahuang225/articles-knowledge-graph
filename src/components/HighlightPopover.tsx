"use client";

import { Highlighter, Loader2, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useTimeTheme } from "@/components/TimeThemeProvider";
import { clampTooltipPosition } from "@/lib/tooltipPosition";

export interface HighlightPopoverState {
  quote: string;
  top: number;
  left: number;
}

interface HighlightPopoverProps {
  state: HighlightPopoverState;
  comment: string;
  containerRef?: RefObject<HTMLElement | null>;
  onCommentChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  submitting: boolean;
  needsAdminSecret: boolean;
}

export default function HighlightPopover({
  state,
  comment,
  containerRef,
  onCommentChange,
  onSave,
  onClose,
  submitting,
  needsAdminSecret,
}: HighlightPopoverProps) {
  const theme = useTimeTheme();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const { left, top } = clampTooltipPosition(
    state.left,
    state.top,
    containerRef?.current,
    288,
    220,
  );

  if (!mounted) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="theme-popover fixed z-[9998] w-72 rounded-lg border p-3 shadow-xl"
      style={{ top, left }}
      role="dialog"
      aria-label="Add highlight comment"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: theme.highlight }}
        >
          <Highlighter className="h-3.5 w-3.5" />
          Highlight
        </div>
        <button
          type="button"
          onClick={onClose}
          className="theme-text-muted theme-hover rounded p-0.5"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <blockquote
        className="theme-text-muted mb-3 max-h-20 overflow-y-auto border-l-2 pl-2 text-xs italic"
        style={{ borderColor: theme.highlight }}
      >
        &ldquo;{state.quote.slice(0, 200)}
        {state.quote.length > 200 ? "…" : ""}&rdquo;
      </blockquote>

      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Your comment on this highlight…"
        className="theme-input w-full rounded-md border px-2.5 py-2 text-sm"
      />

      {needsAdminSecret && (
        <p className="mt-2 text-xs" style={{ color: theme.highlight }}>
          Enter admin secret in the footer to save.
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={submitting || !comment.trim() || needsAdminSecret}
          onClick={onSave}
          className="theme-accent flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Highlighter className="h-3.5 w-3.5" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="theme-text-muted theme-border rounded-md border px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
