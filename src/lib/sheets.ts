import { SheetsRow } from "./types";

export const fetchFromSheets = async () => {
  const url = process.env.SHEETS_URL;
  if (!url) throw new Error("SHEETS_URL environment variable is not set");
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
        Object.fromEntries(row.map((cell, i) => [headers[i], cell])),
      ) as SheetsRow[];
    });
};
