import { type NextRequest, NextResponse } from "next/server";

import { parseComments } from "@/lib/article";
import { isAuthorizedAdmin } from "@/lib/auth";
import { getDriver } from "@/lib/neo4j";
import type { AddCommentRequest, ArticleComment } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AddCommentRequest;

    if (!isAuthorizedAdmin(request, body.adminSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId, body: commentBody, quote } = body;

    if (!articleId || !commentBody?.trim()) {
      return NextResponse.json(
        { error: "articleId and body are required" },
        { status: 400 },
      );
    }

    const comment: ArticleComment = {
      id: crypto.randomUUID(),
      body: commentBody.trim(),
      quote: quote?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.executeWrite(async (tx) => {
        const existing = await tx.run(
          `MATCH (a:Article {id: $articleId}) RETURN a.comments AS comments`,
          { articleId },
        );

        if (existing.records.length === 0) {
          return null;
        }

        const comments = parseComments(existing.records[0].get("comments"));
        comments.push(comment);

        await tx.run(
          `
          MATCH (a:Article {id: $articleId})
          SET a.comments = $comments, a.updatedAt = datetime()
          `,
          { articleId, comments: JSON.stringify(comments) },
        );

        return comments;
      });

      if (!result) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, comments: result });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Add comment error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add comment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
