"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTimeTheme } from "@/components/TimeThemeProvider";
import type { GraphData, GraphLink, GraphNode } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphCanvasProps {
  data: GraphData;
  selectedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
}

function normalizeLink(link: GraphLink | { source: unknown; target: unknown }) {
  const source = link.source;
  const target = link.target;
  return {
    source:
      typeof source === "string"
        ? source
        : ((source as SimulationNode).id ?? String(source)),
    target:
      typeof target === "string"
        ? target
        : ((target as SimulationNode).id ?? String(target)),
  };
}

function mergeGraphData(
  incoming: GraphData,
  previous: { nodes: SimulationNode[]; links: GraphLink[] },
): { nodes: SimulationNode[]; links: GraphLink[] } {
  const previousById = new Map(previous.nodes.map((node) => [node.id, node]));

  const nodes: SimulationNode[] = incoming.nodes.map((node) => {
    const prev = previousById.get(node.id);
    if (!prev) return { ...node };

    return {
      ...prev,
      ...node,
      x: prev.x,
      y: prev.y,
      vx: prev.vx,
      vy: prev.vy,
    };
  });

  const links = incoming.links.map((link) => ({ ...normalizeLink(link) }));

  return { nodes, links };
}

export default function GraphCanvas({
  data,
  selectedNodeId,
  onNodeClick,
}: GraphCanvasProps) {
  const theme = useTimeTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const nodeColors: Record<GraphNode["type"], string> = {
    Article: theme.graphArticle,
    Tag: theme.graphTag,
  };
  const graphRef = useRef<{ nodes: SimulationNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const graphData = useMemo(() => {
    const merged = mergeGraphData(data, graphRef.current);
    graphRef.current = merged;
    return merged;
  }, [data]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    function updateSize() {
      const { width, height } = element!.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    }

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const handleNodeClick = useCallback(
    (node: object) => {
      onNodeClick(node as GraphNode);
    },
    [onNodeClick],
  );

  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = node as SimulationNode;
      const radius = graphNode.id === selectedNodeId ? 8 : 6;
      const color = nodeColors[graphNode.type] ?? theme.accent;

      if (graphNode.x == null || graphNode.y == null) return;

      ctx.beginPath();
      ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (graphNode.id === selectedNodeId) {
        ctx.strokeStyle = theme.fg;
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      const label = graphNode.label;
      const fontSize = 12 / globalScale;
      ctx.font = `600 ${fontSize}px "Google Sans Flex", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = theme.fgMuted;
      ctx.fillText(label.slice(0, 24), graphNode.x, graphNode.y + radius + 2);
    },
    [selectedNodeId, nodeColors, theme.fg, theme.fgMuted],
  );

  return (
    <div
      ref={containerRef}
      className="theme-graph-bg absolute inset-0 touch-none"
    >
      {size.width > 0 && size.height > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const graphNode = node as SimulationNode;
            if (graphNode.x == null || graphNode.y == null) return;
            ctx.beginPath();
            ctx.arc(graphNode.x, graphNode.y, 12, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onNodeClick={handleNodeClick}
          onEngineStop={() => fgRef.current?.pauseAnimation()}
          linkColor={() => theme.graphLink}
          linkWidth={1}
          backgroundColor="transparent"
          cooldownTicks={80}
          d3AlphaDecay={0.05}
          d3VelocityDecay={0.5}
          warmupTicks={40}
        />
      )}
    </div>
  );
}
