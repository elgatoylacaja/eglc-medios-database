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

  const nodesIds = Array.from(
    new Set(nodeEdges.flatMap(({ source, target }) => [source, target]))
  );

  return { nodesIds, edgesIds: nodeEdges.map(getEdgeId) };
};

export const recenterPositions = (positions: Positions) => {
  return positions;
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
