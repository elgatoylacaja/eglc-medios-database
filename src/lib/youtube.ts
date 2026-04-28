import {
  ChannelItem,
  ChannelListResponse,
  CommentListResponse,
  PlaylistItem,
  PlaylistResponse,
  VideoListResponse,
} from "./types";
import { oldestVideoInPlaylist } from "./utils";

// const BASE_URL = "https://yt.lemnoslife.com/noKey";
// const BASE_URL = "http://localhost:8080";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

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

export class YoutubeAPI {
  private async fetchWithRetry(
    url: string,
    options?: RequestInit,
    retries: number = 10,
    delay: number = 2000,
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        // or other logic to determine a failed request
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 1) {
        console.log(`Retrying request ${retries - 1} attempts left`);
        // console.log(`Retrying request to ${url}: ${retries - 1} attempts left`);
        await new Promise((r) => setTimeout(r, delay));
        return this.fetchWithRetry(url, options, retries - 1, delay);
      } else {
        throw error;
      }
    }
  }

  // https://developers.google.com/youtube/v3/docs/channels/list - $1
  fetchChannelData = async (
    handle: string,
  ): Promise<ChannelItem | undefined> => {
    try {
      const url = `${BASE_URL}/channels`;
      const params = new URLSearchParams({
        part: [
          "id",
          "snippet",
          "contentDetails",
          "statistics",
          "brandingSettings",
        ].join(","),
        forHandle: handle,
        key: process.env.YOUTUBE_API_KEY || "",
      });

      const response = (await this.fetchWithRetry(
        `${url}?${params.toString()}`,
      ).then((res) => res.json())) as ChannelListResponse;

      return response.items[0];
    } catch (e) {
      console.log(e);
      console.log(`Error in fetchChannelData for channel ${handle}`);
    }
  };

  // https://developers.google.com/youtube/v3/docs/playlistItems/list - $1
  fetchPlaylistItems = async (
    playlistId: string,
    limit: RequestLimit = {
      maxResults: 50,
    },
  ): Promise<PlaylistItem[]> => {
    const url = `${BASE_URL}/playlistItems`;

    const { maxResults, timeRange } = limit;

    type StepData = Pick<PlaylistResponse, "items" | "nextPageToken">;
    const fetchPlaylist = async (previous?: StepData): Promise<StepData> => {
      const { items: prevItems = [], nextPageToken: pageToken } =
        previous || {};

      const params = new URLSearchParams({
        part: ["id", "snippet", "contentDetails"].join(","),
        playlistId,
        maxResults: maxResults?.toString() || "50",
        ...(pageToken !== undefined ? { pageToken } : {}),
        key: process.env.YOUTUBE_API_KEY || "",
      });

      const response = (await this.fetchWithRetry(
        `${url}?${params.toString()}`,
      ).then((res) => res.json())) as PlaylistResponse;

      const { items = [], nextPageToken } = response;

      const nextItems = [...prevItems, ...items];
      const oldest = oldestVideoInPlaylist(nextItems);

      const hasMore = nextPageToken !== undefined;
      const sizeCondition =
        maxResults !== undefined ? nextItems.length < maxResults : true;
      const timeRangeCondition =
        timeRange !== undefined
          ? new Date(oldest.snippet.publishedAt) > new Date(timeRange.start)
          : true;

      const filterCondition = sizeCondition && timeRangeCondition;

      const continueFetching = hasMore && filterCondition;

      if (continueFetching) {
        return await fetchPlaylist({
          items: nextItems,
          nextPageToken,
        });
      } else {
        return {
          items: nextItems,
        };
      }
    };

    return (await fetchPlaylist()).items;
  };

  // https://developers.google.com/youtube/v3/docs/videos/list - $1
  fetchVideosData = async (ids: string[]) => {
    const url = `${BASE_URL}/videos`;
    const params = new URLSearchParams({
      part: ["id", "snippet", "contentDetails", "statistics"].join(","),
      id: ids.join(","),
      key: process.env.YOUTUBE_API_KEY || "",
    });
    const response = (await this.fetchWithRetry(
      `${url}?${params.toString()}`,
    ).then((res) => res.json())) as VideoListResponse;

    return response.items;
  };

  // https://developers.google.com/youtube/v3/docs/commentThreads/list - $1
  fetchVideoComments = async (
    videoId: string,
    limit: RequestLimit = {
      maxResults: 100,
    },
  ) => {
    const url = `${BASE_URL}/commentThreads`;
    const { maxResults = 100 } = limit;

    type StepData = Pick<CommentListResponse, "items" | "nextPageToken">;
    const fetchComments = async (previous?: StepData): Promise<StepData> => {
      const { items: prevItems = [], nextPageToken: pageToken } =
        previous || {};

      const params = new URLSearchParams({
        part: ["snippet", "replies"].join(","),
        videoId,
        maxResults: "100",
        order: "time",
        ...(pageToken !== undefined ? { pageToken } : {}),
        key: process.env.YOUTUBE_API_KEY || "",
      });

      const response = await this.fetchWithRetry(
        `${url}?${params.toString()}`,
      ).then((res) => res.json());

      const { items = [], nextPageToken } = response;

      const nextItems = [...prevItems, ...items];

      const continueFetching =
        nextPageToken !== undefined && nextItems.length < maxResults;

      if (continueFetching) {
        return await fetchComments({
          items: nextItems,
          nextPageToken,
        });
      } else {
        return {
          items: nextItems,
        };
      }
    };

    return (await fetchComments()).items;
  };
}
