export type NodeType = "Article" | "Tag";

export interface ArticleComment {
  id: string;
  body: string;
  quote?: string;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  type: NodeType;
  text?: string;
  thoughts?: string;
  comments?: ArticleComment[];
  url?: string;
  name?: string;
  tagNames?: string[];
  createdAt?: string;
  updatedAt?: string;
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

export interface AddCommentRequest {
  articleId: string;
  body: string;
  quote?: string;
  adminSecret?: string;
}

export interface AddTagsRequest {
  articleId: string;
  tags: string[];
  adminSecret?: string;
}

export interface ScrapedArticle {
  title: string;
  textContent: string;
  excerpt: string;
}
