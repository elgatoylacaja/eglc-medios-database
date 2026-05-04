import { execFile } from "child_process";

import { promisify } from "util";
import {
  ChannelItem,
  ChannelListResponse,
  CommentSnippet,
  PlaylistItem,
  VideoListResponse,
} from "./types";
import { oldestVideoInPlaylist } from "./utils";

const execFileAsync = promisify(execFile);

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const YTDLP_ROOT_PARENT = "root";

type YtDlpComment = {
  id: string;
  text: string;
  timestamp: number;
  like_count?: number;
  author: string;
  author_id: string;
  author_thumbnail?: string;
  author_url?: string;
  parent: string;
};

type RequestLimit = {
  maxResults?: number;
  timeRange?: {
    start: string;
    end: string;
  };
};

async function paginate<T>(
  fetchPage: (
    pageToken?: string,
  ) => Promise<{ items: T[]; nextPageToken?: string }>,
  shouldContinue: (accumulated: T[]) => boolean,
): Promise<T[]> {
  const accumulated: T[] = [];
  let pageToken: string | undefined;

  do {
    const { items, nextPageToken } = await fetchPage(pageToken);
    accumulated.push(...items);
    pageToken = nextPageToken;
  } while (pageToken !== undefined && shouldContinue(accumulated));

  return accumulated;
}

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  {
    maxRetries = 10,
    baseDelay = 2_000,
    maxDelay = 120_000,
    jitter = 2_000,
    shouldRetry = (_err: unknown): boolean => true,
  } = {},
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !shouldRetry(err)) throw err;
      const exponential = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      const delay = exponential + Math.random() * jitter;
      console.warn(
        `yt-dlp retry ${attempt}/${maxRetries} after ${Math.round(delay / 1000)}s — ${err}`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

function isRateLimitError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes("403") ||
    msg.includes("429") ||
    msg.includes("too many requests") ||
    msg.includes("forbidden") ||
    msg.includes("rate limit")
  );
}

async function fetchYtDlpComments(videoId: string): Promise<YtDlpComment[]> {
  return withExponentialBackoff(
    async () => {
      const { stdout } = await execFileAsync(
        "yt-dlp",
        [
          "-j",
          "--write-comments",
          `https://www.youtube.com/watch?v=${videoId}`,
        ],
        { maxBuffer: 100 * 1024 * 1024 },
      );
      const data = JSON.parse(stdout) as { comments?: YtDlpComment[] };
      return data.comments ?? [];
    },
    { shouldRetry: isRateLimitError },
  );
}

function mapYtDlpComment(
  comment: YtDlpComment,
  videoId: string,
  channelId: string,
): CommentSnippet {
  const publishedAt = new Date((comment.timestamp ?? 0) * 1000).toISOString();
  return {
    channelId,
    videoId,
    textDisplay: comment.text,
    textOriginal: comment.text,
    authorDisplayName: comment.author,
    authorProfileImageUrl: comment.author_thumbnail ?? "",
    authorChannelUrl: comment.author_url ?? "",
    authorChannelId: { value: comment.author_id },
    parentId: comment.parent !== YTDLP_ROOT_PARENT ? comment.parent : "",
    canRate: true,
    viewerRating: "none",
    likeCount: comment.like_count ?? 0,
    publishedAt,
    updatedAt: publishedAt, // yt-dlp does not expose edit timestamps
  };
}

