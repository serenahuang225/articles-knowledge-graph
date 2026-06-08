"use client";

import {
  ChevronRight,
  ExternalLink,
  Highlighter,
  Loader2,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import HighlightedArticleText from "@/components/HighlightedArticleText";
import HighlightPopover, {
  type HighlightPopoverState,
} from "@/components/HighlightPopover";
import { useTimeTheme } from "@/components/TimeThemeProvider";
import { formatArticleDate } from "@/lib/article";
import { getArticleTagNames, getArticleUrl, getNeighbors } from "@/lib/graph";
import { computeTooltipLeft, computeTooltipTop } from "@/lib/tooltipPosition";
import type { ArticleComment, GraphData, GraphNode } from "@/lib/types";

interface ReaderSidebarProps {
  node: GraphNode | null;
  graphData: GraphData;
  onNeighborClick: (node: GraphNode) => void;
  onArticleDelete?: (articleId: string, adminSecret: string) => Promise<void>;
  onArticleUpdated?: (article: GraphNode) => void;
  onTagsAdded?: (articleId: string, tags: string[]) => void;
  deleting?: boolean;
}

function NodeTypeBadge({ type }: { type: GraphNode["type"] }) {
  const theme = useTimeTheme();
  const color =
    type === "Article" ? theme.graphArticle : theme.graphTag;

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: `color-mix(in srgb, ${color} 22%, transparent)`,
        color,
      }}
    >
      {type}
    </span>
  );
}

