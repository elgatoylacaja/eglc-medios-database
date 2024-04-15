import { parse, toSeconds } from "iso8601-duration";
import prisma from "./prisma";
import { PlaylistItem, ThumbnailKey, VideoItem } from "./types";

export function getThumbnail(thumbnails: VideoItem["snippet"]["thumbnails"]) {
  const options: ThumbnailKey[] = [
    "maxres",
    "standard",
    "high",
    "medium",
    "default",
  ];
  for (const option of options) {
    const thumbnail = thumbnails[option];
    if (thumbnail !== undefined) {
      return thumbnail.url;
    }
  }
}

export async function countCocommenters(
  channelId: string,
  otherChannelId: string
): Promise<any> {
  console.log(
    `Counting co-commenters between channels ${channelId} and ${otherChannelId}`
  );
  const count = await prisma.$queryRaw`
  with channelVideos as (select "id" from "Video" where "channelId" = ${channelId}),
      otherChannelVideos as (select "id" from "Video" where "channelId" = ${otherChannelId}),
      channelCommentAuthors as (select distinct "authorChannelId" from "Comment" where "videoId" in (select "id" from channelVideos)),
      otherChannelCommentAuthors as (select distinct "authorChannelId" from "Comment" where "videoId" in (select "id" from otherChannelVideos))
  
  select count(*) froom channelCommentAuthors where "authorChannelId" in (select "authorChannelId" from otherChannelCommentAuthors)
  `;
  return count;
}

export async function executeSequentially<T>(promises: (() => Promise<T>)[]) {
  let sequence = Promise.resolve();
  let results: T[] = [];

  promises.forEach((promise) => {
    sequence = sequence.then(() => {
      return promise().then((result) => {
        results.push(result);
      });
    });
  });

  return await sequence.then(() => results);
}

export function oldestVideoInPlaylist(videos: PlaylistItem[]) {
  const video = videos.reduce((oldest, video) => {
    return new Date(video.snippet.publishedAt) <
      new Date(oldest.snippet.publishedAt)
      ? video
      : oldest;
  }, videos[0]);
  return video;
}

export function latestVideoInPlaylist(videos: PlaylistItem[]) {
  const video = videos.reduce((oldest, video) => {
    return new Date(video.snippet.publishedAt) >
      new Date(oldest.snippet.publishedAt)
      ? video
      : oldest;
  }, videos[0]);
  return video;
}

export function isoToSeconds(duration: string) {
  return toSeconds(parse(duration));
}

export function isShort(video: VideoItem) {
  const duration = isoToSeconds(video.contentDetails.duration);
  return duration <= 61;
}

export function isLiveOrScheduled(video: VideoItem) {
  return video.snippet.liveBroadcastContent !== "none";
}

export function hasComments(video: VideoItem) {
  return (
    video.statistics.commentCount !== undefined &&
    parseInt(video.statistics.commentCount) !== 0
  );
}

export function isEligible(video: VideoItem) {
  return !isLiveOrScheduled(video) && !isShort(video) && hasComments(video);
}

export function secondsToString(seconds: number) {
  // returns HH:MM:SS
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return `${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}
