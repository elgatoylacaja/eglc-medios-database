import { Channel, PrismaClient } from "@prisma/client";
import { appendFile, readdir, writeFile } from "fs/promises";
import PQueue from "p-queue";
import yargs from "yargs";
import { executeSequentially, isDefined } from "../src/lib/utils";
import { channelsWithComments, queryAuthorsInCommon } from "./db/utils";

// Process command line arguments
const argv = yargs(process.argv.slice(2)).option("handle", {
  description: "Channel handle",
  type: "string",
  demandOption: false,
}).argv as { handle: string };

const prisma = new PrismaClient();
const columns = [
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
] as const;

type Config = {
  publishedAt: { gte: Date; lte: Date };
  period: string;
  columns: typeof columns;
};

const configs: Config[] = [
  {
    publishedAt: {
      gte: new Date(`2020-01-01T00:00:00.000Z`),
      lte: new Date(`2021-01-01T00:00:00.000Z`),
    },
    period: "2020",
    columns,
  },
  {
    publishedAt: {
      gte: new Date(`2021-01-01T00:00:00.000Z`),
      lte: new Date(`2022-01-01T00:00:00.000Z`),
    },
    period: "2021",
    columns,
  },
  {
    publishedAt: {
      gte: new Date(`2022-01-01T00:00:00.000Z`),
      lte: new Date(`2023-01-01T00:00:00.000Z`),
    },
    period: "2022",
    columns,
  },
  {
    publishedAt: {
      gte: new Date(`2023-01-01T00:00:00.000Z`),
      lte: new Date(`2024-01-01T00:00:00.000Z`),
    },
    period: "2023",
    columns,
  },
  {
    publishedAt: {
      gte: new Date(`2024-01-01T00:00:00.000Z`),
      lte: new Date(`2024-03-31T00:00:00.000Z`),
    },
    period: "2024Q1",
    columns,
  },
];

async function writeEdges(
  channel: Channel,
  channels: Channel[],
  config: Config
) {
  const queue = new PQueue({ concurrency: 10 });

  const edgesFileName = `${config.period}-${channel.handle}-edges.tsv`;
  const edgesFileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(edgesFileName)
  );

  console.log(channel);

  if (edgesFileExists) {
    console.log(`Edges file already exists, skipping ...`);
    return;
  }

  await writeFile(
    `./scripts/exports/${edgesFileName}`,
    "source\ttarget\tweight\n"
  );

  const tuples = channels
    .map((channelB) =>
      channel.handle == channelB.handle
        ? undefined
        : ([channel, channelB] as [Channel, Channel])
    )
    .filter(isDefined);
  console.log(`Edges to process: ${tuples.length}`);

  for (const [channelA, channelB] of tuples) {
    queue.add(async () => {
      const authorsInCommon = await queryAuthorsInCommon(
        channelA,
        channelB,
        config.publishedAt
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

async function writeNode(channel: Channel, config: Config) {
  const fileName = `${config.period}-${channel.handle}-nodes.tsv`;
  const fileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(fileName)
  );

  if (fileExists) {
    console.log(`Nodes file already exists, skipping ...`);
    return;
  }

  const { id, name, handle, subscriberCount, publishedAt } = channel;
  const where = { channelId: id, publishedAt: config.publishedAt };

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

  await writeFile(
    `./scripts/exports/${fileName}`,
    config.columns.join("\t") + "\n"
  );
  await appendFile(`./scripts/exports/${fileName}`, `${values.join("\t")}\n`);
}

async function main() {
  // const channels = await prisma.channel.findMany();
  const channel = await prisma.channel.findFirst({
    where: { handle: argv.handle.toLowerCase() },
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  const promises = configs.map((config) => async () => {
    console.log(`Processing ${config.period} ...`);
    const channels = await channelsWithComments(config.publishedAt);
    const channelHasComments = channels.find((c) => c.handle == channel.handle);

    if (!channelHasComments) {
      console.log(`Channel ${channel.handle} has no comments, skipping ...`);
      return;
    } else {
      console.log(`Channels with comments: ${channels.length}`);

      await writeNode(channel, config);
      await writeEdges(channel, channels, config);
    }
  });

  await executeSequentially(promises);
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
