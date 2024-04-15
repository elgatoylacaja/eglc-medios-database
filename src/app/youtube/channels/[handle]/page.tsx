import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MessageCircle,
  ThumbsUp,
} from "react-feather";
import { twMerge } from "tailwind-merge";
import ChannelCard from "../../../../components/ChannelCard";
import VideoCard from "../../../../components/VideoCard";
import { VideoItem } from "../../../../lib/types";
import { isEligible } from "../../../../lib/utils";
import { YoutubeAPI } from "../../../../lib/youtube";

type Props = {
  params: { handle: string };
  searchParams: { sortBy: string };
};

type SortFn = (a: VideoItem, b: VideoItem) => number;

const sortFns: Record<string, SortFn> = {
  uploaded: (a, b) => {
    return a.snippet.publishedAt < b.snippet.publishedAt ? 1 : -1;
  },
  views: (a, b) => {
    return parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount);
  },
  likes: (a, b) => {
    return (
      parseInt(b.statistics.likeCount || "0") -
      parseInt(a.statistics.likeCount || "0")
    );
  },
  comments: (a, b) => {
    return (
      parseInt(b.statistics.commentCount || "0") -
      parseInt(a.statistics.commentCount || "0")
    );
  },
  likes_per_view: (a, b) => {
    return (
      parseInt(b.statistics.likeCount || "0") /
        parseInt(b.statistics.viewCount) -
      parseInt(a.statistics.likeCount || "0") / parseInt(a.statistics.viewCount)
    );
  },
  comments_per_view: (a, b) => {
    return (
      parseInt(b.statistics.commentCount || "0") /
        parseInt(b.statistics.viewCount) -
      parseInt(a.statistics.commentCount || "0") /
        parseInt(a.statistics.viewCount)
    );
  },
};

export default async function Page(props: Props) {
  const {
    params: { handle },
    searchParams: { sortBy = "uploaded" },
  } = props;

  const API = new YoutubeAPI();

  const channel = await API.fetchChannelData(`@${handle}`);

  if (channel === undefined) {
    return notFound();
  }

  const videos = await API.fetchPlaylistItems(
    channel.contentDetails.relatedPlaylists.uploads,
    { maxResults: 50 }
  )
    .then((res) => {
      const ids = res.map((_) => _.snippet.resourceId.videoId);
      return API.fetchVideosData(ids);
    })
    .then((videos) => videos.filter(isEligible));

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={`/youtube/channels`}
        key="uploaded"
        className={twMerge(
          "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color"
        )}
      >
        <ArrowLeft size={12} />
        <span>Back</span>
      </Link>

      <ChannelCard channel={channel} />

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/youtube/channels/${handle}?sortBy=uploaded`}
          key="uploaded"
          className={twMerge(
            "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color",
            sortBy === "uploaded" ? "bg-black/30" : ""
          )}
        >
          <Calendar size={12} />
          <span>Uploaded</span>
        </Link>
        <Link
          href={`/youtube/channels/${handle}?sortBy=views`}
          key="views"
          className={twMerge(
            "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color",
            sortBy === "views" ? "bg-black/30" : ""
          )}
        >
          <Eye size={12} />
          <span>Views</span>
        </Link>
        <Link
          href={`/youtube/channels/${handle}?sortBy=likes`}
          key="likes"
          className={twMerge(
            "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color",
            sortBy === "likes" ? "bg-black/30" : ""
          )}
        >
          <ThumbsUp size={12} />
          <span>Likes</span>
        </Link>
        <Link
          href={`/youtube/channels/${handle}?sortBy=comments`}
          key="comments"
          className={twMerge(
            "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color",
            sortBy === "comments" ? "bg-black/30" : ""
          )}
        >
          <MessageCircle size={12} />
          <span>Comments</span>
        </Link>

        <Link
          href={`/youtube/channels/${handle}?sortBy=likes_per_view`}
          key="likes_per_view"
          className={twMerge(
            "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color",
            sortBy === "likes_per_view" ? "bg-black/30" : ""
          )}
        >
          <ThumbsUp size={12} /> / <Eye size={12} />
          <span>Likes per view</span>
        </Link>
        <Link
          href={`/youtube/channels/${handle}?sortBy=comments_per_view`}
          key="comments_per_view"
          className={twMerge(
            "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color",
            sortBy === "comments_per_view" ? "bg-black/30" : ""
          )}
        >
          <MessageCircle size={12} /> / <Eye size={12} />
          <span>Comments per view</span>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {videos.sort(sortFns[sortBy]).map((video) => (
          <VideoCard
            channel={channel}
            video={video}
            key={video.id}
            className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2"
          />
        ))}
      </div>
    </div>
  );
}
