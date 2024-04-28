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

const IN_FOLDER = "./scripts/exports";
const OUT_FOLDER = "./scripts/v1.1";

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
  const files = await readdir(`${IN_FOLDER}/`).then((files) =>
    files.filter((file) => file.startsWith(year) && file.endsWith(".tsv"))
  );

  const nodes = files.filter((f) => f.endsWith("nodes.tsv"));
  const node_lines = await readNodes(nodes);
  await writeFile(
    `${OUT_FOLDER}/${year}-nodes-final.tsv`,
    node_lines.join("\n")
  );

  const edges = files.filter((f) => f.endsWith("edges.tsv"));
  const edge_lines = await raedEdges(edges);
  await writeFile(
    `${OUT_FOLDER}/${year}-edges-final.tsv`,
    edge_lines.join("\n")
  );
}

async function main() {
  const years = ["2020", "2021", "2022", "2023", "2024Q1"];
  for (const year of years) {
    await processYear(year);
  }
}

main();
