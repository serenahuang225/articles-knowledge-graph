import type { GraphData, GraphLink, GraphNode } from "@/lib/types";

export function normalizeLinkId(
  endpoint: string | GraphNode | number | undefined,
): string {
  if (endpoint == null) return "";
  if (typeof endpoint === "string") return endpoint;
  if (typeof endpoint === "number") return String(endpoint);
  return endpoint.id;
}

export function getArticleUrl(node: GraphNode): string | null {
  if (node.type === "Article") {
    return node.url ?? node.id;
  }
  return null;
}

export function getNeighbors(
  nodeId: string,
  nodes: GraphNode[],
  links: GraphLink[],
): GraphNode[] {
  const neighborIds = new Set<string>();

  for (const link of links) {
    const source = normalizeLinkId(link.source);
    const target = normalizeLinkId(link.target);

    if (source === nodeId) neighborIds.add(target);
    if (target === nodeId) neighborIds.add(source);
  }

  return nodes.filter((n) => neighborIds.has(n.id));
}

export function getArticleTagNames(
  articleId: string,
  nodes: GraphNode[],
  links: GraphLink[],
): string[] {
  return getNeighbors(articleId, nodes, links)
    .filter((n) => n.type === "Tag")
    .map((n) => n.name ?? n.label);
}

/** Remove an article and any orphaned tags from local graph state. */
export function removeArticleFromGraph(
  data: GraphData,
  articleId: string,
): GraphData {
  const idsToRemove = new Set([articleId]);

  const links = data.links.filter((link) => {
    const source = normalizeLinkId(link.source);
    const target = normalizeLinkId(link.target);
    return !idsToRemove.has(source) && !idsToRemove.has(target);
  });

  const connectedIds = new Set<string>();
  for (const link of links) {
    connectedIds.add(normalizeLinkId(link.source));
    connectedIds.add(normalizeLinkId(link.target));
  }

  const nodes = data.nodes.filter((node) => {
    if (idsToRemove.has(node.id)) return false;
    if (node.type === "Tag" && !connectedIds.has(node.id)) return false;
    return true;
  });

  return { nodes, links };
}

export function updateArticleInGraph(
  data: GraphData,
  articleId: string,
  updates: Partial<GraphNode>,
): GraphData {
  return {
    ...data,
    nodes: data.nodes.map((node) =>
      node.id === articleId ? { ...node, ...updates } : node,
    ),
  };
}

export function addTagsToArticleInGraph(
  data: GraphData,
  articleId: string,
  newTags: string[],
): GraphData {
  const nodes = [...data.nodes];
  const links = [...data.links];

  for (const tagName of newTags) {
    const tagId = tagName.toLowerCase().trim();
    if (!tagId) continue;

    if (!nodes.some((n) => n.id === tagId)) {
      nodes.push({
        id: tagId,
        label: tagName.trim(),
        title: tagName.trim(),
        type: "Tag",
        name: tagName.trim(),
      });
    }

    const linkExists = links.some(
      (l) =>
        normalizeLinkId(l.source) === articleId &&
        normalizeLinkId(l.target) === tagId,
    );

    if (!linkExists) {
      links.push({ source: articleId, target: tagId });
    }
  }

  return { nodes, links };
}