export class YoutubeAPI {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key)
      throw new Error("YOUTUBE_API_KEY environment variable is not set");
    this.apiKey = key;
  }

  private async fetchWithRetry(
    url: string,
    options?: RequestInit,
    retries = 10,
    delay = 2000,
  ): Promise<Response> {
    let response: Response;

    try {
      response = await fetch(url, options);
    } catch (networkError) {
      if (retries <= 1) throw networkError;
      await new Promise((r) => setTimeout(r, delay));
      return this.fetchWithRetry(
        url,
        options,
        retries - 1,
        Math.min(delay * 2, 30_000),
      );
    }

    if (response.ok) return response;

    // 4xx errors are the caller's fault and won't resolve on retry
    if (response.status >= 400 && response.status < 500) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (retries <= 1)
      throw new Error(`Request failed with status ${response.status}`);

    await new Promise((r) => setTimeout(r, delay));
    return this.fetchWithRetry(
      url,
      options,
      retries - 1,
      Math.min(delay * 2, 30_000),
    );
  }

  // https://developers.google.com/youtube/v3/docs/channels/list - $1
  fetchChannelData = async (
    handle: string,
  ): Promise<ChannelItem | undefined> => {
    const params = new URLSearchParams({
      part: [
        "id",
        "snippet",
        "contentDetails",
        "statistics",
        "brandingSettings",
      ].join(","),
      forHandle: handle,
      key: this.apiKey,
    });

    const response = (await this.fetchWithRetry(
      `${BASE_URL}/channels?${params}`,
    ).then((res) => res.json())) as ChannelListResponse;

    return response.items?.[0];
  };

  // https://developers.google.com/youtube/v3/docs/playlistItems/list - $1
  fetchPlaylistItems = async (
    playlistId: string,
    limit: RequestLimit = { maxResults: 50 },
  ): Promise<PlaylistItem[]> => {
    const { maxResults, timeRange } = limit;

    const items = await paginate<PlaylistItem>(
      async (pageToken) => {
        const params = new URLSearchParams({
          part: ["id", "snippet", "contentDetails"].join(","),
          playlistId,
          maxResults: "50", // YouTube API maxResults per page is 50
          ...(pageToken !== undefined ? { pageToken } : {}),
          key: this.apiKey,
        });
        const res = await this.fetchWithRetry(
          `${BASE_URL}/playlistItems?${params}`,
        );
        const data = await res.json();
        return {
          items: data.items ?? [],
          nextPageToken: data.nextPageToken,
        };
      },
      (accumulated) => {
        const withinSize =
          maxResults === undefined || accumulated.length < maxResults;
        const oldest = oldestVideoInPlaylist(accumulated);
        const withinTimeRange =
          timeRange === undefined ||
          new Date(oldest.snippet.publishedAt) > new Date(timeRange.start);
        return withinSize && withinTimeRange;
      },
    );

    const filtered =
      timeRange !== undefined
        ? items.filter(
            (item) =>
              new Date(item.snippet.publishedAt) >= new Date(timeRange.start),
          )
        : items;

    return maxResults !== undefined ? filtered.slice(0, maxResults) : filtered;
  };

  // https://developers.google.com/youtube/v3/docs/videos/list - $1
  fetchVideosData = async (ids: string[]) => {
    const params = new URLSearchParams({
      part: ["id", "snippet", "contentDetails", "statistics"].join(","),
      id: ids.join(","),
      key: this.apiKey,
    });
    const response = (await this.fetchWithRetry(
      `${BASE_URL}/videos?${params}`,
    ).then((res) => res.json())) as VideoListResponse;

    return response.items;
  };

  // https://developers.google.com/youtube/v3/docs/commentThreads/list - $1
  fetchVideoComments = async (
    videoId: string,
    limit: RequestLimit = { maxResults: 100 },
  ) => {
    const { maxResults = 100 } = limit;

    return paginate(
      async (pageToken) => {
        const params = new URLSearchParams({
          part: ["snippet", "replies"].join(","),
          videoId,
          maxResults: "100",
          order: "time",
          ...(pageToken !== undefined ? { pageToken } : {}),
          key: this.apiKey,
        });
        const res = await this.fetchWithRetry(
          `${BASE_URL}/commentThreads?${params}`,
        );
        const data = await res.json();
        return {
          items: data.items ?? [],
          nextPageToken: data.nextPageToken,
        };
      },
      (accumulated) => accumulated.length < maxResults,
    );
  };

  fetchVideoCommentsViaYtDlp = async (
    videoId: string,
    channelId: string,
  ): Promise<CommentSnippet[]> => {
    const comments = await fetchYtDlpComments(videoId);
    return comments.map((comment) =>
      mapYtDlpComment(comment, videoId, channelId),
    );
  };
}
