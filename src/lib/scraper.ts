import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

import type { ScrapedArticle } from "@/lib/types";

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ArticleClipper/1.0; +https://github.com/article-clipper)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status}): ${url}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    throw new Error(`Could not extract readable content from: ${url}`);
  }

  return {
    title: article.title ?? url,
    textContent: article.textContent ?? "",
    excerpt: article.excerpt ?? "",
  };
}
