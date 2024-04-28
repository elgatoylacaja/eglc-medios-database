import { appendFile, readFile, readdir, writeFile } from "fs/promises";
import { handles_to_exclude } from "../0. common";

const node_columns = [
  "id",
  "_id",
  "name",
  "handle",
  "label",
  "subscriberCount",
  "viewCount",
  "videoCount",
  "commentCount",
  "authors",
  "oldestVideo",
  "publishedAt",
];

const edge_columns = ["Source", "Target", "weight"];

const IN_FOLDER = "./scripts/v1.1";

function filterData(data: string) {
  return data
    .split("\n")
    .slice(1)
    .filter(
      (line) =>
        line.trim() !== "" &&
        !handles_to_exclude.some((handle) => line.includes(handle))
    );
}

async function readNodes(files: string[]) {
  const node_lines = [node_columns.join("\t")];
  for (const file of files) {
    const data = await readFile(`${IN_FOLDER}/${file}`, "utf8");
    const lines = filterData(data);
    node_lines.push(...lines);
  }

  const nodes_set = new Set();
  return node_lines.filter((line) => {
    const values = line.split("\t");
    const label = values[node_columns.indexOf("label")];
    if (nodes_set.has(label)) {
      return false;
    }
    nodes_set.add(label);
    return true;
  });
}

async function raedEdges(files: string[]) {
  const edge_lines = [edge_columns.join("\t")];
  for (const file of files) {
    const data = await readFile(`${IN_FOLDER}/${file}`, "utf8");
    const lines = filterData(data);
    edge_lines.push(...lines);
  }

  const edges_set = new Set();
  return edge_lines.filter((line) => {
    const [source, target] = line.split("\t");
    const forward = `${source}-${target}`;
    const backward = `${target}-${source}`;
    if (edges_set.has(forward) || edges_set.has(backward)) {
      return false;
    }
    edges_set.add(forward);
    return true;
  });
}

async function processYear(year: string) {
  const nodes = await readFile(
    `${IN_FOLDER}/${year}-nodes-attributes.tsv`,
    "utf-8"
  ).then(filterData);

  const edges = await readFile(
    `${IN_FOLDER}/${year}-edges-final.tsv`,
    "utf-8"
  ).then(filterData);

  return {
    nodes: nodes.map((line) => `${line}\t${year}`),
    edges: edges.map((line) => `${line}\t${year}`),
  };
}

async function main() {
  const years = ["2020", "2021", "2022", "2023", "2024Q1"];
  const nodes = [
    `${node_columns.join("\t")}\t${[
      "degree",
      "weightedDegree",
      "eccentricity",
      "closeness_centrality",
      "betweenness_centrality",
      "page_rank",
      "class",
      "position_x",
      "position_y",
    ].join("\t")}\tyear`,
  ];
  const edges = [`${edge_columns.join("\t")}\tyear`];
  for (const year of years) {
    const { nodes: y_nodes, edges: y_edges } = await processYear(year);
    nodes.push(...y_nodes);
    edges.push(...y_edges);
  }

  await writeFile("./scripts/v1.1/nodes.tsv", nodes.join("\n"));
  await writeFile("./scripts/v1.1/edges.tsv", edges.join("\n"));
}

main();
