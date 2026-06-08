"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";

import type { GraphData, GraphNode } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphCanvasProps {
  data: GraphData;
  selectedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
}

const NODE_COLORS: Record<GraphNode["type"], string> = {
  Article: "#3b82f6",
  Thought: "#f59e0b",
  Tag: "#10b981",
};

export default function GraphCanvas({
  data,
  selectedNodeId,
  onNodeClick,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback(
    (node: object) => {
      onNodeClick(node as GraphNode);
    },
    [onNodeClick],
  );

  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = node as GraphNode & { x?: number; y?: number };
      const radius = graphNode.id === selectedNodeId ? 8 : 6;
      const color = NODE_COLORS[graphNode.type] ?? "#6b7280";

      if (graphNode.x == null || graphNode.y == null) return;

      ctx.beginPath();
      ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (graphNode.id === selectedNodeId) {
        ctx.strokeStyle = "#18181b";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      const label = graphNode.label;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#52525b";
      ctx.fillText(label.slice(0, 24), graphNode.x, graphNode.y + radius + 2);
    },
    [selectedNodeId],
  );

  return (
    <div ref={containerRef} className="h-full w-full bg-zinc-50 dark:bg-zinc-950">
      <ForceGraph2D
        graphData={data}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          const graphNode = node as GraphNode & { x?: number; y?: number };
          if (graphNode.x == null || graphNode.y == null) return;
          ctx.beginPath();
          ctx.arc(graphNode.x, graphNode.y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={handleNodeClick}
        linkColor={() => "#d4d4d8"}
        linkWidth={1}
        backgroundColor="transparent"
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