export default function ReaderSidebar({
  node,
  graphData,
  onNeighborClick,
  onArticleDelete,
  onArticleUpdated,
  onTagsAdded,
  deleting = false,
}: ReaderSidebarProps) {
  const theme = useTimeTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [adminSecret, setAdminSecret] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newTags, setNewTags] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [highlightPopup, setHighlightPopup] =
    useState<HighlightPopoverState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
    setActionError(null);
    setHighlightPopup(null);
    setCommentBody("");
    setNewTags("");
  }, [node?.id]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    function closeOnScroll() {
      setHighlightPopup(null);
    }

    scrollEl.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", closeOnScroll);
  }, []);

  if (!node) {
    return (
      <div className="theme-text-muted flex h-full items-center justify-center p-8 text-center">
        <p className="text-sm">Select a node on the graph to read its details.</p>
      </div>
    );
  }

  const neighbors = getNeighbors(node.id, graphData.nodes, graphData.links);
  const linkedArticles = neighbors.filter((n) => n.type === "Article");
  const linkedTags = neighbors.filter((n) => n.type === "Tag");
  const articleUrl = getArticleUrl(node);
  const isArticle = node.type === "Article";

  function handleTextSelected(quote: string, rect: DOMRect) {
    setHighlightPopup({
      quote,
      top: computeTooltipTop(rect),
      left: computeTooltipLeft(rect, scrollRef.current),
    });
    setCommentBody("");
  }

  async function handleAddComment(quote?: string) {
    if (!node || node.type !== "Article" || !commentBody.trim() || !adminSecret) {
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/article/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: node.id,
          body: commentBody,
          quote: quote ?? highlightPopup?.quote ?? undefined,
          adminSecret,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        comments?: ArticleComment[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to add comment");
      }

      onArticleUpdated?.({
        ...node,
        comments: payload.comments ?? node.comments,
      });
      setCommentBody("");
      setHighlightPopup(null);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to add comment",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddTags() {
    if (!node || node.type !== "Article" || !newTags.trim() || !adminSecret) {
      return;
    }

    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) return;

    setSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/article/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: node.id,
          tags,
          adminSecret,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to add tags");
      }

      onTagsAdded?.(node.id, tags);
      setNewTags("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add tags");
    } finally {
      setSubmitting(false);
    }
  }

  const tagNames = isArticle
    ? getArticleTagNames(node.id, graphData.nodes, graphData.links)
    : [];

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden">
      <header className="theme-border shrink-0 border-b px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <NodeTypeBadge type={node.type} />
          {isArticle && (node.comments?.length ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: theme.highlightBg,
                color: theme.fg,
              }}
            >
              <Highlighter className="h-3 w-3" />
              {node.comments!.length} highlight
              {node.comments!.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <h2 className="theme-text text-lg font-semibold leading-snug">
          {node.title}
        </h2>
        {isArticle && node.createdAt && (
          <p className="theme-text-muted mt-1 text-xs">
            Clipped {formatArticleDate(node.createdAt)}
          </p>
        )}
        {articleUrl && (
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="theme-link mt-2 inline-flex items-center gap-1 text-sm hover:underline"
          >
            Open source
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 overflow-y-auto overscroll-y-contain px-5 py-4"
      >
        <div className="space-y-6 pb-4">
          {isArticle && (
            <section>
              <h3 className="theme-section-label mb-2 text-xs font-medium uppercase tracking-wide">
                Article
              </h3>
              <HighlightedArticleText
                text={node.text ?? ""}
                comments={node.comments}
                scrollContainerRef={scrollRef}
                onTextSelected={handleTextSelected}
              />
              <p className="theme-text-muted mt-2 text-xs">
                Highlighted text uses a warm tint. Hover for comments, or select
                text to add a new highlight.
              </p>
            </section>
          )}

          {isArticle && node.thoughts && (
            <section className="theme-thought-box rounded-lg border p-4">
              <h3
                className="mb-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: theme.highlight }}
              >
                Your Thoughts
              </h3>
              <p className="theme-text whitespace-pre-wrap text-sm leading-relaxed">
                {node.thoughts}
              </p>
            </section>
          )}

          {(isArticle || node.type === "Tag" || linkedTags.length > 0) && (
            <section>
              <h3 className="theme-section-label mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {node.type === "Tag" ? (
                  <span className="theme-tag-pill rounded-full px-3 py-1 text-sm">
                    {node.name ?? node.label}
                  </span>
                ) : (
                  tagNames.map((name) => {
                    const tagNode = linkedTags.find(
                      (t) => (t.name ?? t.label) === name,
                    );
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => tagNode && onNeighborClick(tagNode)}
                        className="theme-tag-pill rounded-full px-3 py-1 text-sm transition hover:brightness-95"
                      >
                        {name}
                      </button>
                    );
                  })
                )}
              </div>

              {isArticle && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="new-tag, another-tag"
                    className="theme-input min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={submitting || !newTags.trim() || !adminSecret}
                    onClick={() => void handleAddTags()}
                    className="theme-accent flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              )}
            </section>
          )}

          {neighbors.length > 0 && node.type === "Tag" && (
            <section>
              <h3 className="theme-section-label mb-2 text-xs font-medium uppercase tracking-wide">
                Related Articles
              </h3>
              <ul className="space-y-2">
                {linkedArticles.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => onNeighborClick(article)}
                      className="theme-related-link group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition"
                    >
                      <span className="min-w-0 truncate">{article.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {actionError && (
            <p className="theme-error-text text-sm">{actionError}</p>
          )}
        </div>
      </div>

      {highlightPopup && (
        <HighlightPopover
          state={highlightPopup}
          comment={commentBody}
          containerRef={scrollRef}
          onCommentChange={setCommentBody}
          onSave={() => void handleAddComment(highlightPopup.quote)}
          onClose={() => {
            setHighlightPopup(null);
            setCommentBody("");
          }}
          submitting={submitting}
          needsAdminSecret={!adminSecret}
        />
      )}

      {isArticle && (
        <footer className="theme-border shrink-0 space-y-3 border-t px-5 py-4">
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Admin secret (required for edits)"
            autoComplete="off"
            className="theme-input w-full rounded-md border px-3 py-2 text-sm"
          />

          {showDeleteConfirm ? (
            <div className="space-y-2">
              <p className="theme-text-muted text-sm">
                Delete this article from the graph?
              </p>
              {deleteError && (
                <p className="theme-error-text text-sm">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={deleting || !adminSecret}
                  onClick={async () => {
                    setDeleteError(null);
                    try {
                      await onArticleDelete?.(node.id, adminSecret);
                      setShowDeleteConfirm(false);
                    } catch (err) {
                      setDeleteError(
                        err instanceof Error
                          ? err.message
                          : "Failed to delete article",
                      );
                    }
                  }}
                  className="theme-danger flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-60"
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
                    setDeleteError(null);
                  }}
                  className="theme-text theme-border rounded-md border px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="theme-danger-outline flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete article
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
