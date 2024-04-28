import { PrismaClient } from "@prisma/client";
import { appendFile, readFile, writeFile } from "fs/promises";
import PQueue from "p-queue";
import { isDefined } from "../../src/lib/utils";

const prisma = new PrismaClient();

type HeaderKey =
  | "id"
  | "channelId"
  | "label"
  | "publishedAt"
  | "thumbnail"
  | "duration"
  | "viewCount"
  | "likeCount"
  | "commentCount";

async function queryAuthorsInCommon(idA: string, idB: string) {
  const resultAB: { count: number }[] = await prisma.$queryRaw`
    select count(distinct "authorId")
    from "Comment"
    where "videoId" = ${idA} and "authorId" in (
      select "authorId"
      from "Comment"
      where "videoId" = ${idB}
    );`;

  return parseInt(resultAB[0].count.toString());
}

async function main() {
  const queue = new PQueue({ concurrency: 5 });

  const fileData = await readFile("./scripts/exports/CajaNegra.tsv", "utf-8");
  const lines = fileData.split("\n");
  const headers = lines[0].split("\t") as HeaderKey[];
  const data = lines.slice(1).map((line) => {
    const obj = {} as Record<HeaderKey, string>;
    line.split("\t").forEach((value, index) => {
      obj[headers[index]] = value;
    });
    return obj;
  });

  const videos = await prisma.video.findMany({
    where: {
      id: {
        in: data.map((d) => d.id),
      },
    },
  });

  const tuples = videos.flatMap(({ id: source }) =>
    videos
      .map(({ id: target }) =>
        source <= target ? undefined : { source, target }
      )
      .filter(isDefined)
  );

  await writeFile(
    "./scripts/exports/cajanegra-edges.tsv",
    "source\ttarget\tweight\n"
  );

  console.log(`Edges to process: ${tuples.length}`);
  for (const { source, target } of tuples) {
    queue.add(async () => {
      const authorsInCommon = await queryAuthorsInCommon(source, target);
      if (authorsInCommon > 0) {
        await appendFile(
          "./scripts/exports/cajanegra-edges.tsv",
          `${source}\t${target}\t${authorsInCommon}\n`
        );
      }
    });
  }
}

main();
