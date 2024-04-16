import { parse, toSeconds } from "iso8601-duration";
import {
  Item,
  PlaylistItem,
  ThumbnailKey,
  TopLevelCommentItem,
  VideoItem,
} from "./types";

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

export function flat<T>(_: T[]) {
  return _.flat();
}

export function chunkArray<T>(array: T[], size: number) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

export function executeInChunks<T, U>(
  array: T[],
  size: number,
  fn: (chunk: T[]) => U
) {
  return Promise.all(chunkArray(array, size).map(fn)).then(flat);
}

export function executeSecuentiallyInChunks<T, U>(
  array: T[],
  size: number,
  fn: (chunk: T[], ...x: any[]) => Promise<U>
) {
  return executeSequentially(
    chunkArray(array, size).map((chunk, i) => () => fn(chunk, i))
  ).then(flat);
}

export function flattenCommentItem(item: TopLevelCommentItem) {
  const {
    replies,
    snippet: {
      topLevelComment: { snippet },
    },
  } = item;

  return replies
    ? [snippet, ...replies.comments.map((reply) => reply.snippet)]
    : [snippet];
}

export function normalizeItem(item: Item): Item {
  return {
    ...item,
    // make sure that videos with certain id appear only once
    videos: item.videos.filter((video, index, self) => {
      const condition = self.findIndex((v) => v.id === video.id) === index;
      if (!condition) {
        console.log(
          `Video: ${video.id} of channel: ${item.channel.id} is duplicated. Skipping...`
        );
      }
      return condition;
    }),
  };
}
