export const only_q1 = [
  "@c5n",
  "@canal26",
  "@cronicatv",
  "@eltrece",
  "@lanacion",
  "@Radiomitre",
  "@todonoticias",
  "@TVPublicaArgentina",
  "@A24com",
  "@perfiltv",
  "@ElDestapeTV",
  "@ReFM107.3",
  "@ElObservador107.9",
  "@telefe",
  "@elnueve",
  "@Infobae",
  "@IPNoticiasEnVivo",
  "@metro951live",
  "@popradio1015",
  "@RadioConVos89.9",
  "@fmrockandpop959",
  "@nacionalrock937",
  "@UrbanaPlayFM",
].map((handle) => handle.toLowerCase());

export const handles_to_exclude = [
  ...only_q1,
  "@ebeplay",
  "@vorlytv",
  "@factoria1251",
  "@mostritv_",
  "@lafabricapodcast_ok",
].map((handle) => handle.toLowerCase());

export const ranges: Record<string, [Date, Date]> = {
  "2020": [
    new Date(`2020-01-01T00:00:00.000Z`),
    new Date(`2021-01-01T00:00:00.000Z`),
  ],
  "2021": [
    new Date(`2021-01-01T00:00:00.000Z`),
    new Date(`2022-01-01T00:00:00.000Z`),
  ],
  "2022": [
    new Date(`2022-01-01T00:00:00.000Z`),
    new Date(`2023-01-01T00:00:00.000Z`),
  ],
  "2023": [
    new Date(`2023-01-01T00:00:00.000Z`),
    new Date(`2024-01-01T00:00:00.000Z`),
  ],
  "2024Q1": [
    new Date(`2024-01-01T00:00:00.000Z`),
    new Date(`2024-04-01T00:00:00.000Z`),
  ],
  "2024": [
    new Date(`2024-01-01T00:00:00.000Z`),
    new Date(`2025-01-01T00:00:00.000Z`),
  ],
};

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
