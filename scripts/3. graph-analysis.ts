import { appendFile, readFile, writeFile } from "fs/promises";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { pagerank } from "graphology-metrics/centrality";
import betweennessCentrality from "graphology-metrics/centrality/betweenness";
import closenessCentrality from "graphology-metrics/centrality/closeness";
import { eccentricity, weightedDegree } from "graphology-metrics/node";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { circular } from "graphology-layout";
import { extra_columns, nodes_base_columns } from "./0. common";

type Node = Record<(typeof nodes_base_columns)[number], string>;
type Edge = Record<"weight", number>;

async function loadGraph(PERIOD: string) {
  console.log(`Loading graph for ${PERIOD} ...`);
  const graph = new Graph<Node, Edge>();

  // Load nodes
  const nodes = await readFile(
    `./scripts/exports/${PERIOD}-nodes.tsv`,
    "utf-8"
  );

  nodes
    .split("\n")
    .slice(1)
    .forEach((line) => {
      if (line) {
        const values = line.split("\t");
        const node: Node = nodes_base_columns.reduce((acc, column, index) => {
          return { ...acc, [column]: values[index] };
        }, {} as Node);
        graph.addNode(node.handle, node);
      }
    });

  // Load edges
  const edges = await readFile(
    `./scripts/exports/${PERIOD}-edges.tsv`,
    "utf-8"
  );
  edges
    .split("\n")
    .slice(1)
    .forEach((line) => {
      if (line) {
        const [source, target, weight] = line.split("\t");
        graph.addUndirectedEdge(source, target, { weight: parseInt(weight) });
      }
    });

  return graph;
}

async function main(PERIOD: string) {
  const graph = await loadGraph(PERIOD);

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
  await writeFile(
    `./scripts/exports/${PERIOD}-nodes-attributes.tsv`,
    fullColumns.join("\t") + "\n"
  );

  const promises = graph.mapNodes((node, attr) => {
    const w_degree = weightedDegree(graph, node);
    const degree = graph.edges(node).length;
    const e = eccentricity(graph, node);
    const node_full: Record<(typeof fullColumns)[number], string | number> = {
      ...attr,
      degree,
      weightedDegree: w_degree, // int
      eccentricity: e, // int
      closeness_centrality: closeness_scores[node].toString().replace(".", ","),
      betweenness_centrality: betweenness_scores[node]
        .toString()
        .replace(".", ","),
      page_rank: page_rank[node].toString().replace(".", ","),
      class: communities.communities[node], // int
      position_x: positions[node].x.toString().replace(".", ","),
      position_y: positions[node].y.toString().replace(".", ","),
    };

    return () =>
      appendFile(
        `./scripts/exports/${PERIOD}-nodes-attributes.tsv`,
        fullColumns.map((column) => node_full[column]).join("\t") + "\n"
      );
  });

  for (const promise of promises) {
    await promise();
  }
}

(async () => {
  await main("2020");
  await main("2021");
  await main("2022");
  await main("2023");
  await main("2024");
})();
