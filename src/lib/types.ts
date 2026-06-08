export type NodeType = "Article" | "Thought" | "Tag";

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  type: NodeType;
  text?: string;
  content?: string;
  url?: string;
  name?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SaveArticleRequest {
  url: string;
  thoughts: string;
  tags: string[];
  adminSecret?: string;
}

export interface DeleteArticleRequest {
  articleId: string;
  adminSecret?: string;
}

export interface ScrapedArticle {
  title: string;
  textContent: string;
  excerpt: string;
}
