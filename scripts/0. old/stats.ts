import PQueue from "p-queue";
import prisma from "../../src/lib/prisma";
import { handles_to_exclude, ranges } from "../0. common";

async function getStats(range: [Date, Date]) {
  const [gte, lte] = range;
  const publishedAt = { gte, lte } as const;

  const where = {
    channel: {
      handle: {
        notIn: handles_to_exclude,
      },
    },
    publishedAt,
  } as const;

  const [videos, comments, authors, viewCount, channels] = await Promise.all([
    prisma.video.count({ where }),
    prisma.comment.count({
      where: { ...where, videoPublishedAt: publishedAt },
    }),
    prisma.author.count({
      where: {
        Comment: {
          some: { ...where, videoPublishedAt: publishedAt },
        },
      },
    }),
    prisma.video
      .aggregate({
        _sum: { viewCount: true },
        where,
      })
      .then((res) => parseInt(res._sum.viewCount?.toString() || "0")),
    prisma.channel.count({
      where: {
        handle: {
          notIn: handles_to_exclude,
        },
        comments: {
          some: {
            publishedAt,
            videoPublishedAt: publishedAt,
          },
        },
      },
    }),
  ]);

  const columns = ["Channels (C)", "Views", "Videos", "Comment", "Authors"];

  const data = [channels, viewCount, videos, comments, authors];

  console.log(columns.join("\t"));
  console.log(data.join("\t"));
}

async function main() {
  const queue = new PQueue({ concurrency: 1 });

  for (const [year, range] of Object.entries(ranges)) {
    queue.add(async () => {
      console.log(`Processing year: ${year}`);
      await getStats(range);
    });
  }

  await queue.onIdle();
}

main();
