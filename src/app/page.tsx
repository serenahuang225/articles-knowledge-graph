"use client";

import {
  BookOpen,
  Info,
  LayoutList,
  Loader2,
  Network,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ArticleListView from "@/components/ArticleListView";
import GraphCanvas from "@/components/GraphCanvas";
import ReaderSidebar from "@/components/ReaderSidebar";
import ResizableSplitPane from "@/components/ResizableSplitPane";
import { useTimeTheme } from "@/components/TimeThemeProvider";
import { addTagsToArticleInGraph, removeArticleFromGraph } from "@/lib/graph";
import type { GraphData, GraphNode } from "@/lib/types";

type MainView = "graph" | "list";
type MobileView = "graph" | "list" | "sidebar";

export default function Home() {
  const theme = useTimeTheme();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mainView, setMainView] = useState<MainView>("graph");
  const [mobileView, setMobileView] = useState<MobileView>("graph");
  const [deleting, setDeleting] = useState(false);

  const articles = useMemo(() => {
    return graphData.nodes
      .filter((n) => n.type === "Article")
      .map((article) =>
        selectedNode?.id === article.id
          ? { ...article, ...selectedNode }
          : article,
      );
  }, [graphData.nodes, selectedNode]);

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

      setSelectedNode((current) => {
        if (!current) return null;
        return data.nodes.find((n) => n.id === current.id) ?? null;
      });

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

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setMobileView("sidebar");
  }, []);

  const handleArticleSelect = useCallback(
    (article: GraphNode) => {
      setSelectedNode(article);
      setMobileView("sidebar");
    },
    [],
  );

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
        setGraphData((prev) => removeArticleFromGraph(prev, articleId));
        void fetchGraph({ silent: true });
      } finally {
        setDeleting(false);
      }
    },
    [fetchGraph],
  );

  const handleArticleUpdated = useCallback((article: GraphNode) => {
    // Comments only affect the sidebar — skip graphData updates to preserve layout.
    setSelectedNode(article);
  }, []);

  const handleTagsAdded = useCallback((articleId: string, tags: string[]) => {
    setGraphData((prev) => addTagsToArticleInGraph(prev, articleId, tags));
    void fetchGraph({ silent: true });
  }, [fetchGraph]);

  const loadingPanel = (
    <div className="theme-text-muted flex h-full items-center justify-center">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading…
    </div>
  );

  const errorPanel = (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm" style={{ color: theme.danger }}>
        {error}
      </p>
      <button
        type="button"
        onClick={() => void fetchGraph()}
        className="theme-accent rounded-md px-4 py-2 text-sm"
      >
        Retry
      </button>
    </div>
  );

  const graphPanel = (
    <section className="relative h-full min-h-0 flex-1 overflow-hidden">
      {loading
        ? loadingPanel
        : error
          ? errorPanel
          : graphData.nodes.length === 0
            ? (
                <div className="theme-text-muted flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <BookOpen className="h-8 w-8 opacity-50" />
                  <p className="text-sm">
                    No nodes yet. Clip an article with your bookmarklet.
                  </p>
                </div>
              )
            : (
                <GraphCanvas
                  data={graphData}
                  selectedNodeId={selectedNode?.id ?? null}
                  onNodeClick={handleNodeClick}
                />
              )}
    </section>
  );

  const listPanel = (
    <section className="theme-surface relative h-full min-h-0 flex-1 overflow-hidden">
      {loading
        ? loadingPanel
        : error
          ? errorPanel
          : (
              <ArticleListView
                articles={articles}
                graphData={graphData}
                selectedId={selectedNode?.id ?? null}
                onSelect={handleArticleSelect}
              />
            )}
    </section>
  );

  const mainPanel = mainView === "graph" ? graphPanel : listPanel;

  const sidebarPanel = (
    <ReaderSidebar
      node={selectedNode}
      graphData={graphData}
      onNeighborClick={handleNodeClick}
      onArticleDelete={handleArticleDelete}
      onArticleUpdated={handleArticleUpdated}
      onTagsAdded={handleTagsAdded}
      deleting={deleting}
    />
  );

  return (
    <div className="theme-page flex h-dvh flex-col">
      <header className="theme-surface theme-border relative z-[9999] flex shrink-0 items-center justify-between overflow-visible border-b px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5" style={{ color: theme.accent }} />
          <h1 className="theme-text text-base font-semibold">
            Serena's Knowledge Graph
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="theme-border flex rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => {
                setMainView("graph");
                setMobileView("graph");
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mainView === "graph" ? "theme-btn-active" : "theme-btn-idle"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Graph</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMainView("list");
                setMobileView("list");
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mainView === "list" ? "theme-btn-active" : "theme-btn-idle"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Articles</span>
            </button>
          </div>

          <div className="theme-border flex rounded-lg border p-0.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileView("sidebar")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobileView === "sidebar" ? "theme-btn-active" : "theme-btn-idle"
              }`}
            >
              Reader
            </button>
          </div>

          <div className="group relative">
            <a
              href="https://github.com/serenahuang225"
              target="_blank"
              rel="noopener noreferrer"
              className="theme-btn-idle theme-hover inline-flex rounded-md p-2 transition"
              aria-label="Made with love by Serena Huang"
            >
              <Info className="h-4 w-4" />
            </a>
            <span className="theme-surface theme-border theme-text pointer-events-none absolute right-0 top-full z-[9999] mt-1 hidden whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs shadow-lg group-hover:block group-focus-within:block">
              Made with ❤️ by{" "}
              <span className="font-semibold">Serena Huang</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="theme-btn-idle theme-hover hidden rounded-md p-2 transition md:inline-flex"
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

      <main className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="hidden min-h-0 flex-1 md:flex">
          <ResizableSplitPane
            showRight={sidebarOpen}
            defaultLeftPercent={60}
            left={mainPanel}
            right={
              <aside className="theme-surface h-full min-h-0 overflow-hidden backdrop-blur-sm">
                {sidebarPanel}
              </aside>
            }
          />
        </div>

        <div
          className={`min-h-0 flex-1 md:hidden ${
            mobileView === "sidebar" ? "hidden" : "flex"
          }`}
        >
          {mainView === "graph" ? graphPanel : listPanel}
        </div>

        {sidebarOpen && mobileView === "sidebar" && (
          <aside className="theme-surface flex min-h-0 flex-1 overflow-hidden backdrop-blur-sm md:hidden">
            {sidebarPanel}
          </aside>
        )}
      </main>
    </div>
  );
}
