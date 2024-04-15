export type SheetsRow = {
  Canal: string;
  Handle: string;
  Url: string;
};

// Youtube
type Thumbnail = {
  url: string;
  width: number;
  height: number;
};

type PageInfo = {
  totalResults: number;
  resultsPerPage: number;
};

export type ThumbnailKey =
  | "default"
  | "medium"
  | "high"
  | "standard"
  | "maxres";
type Thumbnails = Partial<Record<ThumbnailKey, Thumbnail>>;

type ChannelSnippet = {
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnails: Thumbnails;
};

type RelatedPlaylists = {
  likes: string;
  uploads: string;
};

type ChannelContentDetails = {
  relatedPlaylists: RelatedPlaylists;
};

type Statistics = {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
};

type BrandingSettings = {
  channel: {
    title: string;
    description: string;
  };
  image?: {
    bannerExternalUrl: string;
  };
};

export type ChannelItem = {
  kind: "youtube#channel";
  etag: string;
  id: string;
  snippet: ChannelSnippet;
  contentDetails: ChannelContentDetails;
  statistics: Statistics;
  brandingSettings: BrandingSettings;
};

export type ChannelListResponse = {
  kind: "youtube#channelListResponse";
  etag: string;
  pageInfo: PageInfo;
  items: ChannelItem[];
};

type VideoInPlaylistSnippet = {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId: string;
  };
};

type VideoInPlaylistContentDetails = {
  videoId: string;
  videoPublishedAt: string;
};

export type PlaylistItem = {
  kind: "youtube#playlistItem";
  etag: string;
  id: string;
  snippet: VideoInPlaylistSnippet;
  contentDetails: VideoInPlaylistContentDetails;
};

export type PlaylistResponse = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  previousPageToken?: string;
  pageInfo: PageInfo;
  items: PlaylistItem[];
};

type VideoSnippet = {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
  channelTitle: string;
  liveBroadcastContent: "live" | "none" | "upcoming";
  tags: string[];
  categoryId: string;
  defaultLanguage: string;
};

type VideoContentDetails = {
  duration: string;
  dimension: string;
};

type VideoStatistics = {
  viewCount: string;
  likeCount?: string;
  favoriteCount: string;
  commentCount: string;
};

export type VideoItem = {
  kind: "youtube#video";
  etag: string;
  id: string;
  snippet: VideoSnippet;
  contentDetails: VideoContentDetails;
  statistics: VideoStatistics;
};

export type VideoListResponse = {
  kind: "youtube#videoListResponse";
  etag: string;
  pageInfo: PageInfo;
  items: VideoItem[];
};

type TopLevelCommentSnippet = {
  channelId: string;
  videoId: string;
  topLevelComment: CommentItem;
  canReply: boolean;
  totalReplyCount: number;
  isPublic: boolean;
};

type CommentSnippet = {
  channelId: string;
  videoId: string;
  textDisplay: string;
  textOriginal: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl: string;
  authorChannelId: { value: string };
  parentId: string;
  canRate: boolean;
  viewerRating: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
};

type CommentItem = {
  kind: "youtube#comment";
  etag: string;
  id: string;
  snippet: CommentSnippet;
};

type TopLevelCommentItem = {
  kind: "youtube#commentThread";
  etag: string;
  id: string;
  snippet: TopLevelCommentSnippet;
  replies?: {
    comments: CommentItem[];
  };
};

export type CommentListResponse = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: PageInfo;
  items: TopLevelCommentItem[];
};

type VideoWithComments = VideoItem & { comments: CommentSnippet[] };

export type FullChannelResult = {
  name: string;
  handle: string;
  channel: ChannelItem;
  videos: VideoWithComments[];
};

export type Item = {
  name: string;
  handle: string;
  channel: ChannelItem;
  videos: VideoWithComments[];
};