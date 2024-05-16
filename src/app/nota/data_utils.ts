import { Channel } from "@prisma/client";
import { UndirectedGraph } from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import noverlap from "graphology-layout-noverlap";
import { pagerank } from "graphology-metrics/centrality";
import prisma from "../../lib/prisma";
import { YearKey, years } from "./common";
import { BaseEdge, BaseNode, GraphData, GraphEdge, GraphNode } from "./types";
import { rScaleGenerator, revalPositions } from "./utils";

const baseUrl = "https://docs.google.com/spreadsheets/d/e/";
const fileId =
  "2PACX-1vRRNppBwoxAzZ9tBHGqqTHg2MLMtW0Mo-mcoC8jGHbESGO-5wiWN6d5sZL2KdfeDGLd322hwhTnljM5";
export const nodesUrlForYear = (year: YearKey) =>
  `${baseUrl}${fileId}/pub?gid=${years[year].nodesSheetId}&single=true&output=tsv`;
export const edgesUrlForYear = (year: YearKey) =>
  `${baseUrl}${fileId}/pub?gid=${years[year].edgesSheetId}&single=true&output=tsv`;

export function parse<T extends Record<string, string | number>>(
  data: string,
  separator = "\t"
) {
  const lines = data.split("\n").filter((line) => line.trim().length > 0);
  const header = lines[0].split(separator) as (keyof T)[];
  return lines.slice(1).map((line) => {
    const values = line.split(separator);
    const item: T = header.reduce((acc, key, index) => {
      const newKey = key.toString().replace("\r", "");
      const recordKey = ["Source", "Target"].includes(newKey)
        ? newKey.toLowerCase()
        : newKey;
      const value = values[index].replace("\r", "");
      return { ...acc, [recordKey]: value };
    }, {} as T);
    return item;
  });
}

export function fetchTsv<T extends Record<string, string | number>>(
  url: string
) {
  return fetch(url)
    .then((response) => response.text())
    .then((data) => parse<T>(data));
}

function createGraph(
  nodes: GraphNode[],
  edges: BaseEdge[],
  year: YearKey
): GraphData {
  const graph = new UndirectedGraph<GraphNode, GraphEdge>();

  if (year === "2021") {
    nodes
      .filter((n) => n.handle !== "@rosendogrobostreams")
      .forEach((node) => {
        graph.addNode(node.handle, node);
      });
    edges
      .filter((e) => {
        return (
          e.source !== "@rosendogrobostreams" &&
          e.target !== "@rosendogrobostreams"
        );
      })
      .forEach((edge) => {
        graph.addEdge(edge.source, edge.target, edge);
      });
  } else {
    nodes.forEach((node) => {
      graph.addNode(node.handle, node);
    });
    edges.forEach((edge) => {
      graph.addEdge(edge.source, edge.target, edge);
    });
  }

  pagerank.assign(graph, {
    alpha: 0.85,
    getEdgeWeight: "weight",
    nodePagerankAttribute: "pageRank",
  });

  circular.assign(graph, { center: 0.5, scale: 10 });

  const scalingRatio = {
    "2023": 0.15,
    "2020": 0.9,
  } as Partial<Record<YearKey, number>>;

  const forceAtlasPositions = forceAtlas2(graph, {
    iterations: 100,
    getEdgeWeight: "weight",
    settings: {
      scalingRatio: scalingRatio[year] || 0.65,
    },
  });

  const rScale = rScaleGenerator(nodes, [30, 140]);

  const noverlapPositions = noverlap(graph, {
    maxIterations: 50,
    inputReducer: (key, attr) => {
      const { x, y } = forceAtlasPositions[key];
      return {
        x,
        y,
        size: rScale(graph.getNodeAttribute(key, "pageRank")),
      };
    },
  });

  const positions = revalPositions(noverlapPositions);

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

export async function fetchYear(year: YearKey) {
  const { nodes, edges } = await fetchData(year);
  return [year, createGraph(nodes, edges, year)];
}
