export const TOOLTIP_WIDTH = 288;
export const TOOLTIP_TOP_OFFSET = 8;
const GAP = 12;
const EDGE_PADDING = 8;
const VIEWPORT_PADDING = 12;

interface TooltipBounds {
  left: number;
  right: number;
}

function getBounds(container?: HTMLElement | null): TooltipBounds {
  if (container) {
    const rect = container.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  }

  return {
    left: VIEWPORT_PADDING,
    right:
      typeof window !== "undefined"
        ? window.innerWidth - VIEWPORT_PADDING
        : VIEWPORT_PADDING + TOOLTIP_WIDTH,
  };
}

export function computeTooltipTop(targetRect: DOMRect): number {
  return targetRect.top + TOOLTIP_TOP_OFFSET;
}

/** Place a viewport-fixed tooltip beside a target within container bounds. */
export function computeTooltipLeft(
  targetRect: DOMRect,
  container?: HTMLElement | null,
  tooltipWidth = TOOLTIP_WIDTH,
): number {
  const bounds = getBounds(container);
  const rightPos = targetRect.right + GAP;
  const leftPos = targetRect.left - tooltipWidth - GAP;

  const spaceRight = bounds.right - targetRect.right - GAP;
  const spaceLeft = targetRect.left - bounds.left - GAP;

  if (spaceRight >= tooltipWidth) return rightPos;
  if (spaceLeft >= tooltipWidth) return leftPos;

  if (spaceLeft >= spaceRight) {
    return Math.max(bounds.left + EDGE_PADDING, leftPos);
  }

  return Math.min(bounds.right - tooltipWidth - EDGE_PADDING, rightPos);
}

export function clampTooltipPosition(
  left: number,
  top: number,
  container?: HTMLElement | null,
  tooltipWidth = TOOLTIP_WIDTH,
  tooltipHeight = 200,
): { left: number; top: number } {
  const bounds = getBounds(container);
  const minLeft = bounds.left + EDGE_PADDING;
  const maxLeft = Math.max(minLeft, bounds.right - tooltipWidth - EDGE_PADDING);
  const maxTop =
    typeof window !== "undefined"
      ? window.innerHeight - tooltipHeight - VIEWPORT_PADDING
      : top;

  return {
    left: Math.min(Math.max(left, minLeft), maxLeft),
    top: Math.min(Math.max(top, VIEWPORT_PADDING), maxTop),
  };
}
