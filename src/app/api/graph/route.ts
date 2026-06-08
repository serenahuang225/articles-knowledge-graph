import { NextResponse } from "next/server";

import { getDriver } from "@/lib/neo4j";
import type { GraphData, GraphLink, GraphNode, NodeType } from "@/lib/types";

export const runtime = "nodejs";

function toNodeType(label: string): NodeType {
  if (label === "Article" || label === "Thought" || label === "Tag") {
    return label;
  }
  return "Article";
}

function mapNeo4jNode(record: Record<string, unknown>): GraphNode {
  const labels = (record.labels as string[]) ?? [];
  const type = toNodeType(labels[0] ?? "Article");
  const props = (record.properties as Record<string, string>) ?? {};
  const id = props.id ?? "";

  const label =
    type === "Article"
      ? (props.title ?? id)
      : type === "Thought"
        ? (props.content?.slice(0, 50) ?? id)
        : (props.name ?? id);

  const title =
    type === "Article"
      ? (props.title ?? id)
      : type === "Thought"
        ? (props.content?.slice(0, 80) ?? id)
        : (props.name ?? id);

  return {
    id,
    label,
    title,
    type,
    text: props.text,
    content: props.content,
    url: props.url,
    name: props.name,
  };
}

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();

    try {
      const nodesResult = await session.run(
        `MATCH (n) WHERE n.id IS NOT NULL RETURN n, labels(n) AS labels`,
      );

      const linksResult = await session.run(
        `
        MATCH (source)-[r]->(target)
        WHERE source.id IS NOT NULL AND target.id IS NOT NULL
        RETURN source.id AS source, target.id AS target
        `,
      );

      const nodes: GraphNode[] = nodesResult.records.map((record) =>
        mapNeo4jNode({
          properties: record.get("n").properties,
          labels: record.get("labels"),
        }),
      );

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
