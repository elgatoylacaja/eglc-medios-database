import { SheetsRow } from "./types";

const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFuyt1KfbsRj-tWhHI5fAW7gtzNwXL3skegilTqGykpgAHCIUGMzV4bNiBGf7n13LkGidf6av5GNuN/pub?gid=842444845&single=true&output=tsv";

export const fetchFromSheets = async () => {
  return await fetch(url)
    .then((res) => res.text())
    .then((raw) => {
      const data = raw
        .split("\n")
        .map((row) => row.replace("\r", "").split("\t"));
      const headers = data.shift() as (keyof SheetsRow)[];
      return { headers, rows: data };
    })
    .then(({ headers, rows }) => {
      return rows.map((row) =>
        Object.fromEntries(row.map((cell, i) => [headers[i], cell]))
      ) as SheetsRow[];
    });
};
