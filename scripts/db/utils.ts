import { Channel, PrismaClient } from "@prisma/client";
import {
  CommentSnippet,
  Item,
  VideoItem,
  VideoWithComments,
} from "@/lib/types";
import { getThumbnail, isoToSeconds } from "@/lib/utils";
import { createLogger } from "../logger";

export const prisma = new PrismaClient();
const logger = createLogger();

function mapVideo(video: VideoItem) {
  const {
    id: videoId,
    snippet: { title, description, publishedAt, thumbnails, channelId },
    statistics: { viewCount, likeCount, commentCount },
    contentDetails: { duration },
  } = video;
  return {
    id: videoId,
    channelId,

    title,
    description,
    publishedAt,
    thumbnail: getThumbnail(thumbnails) || "",
    duration: duration ? isoToSeconds(duration) : 0,
    viewCount: parseInt(viewCount) || 0,
    likeCount: parseInt(likeCount || "") || 0,
    commentCount: parseInt(commentCount) || 0,
  };
}

export function mapComment(comment: CommentSnippet, video: VideoItem) {
  return {
    id: `${comment.videoId}-${comment.authorChannelId.value}-${comment.publishedAt}`,
    channelId: comment.channelId,
    videoId: comment.videoId,
    authorId: comment.authorChannelId.value,
    text: comment.textDisplay,
    publishedAt: comment.publishedAt,
    videoPublishedAt: video.snippet.publishedAt,
    likeCount: parseInt(comment.likeCount.toString()) || 0,
  };
}

export function mapAuthor(comment: CommentSnippet) {
  return {
    id: comment.authorChannelId.value,
    name: comment.authorDisplayName,
    avatar: comment.authorProfileImageUrl,
  };
}

export async function createChannel(item: Item) {
  const {
    channel: {
      id: channelId,
      snippet: {
        description,
        publishedAt,
        thumbnails,
        title: name,
        customUrl: handle,
      },
      statistics: { subscriberCount, videoCount, viewCount },
      brandingSettings: { image },
    },
  } = item;

  const data = {
    name,
    handle,
    description,
    publishedAt,
    thumbnail: getThumbnail(thumbnails) || "",
    banner: image?.bannerExternalUrl || "",
    videoCount: parseInt(videoCount) || 0,
    subscriberCount: parseInt(subscriberCount) || 0,
    viewCount: parseInt(viewCount) || 0,
  };

  logger.info(`[${channelId}] - Creating channel`);
  await prisma.channel
    .upsert({
      create: {
        id: channelId,
        ...data,
      },
      where: {
        id: channelId,
      },
      update: {
        ...data,
      },
    })
    .then(() => logger.info(`[${channelId}] - Channel upserted`));
}

export async function createVideos(
  channel: Item["channel"],
  videos: VideoItem[],
) {
  await prisma.video
    .createMany({
      data: videos.map(mapVideo),
      skipDuplicates: true,
    })
    .then((res) => {
      if (videos.length > 0) {
        logger.info(
          `[${channel.id}] - ${res.count} videos upserted`,
        );
      }
    });
}

export async function createVideoComments(video: VideoWithComments) {
  const comments = video.comments.map((comment) => mapComment(comment, video));
  const authors = video.comments.map(mapAuthor);

  await prisma.author.createMany({
    data: authors,
    skipDuplicates: true,
  });

  await prisma.comment.createMany({
    data: comments,
    skipDuplicates: true,
  });
}

export async function queryAuthorsInCommon(
  channelA: Channel,
  channelB: Channel,
  publishedAt: { lte: Date; gte: Date },
) {
  const result = await prisma.author.count({
    where: {
      AND: [
        {
          Comment: {
            some: {
              channelId: channelA.id,
              publishedAt: {
                gte: publishedAt.gte,
                lte: publishedAt.lte,
              },
              videoPublishedAt: {
                gte: publishedAt.gte,
                lte: publishedAt.lte,
              },
            },
          },
        },
        {
          Comment: {
            some: {
              channelId: channelB.id,
              publishedAt: {
                gte: publishedAt.gte,
                lte: publishedAt.lte,
              },
              videoPublishedAt: {
                gte: publishedAt.gte,
                lte: publishedAt.lte,
              },
            },
          },
        },
      ],
    },
  });

  return result;
}

export async function channelsWithComments(publishedAt: {
  lte: Date;
  gte: Date;
}) {
  return await prisma.channel.findMany({
    where: {
      comments: {
        some: {
          publishedAt: {
            gte: publishedAt.gte,
            lte: publishedAt.lte,
          },
          videoPublishedAt: {
            gte: publishedAt.gte,
            lte: publishedAt.lte,
          },
        },
      },
    },
  });
}
