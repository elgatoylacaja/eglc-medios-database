import { PrismaClient } from "@prisma/client";
import {
  CommentSnippet,
  Item,
  VideoItem,
  VideoWithComments,
} from "../../src/lib/types";
import { getThumbnail, isoToSeconds } from "../../src/lib/utils";

const prisma = new PrismaClient();

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
    duration: isoToSeconds(duration) || 0,

    viewCount: parseInt(viewCount) || 0,
    likeCount: parseInt(likeCount || "") || 0,
    commentCount: parseInt(commentCount) || 0,
  };
}

export function mapComment(comment: CommentSnippet, video: VideoItem) {
  return {
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

///

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

  console.log(`Creating channel with id: ${channelId}`);
  await prisma.channel
    .create({
      data: {
        id: channelId,
        name,
        handle,
        description,
        publishedAt,
        thumbnail: getThumbnail(thumbnails) || "",
        banner: image?.bannerExternalUrl || "",
        videoCount: parseInt(videoCount) || 0,
        subscriberCount: parseInt(subscriberCount) || 0,
        viewCount: parseInt(viewCount) || 0,
      },
    })
    .then(() => console.log(`Channel with id: ${channelId} created.`));
}

export async function createVideos(videos: VideoItem[]) {
  await prisma.video
    .createMany({
      data: videos.map(mapVideo),
      skipDuplicates: true,
    })
    .then((res) =>
      console.log(
        `Videos for channel: ${videos[0].snippet.channelId} created. ${res.count} videos created.`
      )
    );
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
  });
}
