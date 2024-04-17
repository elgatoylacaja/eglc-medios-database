import { readFile, readdir, writeFile } from "fs/promises";

const handlesToExclude = [
  "@ElObservador107.9",
  "@c5n",
  "@canal26",
  "@cronicatv",
  "@eltrece",
  "@Infobae",
  "@IPNoticiasEnVivo",
  "@lanacion",
  "@metro951live",
  "@popradio1015",
  "@RadioConVos89.9",
  "@Radiomitre",
  "@fmrockandpop959",
  "@todonoticias",
  "@TVPublicaArgentina",
  "@A24com",
  "@perfiltv",
  "@UrbanaPlayFM",
  "@VorterixOficial",
  "@nacionalrock937",
  "@ElDestapeTV",
];

async function run() {
  const files = await readdir("./scripts/csv/original/");
  files
    .filter((file) => file.endsWith(".csv"))
    .forEach(async (file) => {
      const data = await readFile(`./scripts/csv/original/${file}`);
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => {
          return !handlesToExclude.some((handle) => {
            return line.includes(handle) || line.includes(handle.toLowerCase());
          });
        });
      await writeFile(`./scripts/csv/reduced/${file}`, lines.join("\n"));
    });
}

run();
