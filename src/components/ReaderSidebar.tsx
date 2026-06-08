"use client";

import { ExternalLink, Loader2, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { getArticleIdForDelete } from "@/lib/graph";
import type { GraphNode } from "@/lib/types";

interface ReaderSidebarProps {
  node: GraphNode | null;
  neighbors: GraphNode[];
  onNeighborClick: (node: GraphNode) => void;
  onArticleDelete?: (articleId: string, adminSecret: string) => Promise<void>;
  deleting?: boolean;
}

function NodeTypeBadge({ type }: { type: GraphNode["type"] }) {
  const colors: Record<GraphNode["type"], string> = {
    Article: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    Thought: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    Tag: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type]}`}
    >
      {type}
    </span>
  );
}

export default function ReaderSidebar({
  node,
  neighbors,
  onNeighborClick,
  onArticleDelete,
  deleting = false,
}: ReaderSidebarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setAdminSecret("");
    setDeleteError(null);
  }, [node?.id]);

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
        <p className="text-sm">Select a node on the graph to read its details.</p>
      </div>
    );
  }

  const articleIdForDelete = getArticleIdForDelete(node);

  const linkedTags = neighbors.filter((n) => n.type === "Tag");
  const linkedThoughts = neighbors.filter((n) => n.type === "Thought");
  const linkedArticles = neighbors.filter((n) => n.type === "Article");
  const otherNeighbors = neighbors.filter(
    (n) => n.type !== "Tag" && n.type !== "Thought" && n.type !== "Article",
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="mb-2 flex items-center gap-2">
          <NodeTypeBadge type={node.type} />
        </div>
        <h2 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {node.title}
        </h2>
        {node.url && (
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Open source
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        {(node.type === "Article" || node.text) && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Scraped Article Text
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {node.text || "No article text available."}
            </p>
          </section>
        )}

        {(node.type === "Thought" || node.content) && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Your Thoughts
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {node.content || node.type !== "Thought"
                ? node.content
                : "No thoughts recorded."}
            </p>
          </section>
        )}

        {node.type === "Article" && linkedThoughts.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Your Thoughts
            </h3>
            {linkedThoughts.map((thought) => (
              <p
                key={thought.id}
                className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
              >
                {thought.content}
              </p>
            ))}
          </section>
        )}

        {(node.type === "Tag" || linkedTags.length > 0) && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {node.type === "Tag" ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {node.name ?? node.label}
                </span>
              ) : (
                linkedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onNeighborClick(tag)}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
                  >
                    {tag.name ?? tag.label}
                  </button>
                ))
              )}
            </div>
          </section>
        )}

        {neighbors.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Related Nodes
            </h3>
            <ul className="space-y-1">
              {[...linkedArticles, ...linkedThoughts, ...linkedTags, ...otherNeighbors]
                .filter((n) => n.id !== node.id)
                .map((neighbor) => (
                  <li key={neighbor.id}>
                    <button
                      type="button"
                      onClick={() => onNeighborClick(neighbor)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span className="font-medium">{neighbor.label}</span>
                      <span className="ml-2 text-xs text-zinc-400">
                        {neighbor.type}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>

      {articleIdForDelete && onArticleDelete && (
        <div className="shrink-0 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Delete this article and its thoughts from the graph?
              </p>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Admin secret"
                autoComplete="off"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-red-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {deleteError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={deleting || !adminSecret}
                  onClick={async () => {
                    setDeleteError(null);
                    try {
                      await onArticleDelete(articleIdForDelete, adminSecret);
                      setShowDeleteConfirm(false);
                      setAdminSecret("");
                    } catch (err) {
                      setDeleteError(
                        err instanceof Error
                          ? err.message
                          : "Failed to delete article",
                      );
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Confirm delete
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAdminSecret("");
                    setDeleteError(null);
                  }}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
              Delete article
            </button>
          )}
        </div>
      )}
    </div>
  );
}
