export const years = {
  "2020": {
    nodesSheetId: "677810901",
    edgesSheetId: "43839818",
  },
  "2021": {
    nodesSheetId: "635774751",
    edgesSheetId: "1527399977",
  },
  "2022": {
    nodesSheetId: "1003326424",
    edgesSheetId: "252963566",
  },
  "2023": {
    nodesSheetId: "1153002303",
    edgesSheetId: "1055921138",
  },
  "2024": {
    nodesSheetId: "1628978198",
    edgesSheetId: "1242872346",
  },
} as const;

export type YearKey = keyof typeof years;
