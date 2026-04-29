function buildRanges(years: number[]): Record<string, [Date, Date]> {
  return years.reduce((acc, year) => {
    return {
      ...acc,
      [year.toString()]: [
        new Date(`${year}-01-01T00:00:00.000Z`),
        new Date(`${year + 1}-01-01T00:00:00.000Z`),
      ],
    };
  }, {});
}

export const ranges: Record<string, [Date, Date]> = buildRanges([
  2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
]);

export const nodes_base_columns = [
  "_id",
  "id",
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
] as const;

export const extra_columns = [
  "degree",
  "weightedDegree",
  "eccentricity",
  "closeness_centrality",
  "betweenness_centrality",
  "page_rank",
  "class",
  "position_x",
  "position_y",
] as const;

export const handles_to_exclude = [] as string[];
