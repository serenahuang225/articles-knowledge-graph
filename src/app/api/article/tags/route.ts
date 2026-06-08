import { type NextRequest, NextResponse } from "next/server";

import { isAuthorizedAdmin } from "@/lib/auth";
import { getDriver } from "@/lib/neo4j";
import type { AddTagsRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AddTagsRequest;

    if (!isAuthorizedAdmin(request, body.adminSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId, tags } = body;

    if (!articleId || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "articleId and tags are required" },
        { status: 400 },
      );
    }

    const tagList = tags.map((t) => t.trim()).filter(Boolean);

    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.executeWrite(async (tx) => {
        const articleCheck = await tx.run(
          `MATCH (a:Article {id: $articleId}) RETURN a.id AS id`,
          { articleId },
        );

        if (articleCheck.records.length === 0) {
          return null;
        }

        await tx.run(
          `
          MATCH (a:Article {id: $articleId})
          UNWIND $tags AS tagName
          MERGE (tag:Tag {id: toLower(trim(tagName))})
          SET tag.name = trim(tagName)
          MERGE (a)-[:TAGGED_WITH]->(tag)
          SET a.updatedAt = datetime()
          `,
          { articleId, tags: tagList },
        );

        const tagsResult = await tx.run(
          `
          MATCH (a:Article {id: $articleId})-[:TAGGED_WITH]->(tag:Tag)
          RETURN collect(tag.name) AS tagNames
          `,
          { articleId },
        );

        return tagsResult.records[0]?.get("tagNames") as string[];
      });

      if (!result) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, tags: result });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Add tags error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add tags";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
