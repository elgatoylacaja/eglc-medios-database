import { Metadata } from "next";
import { keys } from "../../lib/utils";
import Interactive from "./Interactive";
import { YearKey, years } from "./common";
import { fetchYear } from "./data_utils";
import { GraphData } from "./types";

export const metadata: Metadata = {
  title: "La gente es maravillosa",
  description: "Pasado y presente de los nuevos medios digitales en Argentina",
};

export default async function Page() {
  const tuples = await Promise.all(keys(years).map(fetchYear));
  const data: Record<YearKey, GraphData> = Object.fromEntries(tuples);

  return <Interactive data={data} />;
}
