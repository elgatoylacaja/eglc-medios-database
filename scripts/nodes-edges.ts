import { Channel, PrismaClient } from "@prisma/client";
import { appendFile, readdir, writeFile } from "fs/promises";
import PQueue from "p-queue";
import {
  executeSequentially,
  isDefined
} from "../src/lib/utils";
import { channelsWithComments, queryAuthorsInCommon } from "./db/utils";

const prisma = new PrismaClient();

const Config = {
  publishedAt: {
    lte: new Date(`2024-01-01T00:00:00.000Z`),
    gte: new Date(`2023-01-01T00:00:00.000Z`),
  },
  period: "2023",
  columns: [
    "id",
    "name",
    "handle",
    "subscriberCount",
    "viewCount",
    "videoCount",
    "commentCount",
    "authors",
    "oldestVideo",
    "publishedAt",
  ] as const,
};

async function writeEdges(channels: Channel[]) {
  const queue = new PQueue({ concurrency: 10 });

  const edgesFileName = `${Config.period}-edges.tsv`;
  const edgesFileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(edgesFileName)
  );

  if (edgesFileExists) {
    console.log(`Edges file already exists, skipping ...`);
    return;
  }

  await writeFile(
    `./scripts/exports/${edgesFileName}`,
    "source\ttarget\tweight\n"
  );

  const tuples = channels.flatMap((channelA) =>
    channels
      .map((channelB) =>
        channelA.handle >= channelB.handle
          ? undefined
          : ([channelA, channelB] as [Channel, Channel])
      )
      .filter(isDefined)
  );
  console.log(`Edges to process: ${tuples.length}`);

  for (const [channelA, channelB] of tuples) {
    queue.add(async () => {
      const authorsInCommon = await queryAuthorsInCommon(
        channelA,
        channelB,
        Config.publishedAt
      );
      if (authorsInCommon > 0) {
        console.log(
          `Writing edge ${channelA.handle} - ${channelB.handle}:`,
          authorsInCommon
        );
        await appendFile(
          `./scripts/exports/${edgesFileName}`,
          `${channelA.handle}\t${channelB.handle}\t${authorsInCommon}\n`
        );
      }
    });
  }
}

async function writeNodes(channels: Channel[]) {
  const fileName = `${Config.period}-nodes.tsv`;
  const fileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(fileName)
  );

  if (fileExists) {
    console.log(`Nodes file already exists, skipping ...`);
    return;
  }

  await writeFile(
    `./scripts/exports/${fileName}`,
    Config.columns.join("\t") + "\n"
  );

  await executeSequentially(
    channels.map((channel) => async () => {
      const { id, name, handle, subscriberCount, publishedAt } = channel;
      const where = { channelId: id, publishedAt: Config.publishedAt };

      console.log(`Processing ${handle} ...`);

      const [videoCount, viewCount, commentCount, oldestVideo, authors] =
        await Promise.all([
          prisma.video.count({ where }),
          prisma.video
            .aggregate({ where, _sum: { viewCount: true } })
            .then((res) => parseInt((res._sum.viewCount || 0).toString())),
          prisma.comment.count({ where }),
          prisma.video.findFirst({ where, orderBy: { publishedAt: "asc" } }),
          prisma.$queryRaw`
          SELECT COUNT(DISTINCT "authorId")
          FROM "Comment"
          WHERE
            "channelId" = ${channel.id} AND
            "publishedAt" >= ${where.publishedAt.gte.toISOString()}::timestamp AND
            "publishedAt" <= ${where.publishedAt.lte.toISOString()}::timestamp AND
            "videoPublishedAt" >= ${where.publishedAt.gte.toISOString()}::timestamp AND
            "videoPublishedAt" <= ${where.publishedAt.lte.toISOString()}::timestamp;`.then(
            (res) => {
              return parseInt((res as { count: number }[])[0].count.toString());
            }
          ),
        ]);

      const values = [
        id,
        name,
        handle,
        subscriberCount,
        viewCount,
        videoCount,
        commentCount,
        authors,
        oldestVideo ? oldestVideo.publishedAt.toISOString() : "",
        publishedAt ? publishedAt.toISOString() : "",
      ];

      await appendFile(
        `./scripts/exports/${fileName}`,
        `${values.join("\t")}\n`
      );
    })
  );
}

async function main() {
  const channels = await channelsWithComments(Config.publishedAt);
  console.log(`Channels with comments: ${channels.length}`);

  await writeNodes(channels);
  await writeEdges(channels);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
