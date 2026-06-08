"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";

import HighlightViewTooltip from "@/components/HighlightViewTooltip";
import { buildHighlightedSegments } from "@/lib/highlights";
import { computeTooltipLeft, computeTooltipTop } from "@/lib/tooltipPosition";
import type { ArticleComment } from "@/lib/types";

interface HighlightedArticleTextProps {
  text: string;
  comments?: ArticleComment[];
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  onTextSelected: (quote: string, rect: DOMRect) => void;
}

interface HoverState {
  comment: ArticleComment;
  top: number;
  left: number;
}

export default function HighlightedArticleText({
  text,
  comments = [],
  scrollContainerRef,
  onTextSelected,
}: HighlightedArticleTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  const segments = useMemo(
    () => buildHighlightedSegments(text, comments),
    [text, comments],
  );

  useEffect(() => {
    const scrollEl = scrollContainerRef?.current;
    if (!scrollEl) return;

    function closeOnScroll() {
      setHovered(null);
    }

    scrollEl.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", closeOnScroll);
  }, [scrollContainerRef]);

  function clearHideTimeout() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }

  function scheduleHide() {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => setHovered(null), 200);
  }

  function showTooltip(element: HTMLElement, comment: ArticleComment) {
    clearHideTimeout();
    const rect = element.getBoundingClientRect();

    setHovered({
      comment,
      top: computeTooltipTop(rect),
      left: computeTooltipLeft(rect, scrollContainerRef?.current),
    });
  }

  function handleMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) return;

    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const quote = selection.toString().trim();
    if (!quote) return;

    onTextSelected(quote, range.getBoundingClientRect());
  }

  if (!text) {
    return (
      <p className="theme-text-muted text-sm">No article text available.</p>
    );
  }

  return (
    <>
      <p
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="theme-text select-text whitespace-pre-wrap text-sm leading-relaxed"
      >
        {segments.map((segment, index) =>
          segment.comment ? (
            <mark
              key={`${segment.comment.id}-${index}`}
              className="theme-highlight-mark cursor-pointer rounded-sm text-inherit transition-colors"
              onMouseEnter={(e) => showTooltip(e.currentTarget, segment.comment!)}
              onMouseLeave={scheduleHide}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`text-${index}`}>{segment.text}</span>
          ),
        )}
      </p>

      {hovered && (
        <HighlightViewTooltip
          comment={hovered.comment}
          top={hovered.top}
          left={hovered.left}
          containerRef={scrollContainerRef}
          onMouseEnter={clearHideTimeout}
          onMouseLeave={scheduleHide}
        />
      )}
    </>
  );
}
