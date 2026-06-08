import type { ArticleComment } from "@/lib/types";

export interface TextSegment {
  text: string;
  comment?: ArticleComment;
}

export function buildHighlightedSegments(
  text: string,
  comments: ArticleComment[] = [],
): TextSegment[] {
  const withQuotes = comments.filter((c) => c.quote?.trim());
  if (!text || withQuotes.length === 0) {
    return [{ text: text || "" }];
  }

  type Range = { start: number; end: number; comment: ArticleComment };
  const ranges: Range[] = [];

  for (const comment of withQuotes) {
    const quote = comment.quote!.trim();
    let searchFrom = 0;

    while (searchFrom < text.length) {
      const index = text.indexOf(quote, searchFrom);
      if (index === -1) break;

      const overlaps = ranges.some(
        (r) => !(index + quote.length <= r.start || index >= r.end),
      );

      if (!overlaps) {
        ranges.push({ start: index, end: index + quote.length, comment });
        break;
      }

      searchFrom = index + 1;
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start < cursor) continue;

    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start) });
    }

    segments.push({
      text: text.slice(range.start, range.end),
      comment: range.comment,
    });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ text }];
}
