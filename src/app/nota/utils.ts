import { GraphCluster, GraphEdge, GraphNode, Positions } from "./types";
import * as d3 from "d3";

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

export const getSubNetwork = (handles: string[], edges: GraphEdge[]) => {
  const nodeEdges = edges.filter(
    (edge) =>
      handles.some((handle) => edge.source === handle) &&
      handles.some((handle) => edge.target === handle)
  );

  const nodesIds = handles;

  return { nodesIds, edgesIds: nodeEdges.map(getEdgeId) };
};

export const recenterPositions = (positions: Positions) => {
  const leftMost = Math.min(...Object.values(positions).map((_) => _.x));
  const topMost = Math.min(...Object.values(positions).map((_) => _.y));
  const rightMost = Math.max(...Object.values(positions).map((_) => _.x));
  const bottomMost = Math.max(...Object.values(positions).map((_) => _.y));

  const boxWidth = rightMost - leftMost;
  const boxHeight = bottomMost - topMost;
  const maxDimension = Math.max(boxWidth, boxHeight);

  const dx = (2000 - boxWidth) / 2 - leftMost - 1000;
  const dy = (2000 - boxHeight) / 2 - topMost - 1000;

  const scale = (2000 / maxDimension) * 0.9;

  return { dx, dy, scale };
};

export const revalPositions = (positions: Positions) => {
  const leftMost = Math.min(...Object.values(positions).map((_) => _.x));
  const topMost = Math.min(...Object.values(positions).map((_) => _.y));
  const rightMost = Math.max(...Object.values(positions).map((_) => _.x));
  const bottomMost = Math.max(...Object.values(positions).map((_) => _.y));

  const boxWidth = rightMost - leftMost;
  const boxHeight = bottomMost - topMost;
  const maxDimension = Math.max(boxWidth, boxHeight);

  const dx = (2000 - boxWidth) / 2 - leftMost - 1000;
  const dy = (2000 - boxHeight) / 2 - topMost - 1000;

  return Object.entries(positions).reduce((acc, [key, { x, y }]) => {
    return { ...acc, [key]: { x: x + dx, y: y + dy } };
  }, {} as Positions);
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

export function rScaleGenerator(nodes: GraphNode[], range: [number, number]) {
  return d3
    .scaleLinear()
    .domain([
      Math.min(...nodes.map((_) => _.pageRank)),
      Math.max(...nodes.map((_) => _.pageRank)),
    ])
    .range(range);
}

export function wScaleGenerator(edges: GraphEdge[], range: [number, number]) {
  return d3
    .scaleLinear()
    .domain([
      Math.min(...edges.map((_) => _.weight)),
      Math.max(...edges.map((_) => _.weight)),
    ])
    .range(range);
}
