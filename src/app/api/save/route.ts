import { type NextRequest, NextResponse } from "next/server";

import { isAuthorizedAdmin } from "@/lib/auth";
import { getDriver } from "@/lib/neo4j";
import { scrapeArticle } from "@/lib/scraper";
import type { SaveArticleRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveArticleRequest;

    if (!isAuthorizedAdmin(request, body.adminSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, thoughts, tags } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const scraped = await scrapeArticle(url);
    const articleId = url;

    const driver = getDriver();
    const session = driver.session();

    try {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `
          MERGE (a:Article {id: $articleId})
          ON CREATE SET a.createdAt = datetime()
          SET a.url = $url,
              a.title = $title,
              a.text = $text,
              a.thoughts = $thoughts,
              a.updatedAt = datetime()

          WITH a
          OPTIONAL MATCH (a)-[:HAS_THOUGHT]->(t:Thought)
          DETACH DELETE t

          WITH a
          UNWIND $tags AS tagName
          MERGE (tag:Tag {id: toLower(trim(tagName))})
          SET tag.name = trim(tagName)
          MERGE (a)-[:TAGGED_WITH]->(tag)
          `,
          {
            articleId,
            url,
            title: scraped.title,
            text: scraped.textContent,
            thoughts: thoughts ?? "",
            tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
          },
        );
      });
    } finally {
      await session.close();
    }

    return NextResponse.json({
      success: true,
      article: {
        id: articleId,
        title: scraped.title,
        url,
        tags,
      },
    });
  } catch (error) {
    console.error("Save article error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
