import { Video } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MessageCircle,
  ThumbsUp,
  Video as VideoIcon,
} from "react-feather";
import { twMerge } from "tailwind-merge";
import ChannelCard from "../../../../components/ChannelCard";
import VideoCard from "../../../../components/VideoCard";
import prisma from "../../../../lib/prisma";

type Props = {
  params: { handle: string };
  searchParams: { sortBy: SortKey };
};

type SortFn = (a: Video, b: Video) => number;
type SortKey =
  | "uploaded"
  | "views"
  | "likes"
  | "comments"
  | "likes_per_view"
  | "comments_per_view";

const sortFns: Record<SortKey, SortFn> = {
  uploaded: (a, b) => {
    return a.publishedAt < b.publishedAt ? 1 : -1;
  },
  views: (a, b) => {
    return parseInt(b.viewCount.toString()) - parseInt(a.viewCount.toString());
  },
  likes: (a, b) => {
    return b.likeCount - a.likeCount;
  },
  comments: (a, b) => {
    return b.commentCount - a.commentCount;
  },
  likes_per_view: (a, b) => {
    return (
      b.likeCount / parseInt(b.viewCount.toString()) -
      a.likeCount / parseInt(a.viewCount.toString())
    );
  },
  comments_per_view: (a, b) => {
    return (
      b.commentCount / parseInt(b.viewCount.toString()) -
      a.commentCount / parseInt(a.viewCount.toString())
    );
  },
} as const;

export default async function Page(props: Props) {
  const {
    params: { handle },
    searchParams: { sortBy = "uploaded" },
  } = props;

  // const channel = await API.fetchChannelData(`@${handle}`);
  const channel = await prisma.channel.findFirst({
    where: { handle: `@${handle}` },
  });

  if (channel === null) {
    return notFound();
  }

  const orderBy = {
    uploaded: { publishedAt: "desc" },
    views: { viewCount: "desc" },
    likes: { likeCount: "desc" },
    comments: { commentCount: "desc" },
    likes_per_view: { likeCount: "desc" },
    comments_per_view: { commentCount: "desc" },
  } as const;

  const videos = await prisma.video.findMany({
    where: { channelId: channel.id },
    take: 50,
    orderBy: orderBy[sortBy],
  });

  const videoCount = await prisma.video.count({
    where: { channelId: channel.id },
  });

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
