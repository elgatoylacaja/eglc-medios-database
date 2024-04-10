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

type Thumbnails = Partial<
  Record<"default" | "medium" | "high" | "standard" | "maxres", Thumbnail>
>;

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

export type ChannelItem = {
  kind: "youtube#channel";
  etag: string;
  id: string;
  snippet: ChannelSnippet;
  contentDetails: ChannelContentDetails;
  statistics: Statistics;
};

export type ChannelListResponse = {
  kind: string;
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
  kind: string;
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
};

type VideoContentDetails = {
  duration: string;
  dimension: string;
};

type VideoStatistics = {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
};

export type VideoItem = {
  kind: string;
  etag: string;
  id: string;
  snippet: VideoSnippet;
  contentDetails: VideoContentDetails;
  statistics: VideoStatistics;
};

export type VideoListResponse = {
  kind: string;
  etag: string;
  pageInfo: PageInfo;
  items: VideoItem[];
};

type TopLevelCommentSnippet = {
  channelId: string;
  videoId: string;
  topLevelComment: CommentItem;
};

type CommentSnippet = {
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl: string;
  authorChannelId: { value: string };
  channelId: string;
  textDisplay: string;
  textOriginal: string;
  parentId: string;
  canRate: boolean;
  viewerRating: string;
  likeCount: number;
  moderationStatus: string;
};

type CommentItem = {
  kind: string;
  etag: string;
  id: string;
  snippet: CommentSnippet;
};

type TopLevelCommentItem = {
  kind: string;
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

export type DatabaseItem = {
  name: string;
  handle: string;
  channel: Pick<ChannelItem, "id"> &
    Pick<
      ChannelItem["statistics"],
      "subscriberCount" | "videoCount" | "viewCount"
    >;
  videos: (Pick<VideoItem, "id"> &
    Pick<VideoItem["snippet"], "title" | "publishedAt"> &
    Pick<VideoItem["statistics"], "viewCount" | "likeCount" | "commentCount"> &
    Pick<VideoItem["contentDetails"], "duration"> & {
      comments: (Pick<CommentSnippet, "textDisplay" | "authorChannelUrl"> & {
        authorChannelId: CommentSnippet["authorChannelId"]["value"];
      })[];
    })[];
};
