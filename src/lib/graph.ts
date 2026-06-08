import type { GraphNode } from "@/lib/types";

/** Resolve the article ID for delete — works for Article and linked Thought nodes. */
export function getArticleIdForDelete(node: GraphNode): string | null {
  if (node.type === "Article") {
    return node.id;
  }

  if (node.type === "Thought" && node.id.startsWith("thought-")) {
    return node.id.slice("thought-".length);
  }

  return null;
}
