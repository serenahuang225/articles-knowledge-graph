import { NextResponse } from "next/server";

import { parseComments, parseNeo4jDateTime } from "@/lib/article";
import { getDriver } from "@/lib/neo4j";
import type { GraphData, GraphLink, GraphNode, NodeType } from "@/lib/types";

export const runtime = "nodejs";

function toNodeType(label: string): NodeType {
  if (label === "Article" || label === "Tag") {
    return label;
  }
  return "Article";
}

function mapNeo4jNode(record: Record<string, unknown>): GraphNode | null {
  const labels = (record.labels as string[]) ?? [];
  if (labels.includes("Thought")) return null;

  const type = toNodeType(labels[0] ?? "Article");
  const props = (record.properties as Record<string, unknown>) ?? {};
  const id = String(props.id ?? "");

  const label =
    type === "Article"
      ? String(props.title ?? id)
      : String(props.name ?? id);

  const title =
    type === "Article"
      ? String(props.title ?? id)
      : String(props.name ?? id);

  const createdAt =
    parseNeo4jDateTime(props.createdAt) ??
    parseNeo4jDateTime(props.updatedAt);
  const updatedAt = parseNeo4jDateTime(props.updatedAt);

  return {
    id,
    label,
    title,
    type,
    text: props.text ? String(props.text) : undefined,
    thoughts: props.thoughts ? String(props.thoughts) : undefined,
    comments: parseComments(props.comments),
    url: props.url ? String(props.url) : undefined,
    name: props.name ? String(props.name) : undefined,
    createdAt,
    updatedAt,
  };
}

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();

    try {
      await session.run(
        `
        MATCH (a:Article)-[:HAS_THOUGHT]->(t:Thought)
        SET a.thoughts = coalesce(nullif(a.thoughts, ''), t.content, '')
        DETACH DELETE t
        `,
      );

      await session.run(
        `
        MATCH (a:Article)
        WHERE a.createdAt IS NULL AND a.updatedAt IS NOT NULL
        SET a.createdAt = a.updatedAt
        `,
      );

      const nodesResult = await session.run(
        `
        MATCH (n)
        WHERE n.id IS NOT NULL AND NOT n:Thought
        RETURN n, labels(n) AS labels
        `,
      );

      const linksResult = await session.run(
        `
        MATCH (source)-[r]->(target)
        WHERE source.id IS NOT NULL
          AND target.id IS NOT NULL
          AND NOT source:Thought
          AND NOT target:Thought
        RETURN source.id AS source, target.id AS target
        `,
      );

      const nodes: GraphNode[] = nodesResult.records
        .map((record) =>
          mapNeo4jNode({
            properties: record.get("n").properties,
            labels: record.get("labels"),
          }),
        )
        .filter((node): node is GraphNode => node !== null);

      const links: GraphLink[] = linksResult.records.map((record) => ({
        source: record.get("source") as string,
        target: record.get("target") as string,
      }));

      const data: GraphData = { nodes, links };
      return NextResponse.json(data);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Graph fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch graph";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
