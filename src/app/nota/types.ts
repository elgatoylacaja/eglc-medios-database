export type BaseNode = {
  id: string;
  name: string;
  handle: string;
  viewCount: number;
  pageRank: number;
};

export type BaseEdge = {
  source: string;
  target: string;
  weight: number;
};

export type GraphNode = {
  id: string;
  name: string;
  handle: string;
  thumbnail: string;
  pageRank: number;
  viewCount: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  weight: number;
};

export type GraphCluster = {
  nodes: string[];
  id: string;
  color: string;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  positions: Positions;
};

export type Positions = Record<string, { x: number; y: number }>;
