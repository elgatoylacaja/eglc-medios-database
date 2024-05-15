import { Channel } from "@prisma/client";
import { UndirectedGraph } from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { pagerank } from "graphology-metrics/centrality";
import prisma from "../../lib/prisma";
import { keys } from "../../lib/utils";
import {
  YearKey,
  edgesUrlForYear,
  fetchTsv,
  nodesUrlForYear,
  years,
} from "./common";
import Interactive from "./Interactive";
import { BaseEdge, BaseNode, GraphData, GraphEdge, GraphNode } from "./types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "La gente es maravillosa",
  description: 'Pasado y presente de los nuevos medios digitales en Argentina'
}

function createGraph(
  nodes: GraphNode[],
  edges: BaseEdge[],
  year: YearKey
): GraphData {
  const graph = new UndirectedGraph<GraphNode, GraphEdge>();

  nodes.forEach((node) => {
    graph.addNode(node.handle, node);
  });
  edges.forEach((edge) => {
    graph.addEdge(edge.source, edge.target, edge);
  });

  pagerank.assign(graph, {
    alpha: 0.85,
    getEdgeWeight: "weight",
    nodePagerankAttribute: "pageRank",
  });

  circular.assign(graph, { center: 0.5, scale: 10 });

  const positions = forceAtlas2(graph, {
    iterations: 100,
    getEdgeWeight: "weight",
    settings: {
      scalingRatio: year === "2023" ? 0.15 : 0.65,
    },
  });

  const graphNodes = graph.nodes().map((n) => graph.getNodeAttributes(n));
  const graphEdges = graph.edges().map((e) => graph.getEdgeAttributes(e));
  return { nodes: graphNodes, edges: graphEdges, positions };
}

async function fetchData(year: YearKey) {
  const nodesUrl = nodesUrlForYear(year);
  const edgesUrl = edgesUrlForYear(year);

  const baseNodes = await fetchTsv<BaseNode>(nodesUrl).then((ns) =>
    ns.map((n) => ({
      ...n,
      viewCount: parseInt(n.viewCount.toString()),
      pageRank: 0,
    }))
  );
  const edges = await fetchTsv<BaseEdge>(edgesUrl).then((es) =>
    es.map((e) => ({ ...e, weight: parseInt(e.weight.toString()) }))
  );

  const dbNodes: Channel[] = await prisma.channel.findMany({
    where: {
      handle: {
        in: baseNodes.map((node) => node.handle),
      },
    },
  });

  const nodes: GraphNode[] = dbNodes.map((node) => {
    const { id, name, handle, thumbnail } = node;
    const { viewCount, pageRank } = baseNodes.find((n) => n.handle === handle)!;
    return {
      id,
      name,
      handle,
      thumbnail,
      viewCount,
      pageRank,
    };
  });

  return { nodes, edges };
}

async function fetchYear(year: YearKey) {
  const { nodes, edges } = await fetchData(year);
  return [year, createGraph(nodes, edges, year)];
}

export default async function Page() {
  const tuples = await Promise.all(keys(years).map(fetchYear));
  const data: Record<YearKey, GraphData> = Object.fromEntries(tuples);

  return <Interactive data={data} />;
}
