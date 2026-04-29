import { Channel, PrismaClient } from "@prisma/client";
import { readdir, writeFile } from "fs/promises";
import { createLogger } from "./logger";
import { isDefined, mapWithConcurrency } from "../src/lib/utils";
import { channelsWithComments, queryAuthorsInCommon } from "./db/utils";
import { handles_to_exclude, nodes_base_columns, ranges } from "./0. common";

const prisma = new PrismaClient();

const logger = createLogger();

type Config = {
  publishedAt: { lte: Date; gte: Date };
  period: string;
};

async function writeEdges(channels: Channel[], config: Config) {
  const fileName = `${config.period}-edges.tsv`;
  const fileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(fileName),
  );

  if (fileExists) {
    logger.info(`[${config.period}] - Edges file already exists, skipping`);
    return;
  }

  const tuples = channels.flatMap((channelA) =>
    channels
      .map((channelB) =>
        channelA.handle >= channelB.handle
          ? undefined
          : ([channelA, channelB] as [Channel, Channel]),
      )
      .filter(isDefined),
  );
  logger.info(`[${config.period}] - Processing ${tuples.length} channel pairs`);

  const lines = await mapWithConcurrency(
    tuples,
    8,
    async ([channelA, channelB]) => {
      const weight = await queryAuthorsInCommon(
        channelA,
        channelB,
        config.publishedAt,
      );
      return weight > 0
        ? `${channelA.handle}\t${channelB.handle}\t${weight}\n`
        : null;
    },
    ({ completed, total, active }) => {
      if (completed % 100 === 0 || completed === total) {
        logger.info(
          `[${config.period}] - Edges: ${completed}/${total} pairs checked, ${active} active`,
        );
      }
    },
  );

  await writeFile(
    `./scripts/exports/${fileName}`,
    "Source\tTarget\tweight\n" + lines.filter(isDefined).join(""),
  );
  logger.info(`[${config.period}] - Edges file written`);
}

async function writeNodes(channels: Channel[], config: Config) {
  const fileName = `${config.period}-nodes.tsv`;
  const fileExists = await readdir("./scripts/exports").then((files) =>
    files.includes(fileName),
  );

  if (fileExists) {
    logger.info(`[${config.period}] - Nodes file already exists, skipping`);
    return;
  }

  const lines = await mapWithConcurrency(
    channels,
    4,
    async (channel) => {
      const { id, name, handle, subscriberCount, publishedAt } = channel;
      const where = { channelId: id, publishedAt: config.publishedAt };

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

      return [
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
      ].join("\t") + "\n";
    },
    ({ completed, total, active }) =>
      logger.info(
        `[${config.period}] - Nodes: ${completed}/${total} processed, ${active} active`,
      ),
  );

  await writeFile(
    `./scripts/exports/${fileName}`,
    nodes_base_columns.join("\t") + "\n" + lines.join(""),
  );
  logger.info(`[${config.period}] - Nodes file written`);
}

async function runForPeriod(
  period: string,
  publishedAt: { lte: Date; gte: Date },
) {
  logger.info(`Processing period: ${period}`);
  const channelsRaw = await channelsWithComments(publishedAt);
  logger.info(`[${period}] - Channels with comments: ${channelsRaw.length}`);

  const channels = channelsRaw.filter(
    (channel) => !handles_to_exclude.includes(channel.handle.toLowerCase()),
  );
  logger.info(`[${period}] - Channels to process: ${channels.length}`);

  await writeNodes(channels, { period, publishedAt });
  await writeEdges(channels, { period, publishedAt });
}

async function main() {
  for (const [period, [gte, lte]] of Object.entries(ranges)) {
    await runForPeriod(period, { gte, lte });
  }
  logger.info("All tasks have been processed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
