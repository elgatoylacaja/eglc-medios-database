import { GraphCluster, GraphEdge, GraphNode } from "./types";

const baseUrl = "https://docs.google.com/spreadsheets/d/e/";
const fileId =
  "2PACX-1vRRNppBwoxAzZ9tBHGqqTHg2MLMtW0Mo-mcoC8jGHbESGO-5wiWN6d5sZL2KdfeDGLd322hwhTnljM5";

export const years = {
  "2020": {
    nodesSheetId: "677810901",
    edgesSheetId: "43839818",
  },
  "2021": {
    nodesSheetId: "635774751",
    edgesSheetId: "1527399977",
  },
  "2022": {
    nodesSheetId: "1003326424",
    edgesSheetId: "252963566",
  },
  "2023": {
    nodesSheetId: "1153002303",
    edgesSheetId: "1055921138",
  },
  "2024": {
    nodesSheetId: "1628978198",
    edgesSheetId: "1242872346",
  },
} as const;

export type YearKey = keyof typeof years;

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

export function numberToLabel(n: number) {
  return n < 1_000
    ? n.toString()
    : n < 1_000_000
    ? `${Math.round(n / 1_000)}K`
    : `${Math.round(n / 1_000_000)}M`;
}
export const getNodeId = (node: GraphNode) => {
  return node.handle.replace("@", "");
};

export const getEdgeId = (edge: GraphEdge) => {
  return edge.source.replace("@", "") + "-" + edge.target.replace("@", "");
};

export const nodeInEdge = (handle: string, edge: GraphEdge) => {
  return edge.source === handle || edge.target === handle;
};

export const getNodeNetwork = (handle: string, edges: GraphEdge[]) => {
  const nodeEdges = edges.filter((edge) => nodeInEdge(handle, edge));

  const nodesIds = Array.from(
    new Set(nodeEdges.flatMap(({ source, target }) => [source, target]))
  );

  return { nodesIds, edgesIds: nodeEdges.map(getEdgeId) };
};

export const getDefaultHighlight = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: GraphCluster[] = []
) => {
  const fromEdges = nodes
    .filter((node) => edges.some((edge) => nodeInEdge(node.handle, edge)))
    .map((_) => _.handle);

  const fromClusters = clusters.map((cluster) => cluster.nodes).flat();

  return Array.from(new Set([...fromEdges, ...fromClusters]));
};
