"use client";

import {
  BookOpen,
  Loader2,
  Network,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import GraphCanvas from "@/components/GraphCanvas";
import ReaderSidebar from "@/components/ReaderSidebar";
import type { GraphData, GraphNode } from "@/lib/types";

type MobileView = "graph" | "sidebar";

function getNeighbors(
  nodeId: string,
  nodes: GraphNode[],
  links: GraphData["links"],
): GraphNode[] {
  const neighborIds = new Set<string>();

  for (const link of links) {
    if (link.source === nodeId) neighborIds.add(link.target);
    if (link.target === nodeId) neighborIds.add(link.source);
  }

  return nodes.filter((n) => neighborIds.has(n.id));
}

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("graph");
  const [deleting, setDeleting] = useState(false);

  const fetchGraph = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await fetch("/api/graph");
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to load graph");
      }
      const data = (await response.json()) as GraphData;
      setGraphData(data);
      if (options?.silent) {
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load graph";
      if (options?.silent) {
        throw new Error(message);
      }
      setError(message);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  const neighbors = useMemo(() => {
    if (!selectedNode) return [];
    return getNeighbors(selectedNode.id, graphData.nodes, graphData.links);
  }, [selectedNode, graphData]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setMobileView("sidebar");
  }, []);

  const handleArticleDelete = useCallback(
    async (articleId: string, adminSecret: string) => {
      setDeleting(true);

      try {
        const response = await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId, adminSecret }),
        });

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to delete article");
        }

        setSelectedNode(null);
        await fetchGraph({ silent: true });
      } finally {
        setDeleting(false);
      }
    },
    [fetchGraph],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Knowledge Graph
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 p-0.5 md:hidden dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setMobileView("graph")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobileView === "graph"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Graph
            </button>
            <button
              type="button"
              onClick={() => setMobileView("sidebar")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobileView === "sidebar"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Reader
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="hidden rounded-md p-2 text-zinc-600 transition hover:bg-zinc-100 md:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <section
          className={`relative min-h-0 ${
            sidebarOpen ? "w-full md:w-[60%]" : "w-full"
          } ${mobileView === "sidebar" ? "hidden md:block" : "block"}`}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading graph…
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => void fetchGraph()}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Retry
              </button>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-zinc-500">
              <BookOpen className="h-8 w-8 opacity-50" />
              <p className="text-sm">No nodes yet. Save an article via POST /api/save.</p>
            </div>
          ) : (
            <GraphCanvas
              data={graphData}
              selectedNodeId={selectedNode?.id ?? null}
              onNodeClick={handleNodeClick}
            />
          )}
        </section>

        {sidebarOpen && (
          <aside
            className={`flex h-full min-h-0 flex-col border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${
              mobileView === "graph" ? "hidden md:block" : "block"
            } w-full border-l md:w-[40%]`}
          >
            <ReaderSidebar
              node={selectedNode}
              neighbors={neighbors}
              onNeighborClick={handleNodeClick}
              onArticleDelete={handleArticleDelete}
              deleting={deleting}
            />
          </aside>
        )}
      </main>
    </div>
  );
}
