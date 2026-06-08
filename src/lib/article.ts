import type { ArticleComment } from "@/lib/types";

export function parseNeo4jDateTime(value: unknown): string | undefined {
  if (!value) return undefined;

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  if (typeof value === "object" && value !== null) {
    const str = String(value);
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  return undefined;
}

export function formatArticleDate(iso?: string): string | null {
  if (!iso) return null;

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function parseComments(raw: unknown): ArticleComment[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw as ArticleComment[];
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as ArticleComment[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}
