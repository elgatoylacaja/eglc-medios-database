import Link from "next/link";
import { ArrowLeft, ArrowRight } from "react-feather";
import { twMerge } from "tailwind-merge";
import VideoCard from "@/components/VideoCard";
import VideoSkeleton from "@/components/VideoSkeleton";
import prisma from "@/lib/prisma";
import { VideosSearchParams } from "./page";

type Props = {
  params: { handle: string };
  searchParams: Required<VideosSearchParams>;
};

const className =
  "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-colors hover:bg-black/20";

const PAGE_SIZE = 48;

const createParams = (params: VideosSearchParams) => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key as keyof VideosSearchParams];
    if (value !== undefined) {
      searchParams.set(key, value);
    }
  }
  return searchParams.toString();
};

export default async function Videos(props: Props & { channelId: string }) {
  const {
    params: { handle },
    channelId,
    searchParams,
  } = props;

  const {
    sortBy,
    order,
    page,
    search,
    "date-start": dateStart,
    "date-end": dateEnd,
  } = searchParams;

  const orderBy = {
    uploaded: { publishedAt: order },
    views: { viewCount: order },
    likes: { likeCount: order },
    comments: { commentCount: order },
    likes_per_view: { likeCount: order },
    comments_per_view: { commentCount: order },
    duration: { duration: order },
  } as const;

  const where = {
    channelId,
    title: { contains: search, mode: "insensitive" as const },
    publishedAt: {
      gte: new Date(dateStart),
      lte: new Date(dateEnd),
    },
  };

  const videoCount = await prisma.video.count({ where });

  const pages = Math.ceil(videoCount / PAGE_SIZE);

  const videos = await prisma.video.findMany({
    where,
    take: PAGE_SIZE,
    skip: (parseInt(page) - 1) * PAGE_SIZE,
    orderBy: orderBy[sortBy],
  });

  const hasPrev = parseInt(page) > 1;
  const hasNext = pages > parseInt(page);

  return (
    <div className="flex flex-col gap-2">
      <div className={twMerge(className, "hover:bg-black/5 cursor")}>
        Resultados: {videoCount}
      </div>
      <div className="grid grid-cols-12 gap-3">
        {videos.map((video) => (
          <VideoCard
            video={video}
            key={video.id}
            className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center items-center mt-4">
        {pages > 1 ? (
          <>
            <Link
              href={`/channels/${handle}?${createParams({
                ...searchParams,
                page: Math.max(1, parseInt(page) - 1).toString(),
              })}`}
              className={twMerge("link-button", !hasPrev ? "disabled" : "")}
            >
              <ArrowLeft size={12} />
              <span>Previous</span>
            </Link>
            <span className="text-sm font-mono">
              {page}/{pages}
            </span>
            <Link
              href={`/channels/${handle}?${createParams({
                ...searchParams,
                page: Math.min(pages, parseInt(page) + 1).toString(),
              })}`}
              className={twMerge("link-button", !hasNext ? "disabled" : "")}
            >
              <ArrowRight size={12} />
              <span>Next</span>
            </Link>
          </>
        ) : null}
        {videos.length > 0 ? (
          <>
            <Link
              className={"link-button"}
              href={`/api/channels/${handle}/download?${new URLSearchParams({
                ...props.searchParams,
                handle,
                channelId,
                type: "json",
              }).toString()}`}
            >
              Download JSON
            </Link>
            <Link
              className={"link-button"}
              href={`/api/channels/${handle}/download?${new URLSearchParams({
                ...props.searchParams,
                handle,
                channelId,
                type: "tsv",
              }).toString()}`}
            >
              Download TSV
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function VideosSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-3">
        {Array.from({ length: 48 }).map((_, i) => (
          <VideoSkeleton
            key={i}
            className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2"
          />
        ))}
      </div>
    </div>
  );
}
