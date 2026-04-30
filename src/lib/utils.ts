import { Video as PrismaVideo } from "@prisma/client";
import { parse, toSeconds } from "iso8601-duration";
import {
  Item,
  PlaylistItem,
  ThumbnailKey,
  TopLevelCommentItem,
  VideoItem,
} from "./types";

export function redactUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    // removes the key from the query parameters
    if (parsedUrl.searchParams.has("key")) {
      parsedUrl.searchParams.set("key", "REDACTED");
    }
    return parsedUrl.toString();
  } catch (error) {
    console.error(`Error redacting URL: ${url}`, error);
    return url; // return the original URL if parsing fails
  }
}

export function keepUniqueBy<T>(fn: (x: T) => string, list: T[]) {
  return list.filter((item, index, self) => {
    return self.findIndex((i) => fn(i) === fn(item)) === index;
  });
}

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

export function isUndefined<T>(value: T | undefined): value is undefined {
  return value === undefined;
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export async function executeSequentially<T>(
  fns: (() => Promise<T>)[],
): Promise<T[]> {
  const results: T[] = [];
  for (const fn of fns) {
    results.push(await fn());
  }
  return results;
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
  return duration <= 180;
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
  return !isLiveOrScheduled(video); // && !isShort(video) && hasComments(video);
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

export function chunkArray<T>(array: T[], size: number) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}

// For batch API calls: fn receives a whole chunk and returns an array of results.
export async function executeSequentiallyInChunks<T, U>(
  array: T[],
  size: number,
  fn: (chunk: T[]) => Promise<U[]>,
): Promise<U[]> {
  const results: U[] = [];
  for (const chunk of chunkArray(array, size)) {
    results.push(...(await fn(chunk)));
  }
  return results;
}

export type PoolProgress = {
  completed: number;
  total: number;
  active: number;
};

// For per-item operations with controlled concurrency: keeps exactly `concurrency`
// tasks running at all times — as soon as one finishes the next item starts.
export async function mapWithConcurrency<T, U>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<U>,
  onProgress?: (progress: PoolProgress) => void,
): Promise<U[]> {
  const results = new Array<U>(items.length);
  const iter = items.entries();
  let completed = 0;
  let active = 0;

  const worker = async () => {
    for (const [i, item] of iter) {
      active++;
      results[i] = await fn(item);
      active--;
      completed++;
      onProgress?.({ completed, total: items.length, active });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );

  return results;
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
          `Video: ${video.id} of channel: ${item.channel.id} is duplicated. Skipping...`,
        );
      }
      return condition;
    }),
  };
}

export function videosToJson(videos: PrismaVideo[]) {
  return JSON.stringify(
    videos.map((i) => ({
      ...i,
      viewCount: parseInt(i.viewCount.toString()),
    })),
    null,
    2,
  );
}

export function videosToTsv(videos: PrismaVideo[]) {
  if (videos.length === 0) return "";
  const columns = Object.keys(videos[0]).filter(
    (i) => i !== "description",
  ) as (keyof PrismaVideo)[];
  const header = columns.join("\t");
  const rows = videos.map((video) =>
    columns.map((column) => video[column].toString()),
  );
  const body = rows.map((row) => row.join("\t")).join("\n");
  return `${header}\n${body}`;
}

export function keys<T extends Record<string, any>>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}
