"use client";

import { BookOpen, Highlighter, Tag } from "lucide-react";

import { useTimeTheme } from "@/components/TimeThemeProvider";
import { formatArticleDate } from "@/lib/article";
import { getArticleTagNames } from "@/lib/graph";
import type { GraphData, GraphNode } from "@/lib/types";

interface ArticleListViewProps {
  articles: GraphNode[];
  graphData: GraphData;
  selectedId: string | null;
  onSelect: (article: GraphNode) => void;
}

export default function ArticleListView({
  articles,
  graphData,
  selectedId,
  onSelect,
}: ArticleListViewProps) {
  const theme = useTimeTheme();

  if (articles.length === 0) {
    return (
      <div className="theme-text-muted flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <BookOpen className="h-8 w-8 opacity-50" />
        <p className="text-sm">No clipped articles yet.</p>
      </div>
    );
  }

  const sorted = [...articles].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );

  return (
    <div className="h-full overflow-y-auto">
      <ul className="theme-border divide-y">
        {sorted.map((article) => {
          const tags = getArticleTagNames(
            article.id,
            graphData.nodes,
            graphData.links,
          );
          const highlightCount = article.comments?.length ?? 0;
          const isSelected = selectedId === article.id;
          const clippedDate = formatArticleDate(article.createdAt);
          const updatedDate = formatArticleDate(article.updatedAt);

          return (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onSelect(article)}
                className={`w-full px-5 py-4 text-left transition ${
                  isSelected ? "theme-surface-muted" : "theme-hover"
                }`}
                style={
                  isSelected
                    ? { boxShadow: `inset 3px 0 0 ${theme.accent}` }
                    : undefined
                }
              >
                <div className="flex gap-4">
                  {(clippedDate || updatedDate) && (
                    <div className="theme-text-muted w-24 shrink-0 space-y-1 text-xs leading-snug">
                      {clippedDate && (
                        <p>
                          <span className="block text-[10px] font-medium uppercase tracking-wide opacity-70">
                            Clipped
                          </span>
                          {clippedDate}
                        </p>
                      )}
                      {updatedDate && (
                        <p>
                          <span className="block text-[10px] font-medium uppercase tracking-wide opacity-70">
                            Updated
                          </span>
                          {updatedDate}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-sm font-semibold leading-snug"
                      style={{ color: isSelected ? theme.accent : theme.fg }}
                    >
                      {article.title}
                    </h3>

                    {article.url && (
                      <p className="theme-text-muted mt-1 truncate text-xs">
                        {article.url}
                      </p>
                    )}

                    {article.thoughts && (
                      <p className="theme-text-muted mt-2 line-clamp-2 text-sm">
                        {article.thoughts}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="theme-tag-pill inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                      {highlightCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                          style={{
                            background: theme.highlightBg,
                            color: theme.fg,
                          }}
                        >
                          <Highlighter className="h-3 w-3" />
                          {highlightCount} highlight
                          {highlightCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
