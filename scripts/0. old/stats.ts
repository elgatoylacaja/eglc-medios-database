import prisma from "../../src/lib/prisma";
import { handles_to_exclude, ranges } from "../0. common";

const publishedAt = {
  gte: new Date("2020-01-01T00:00:00.000Z"),
  lte: new Date("2024-05-01T00:00:00.000Z"),
} as const;

async function getStats() {
  const videos = await prisma.video.count({
    where: {
      channel: {
        handle: {
          notIn: handles_to_exclude,
        },
      },
      publishedAt,
    },
  });

  const comments = await prisma.comment.count({
    where: {
      channel: {
        handle: {
          notIn: handles_to_exclude,
        },
      },
      // publishedAt,
      // videoPublishedAt: publishedAt,
      OR: Object.entries(ranges).map(([year, [gte, lte]]) => ({
        publishedAt: { gte, lte },
        videoPublishedAt: { gte, lte },
      })),
    },
  });

  const authors = await prisma.author.count({
    where: {
      Comment: {
        some: {
          channel: {
            handle: {
              notIn: handles_to_exclude,
            },
          },
          // publishedAt,
          // videoPublishedAt: publishedAt,
          OR: Object.entries(ranges).map(([year, [gte, lte]]) => ({
            publishedAt: { gte, lte },
            videoPublishedAt: { gte, lte },
          })),
        },
      },
    },
  });

  const viewCount = await prisma.video.aggregate({
    _sum: {
      viewCount: true,
    },
    where: {
      channel: {
        handle: {
          notIn: handles_to_exclude,
        },
      },
      publishedAt,
    },
  });

  const channels = await prisma.channel.count({
    where: {
      handle: {
        notIn: handles_to_exclude,
      },
      videos: {
        some: {
          publishedAt,
        },
      },
      comments: {
        some: {
          publishedAt,
          videoPublishedAt: publishedAt,
        },
      },
    },
  });

  console.log(`Channels\t${channels}`);
  console.log(`Views\t${viewCount._sum.viewCount}`);
  console.log(`Videos\t${videos}`);
  console.log(`Comments\t${comments}`);
  console.log(`Authors\t${authors}`);
}

getStats();
