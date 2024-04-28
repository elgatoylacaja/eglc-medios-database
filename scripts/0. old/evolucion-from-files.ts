import { appendFile, readFile, writeFile } from "fs/promises";
import { extra_columns, nodes_base_columns } from "../0. common";

const columns = [...nodes_base_columns, ...extra_columns] as const;

type Key = (typeof columns)[number];
type Row = Record<Key, string | number>;

const periods = ["2020", "2021", "2022", "2023", "2024Q1"];

async function write(
  prop: Key,
  channels: string[],
  years: {
    period: string;
    data: Record<string, Row>;
  }[]
) {
  await writeFile(
    `./evolucion-${prop}.tsv`,
    `${prop}\t${periods.join("\t")}\n`,
    "utf8"
  );
  for (const channel of channels) {
    const data = years.map((year) => {
      if (year.data[channel]) {
        return year.data[channel][prop];
      } else {
        return "0";
      }
    });
    await appendFile(
      `./evolucion-${prop}.tsv`,
      `${channel}\t${data.join("\t")}\n`
    );
  }
}

async function evolucion() {
  const years = await Promise.all(
    periods.map((period) => {
      return readFile(
        `./scripts/exports/${period}-nodes-attributes.tsv`,
        "utf8"
      ).then((content) => {
        const lines = content.split("\n");
        const headers = lines[0].split("\t");
        const data = lines.slice(1, -1).map((line) => {
          const values = line.split("\t");
          return columns.reduce((acc, column, index) => {
            return { ...acc, [column]: values[index] };
          }, {} as Row);
        });
        return {
          period,
          data: data.reduce((acc, curr) => {
            return { ...acc, [curr.handle as string]: curr };
          }, {} as Record<string, Row>),
        };
      });
    })
  );

  const channels = Array.from(
    new Set(years.flatMap((year) => Object.keys(year.data)))
  ).filter((n) => n !== undefined);

  await write("commentCount", channels, years);
  await write("viewCount", channels, years);
  await write("page_rank", channels, years);
  await write("weightedDegree", channels, years);
  await write("videoCount", channels, years);
}

evolucion();
