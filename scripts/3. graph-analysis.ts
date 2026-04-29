import { readFile, writeFile } from "fs/promises";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { pagerank } from "graphology-metrics/centrality";
import betweennessCentrality from "graphology-metrics/centrality/betweenness";
import closenessCentrality from "graphology-metrics/centrality/closeness";
import { eccentricity, weightedDegree } from "graphology-metrics/node";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { circular } from "graphology-layout";
import { createLogger } from "./logger";
import { extra_columns, nodes_base_columns, ranges } from "./0. common";

type Node = Record<(typeof nodes_base_columns)[number], string>;
type Edge = Record<"weight", number>;

const logger = createLogger();

async function loadGraph(period: string) {
  logger.info(`[${period}] - Loading graph`);
  const graph = new Graph<Node, Edge>();

  const nodes = await readFile(
    `./scripts/exports/${period}-nodes.tsv`,
    "utf-8",
  );
  nodes
    .split("\n")
    .slice(1)
    .filter((line) => line.trim())
    .forEach((line) => {
      const values = line.split("\t");
      const node: Node = nodes_base_columns.reduce((acc, column, index) => {
        return { ...acc, [column]: values[index] };
      }, {} as Node);
      graph.addNode(node.handle, node);
    });

  const edges = await readFile(
    `./scripts/exports/${period}-edges.tsv`,
    "utf-8",
  );
  edges
    .split("\n")
    .slice(1)
    .filter((line) => line.trim())
    .forEach((line) => {
      const [source, target, weight] = line.split("\t");
      graph.addUndirectedEdge(source, target, { weight: parseInt(weight) });
    });

  logger.info(
    `[${period}] - Loaded ${graph.order} nodes, ${graph.size} edges`,
  );
  return graph;
}

async function main(period: string) {
  const graph = await loadGraph(period);

  const closeness_scores = closenessCentrality(graph);
  const betweenness_scores = betweennessCentrality(graph);
  const page_rank = pagerank(graph, {
    alpha: 0.85,
    getEdgeWeight: "weight",
  });

  const communities = louvain.detailed(graph, {
    getEdgeWeight: "weight",
    resolution: 1,
    randomWalk: true,
  });

  circular.assign(graph);
  const positions = forceAtlas2(graph, {
    iterations: 50,
    settings: {
      gravity: 10,
      scalingRatio: 10_000,
    },
    getEdgeWeight: "weight",
  });

  const fullColumns = [...nodes_base_columns, ...extra_columns] as const;

  const lines = graph.mapNodes((node, attr) => {
    const node_full: Record<(typeof fullColumns)[number], string | number> = {
      ...attr,
      degree: graph.edges(node).length,
      weightedDegree: weightedDegree(graph, node),
      eccentricity: eccentricity(graph, node),
      closeness_centrality: closeness_scores[node].toString().replace(".", ","),
      betweenness_centrality: betweenness_scores[node]
        .toString()
        .replace(".", ","),
      page_rank: page_rank[node].toString().replace(".", ","),
      class: communities.communities[node],
      position_x: positions[node].x.toString().replace(".", ","),
      position_y: positions[node].y.toString().replace(".", ","),
    };
    return fullColumns.map((column) => node_full[column]).join("\t");
  });

  await writeFile(
    `./scripts/exports/${period}-nodes-attributes.tsv`,
    fullColumns.join("\t") + "\n" + lines.join("\n") + "\n",
  );
  logger.info(`[${period}] - Attributes file written`);
}

(async () => {
  for (const period of Object.keys(ranges)) {
    await main(period);
  }
  logger.info("All tasks have been processed");
})().catch((e) => {
  logger.error(e);
  process.exit(1);
});
