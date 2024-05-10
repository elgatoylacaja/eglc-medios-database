import { Channel, PrismaClient } from "@prisma/client";
import { appendFile, readdir, writeFile } from "fs/promises";
import PQueue from "p-queue";
import { executeSequentially, isDefined } from "../src/lib/utils";
import { channelsWithComments, queryAuthorsInCommon } from "./db/utils";
import { handles_to_exclude, nodes_base_columns, ranges } from "./0. common";

const prisma = new PrismaClient();

type Config = {
  publishedAt: { lte: Date; gte: Date };
  period: string;
};

async function writeEdges(channels: Channel[], config: Config) {
  const queue = new PQueue({ concurrency: 8 });

  const edgesFileName = `${config.period}-edges.tsv`;
  const edgesFileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(edgesFileName)
  );

  if (edgesFileExists) {
    console.log(`Edges file already exists, skipping ...`);
    return;
  }

  await writeFile(
    `./scripts/exports/${edgesFileName}`,
    "Source\tTarget\tweight\n"
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

  await queue.onIdle();
}

async function writeNodes(channels: Channel[], config: Config) {
  const fileName = `${config.period}-nodes.tsv`;
  const fileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(fileName)
  );

  if (fileExists) {
    console.log(`Nodes file already exists, skipping ...`);
    return;
  }

  await writeFile(
    `./scripts/exports/${fileName}`,
    nodes_base_columns.join("\t") + "\n"
  );

  await executeSequentially(
    channels.map((channel) => async () => {
      const { id, name, handle, subscriberCount, publishedAt } = channel;
      const where = { channelId: id, publishedAt: config.publishedAt };

      console.log(`Processing ${handle} ...`);

      const [videoCount, viewCount, commentCount, oldestVideo, authors] =
        await Promise.all([
          prisma.video.count({ where }),
          prisma.video
            .aggregate({ where, _sum: { viewCount: true } })
            .then((res) => parseInt((res._sum.viewCount || 0).toString())),
          prisma.comment.count({
            where: {
              channelId: id,
              publishedAt: where.publishedAt,
              videoPublishedAt: where.publishedAt,
            },
          }),
          prisma.video.findFirst({ where, orderBy: { publishedAt: "asc" } }),
          prisma.author.count({
            where: {
              Comment: {
                some: {
                  channelId: id,
                  publishedAt: where.publishedAt,
                  videoPublishedAt: where.publishedAt,
                },
              },
            },
          }),
        ]);

      const values = [
        id,
        id,
        name,
        handle,
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

async function runForPeriod(
  period: string,
  publishedAt: { lte: Date; gte: Date }
) {
  console.log(`Processing period: ${period}`);
  const channelsRaw = await channelsWithComments(publishedAt);
  console.log(`Channels with comments: ${channelsRaw.length}`);

  const channels = channelsRaw.filter(
    (channel) => !handles_to_exclude.includes(channel.handle.toLowerCase())
  );
  console.log(`Channels to process: ${channels.length}`);

  await writeNodes(channels, { period, publishedAt });
  await writeEdges(channels, { period, publishedAt });
}

async function main() {
  const queue = new PQueue({ concurrency: 1 });

  const periods = Object.entries(ranges).map(([period, [gte, lte]]) => ({
    period,
    publishedAt: { gte, lte },
  }));

  for (const { period, publishedAt } of periods) {
    queue.add(async () => {
      await runForPeriod(period, publishedAt);
    });
  }

  await queue.onIdle();
  console.log("All tasks have been processed");
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
