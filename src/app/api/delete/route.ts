import { type NextRequest, NextResponse } from "next/server";

import { isAuthorizedAdmin } from "@/lib/auth";
import { getDriver } from "@/lib/neo4j";
import type { DeleteArticleRequest } from "@/lib/types";

export const runtime = "nodejs";

async function deleteArticle(request: NextRequest) {
  const body = (await request.json()) as DeleteArticleRequest;

  if (!isAuthorizedAdmin(request, body.adminSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = body;

  if (!articleId || typeof articleId !== "string") {
    return NextResponse.json(
      { error: "articleId is required" },
      { status: 400 },
    );
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    const result = await session.executeWrite(async (tx) => {
      const deleteResult = await tx.run(
        `
        MATCH (a:Article {id: $articleId})
        OPTIONAL MATCH (a)-[:HAS_THOUGHT]->(t:Thought)
        WITH a, collect(t) AS thoughts
        FOREACH (thought IN thoughts | DETACH DELETE thought)
        DETACH DELETE a
        RETURN count(a) AS deleted
        `,
        { articleId },
      );

      await tx.run(
        `
        MATCH (tag:Tag)
        WHERE NOT (tag)--()
        DELETE tag
        `,
      );

      return deleteResult.records[0]?.get("deleted")?.toNumber() ?? 0;
    });

    if (result === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } finally {
    await session.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    return await deleteArticle(request);
  } catch (error) {
    console.error("Delete article error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await deleteArticle(request);
  } catch (error) {
    console.error("Delete article error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
