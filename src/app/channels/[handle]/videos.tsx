import Link from "next/link";
import { ArrowLeft, ArrowRight } from "react-feather";
import { twMerge } from "tailwind-merge";
import VideoCard from "../../../components/VideoCard";
import VideoSkeleton from "../../../components/VideoSkeleton";
import prisma from "../../../lib/prisma";

type SortKey =
  | "uploaded"
  | "views"
  | "likes"
  | "comments"
  | "likes_per_view"
  | "comments_per_view"
  | "duration";

type Props = {
  params: { handle: string };
  searchParams: {
    sortBy: SortKey;
    order: "asc" | "desc";
    page?: string;
    search?: string;
    "date-start"?: string;
    "date-end"?: string;
  };
};

const className =
  "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-colors hover:bg-black/20";

const PAGE_SIZE = 48;

export default async function Videos(props: Props & { channelId: string }) {
  const {
    params: { handle },
    channelId,
    searchParams: {
      sortBy,
      order,
      page = "1",
      search = "",
      "date-start": dateStart = "2020-01-01T00:00:00.000Z",
      "date-end": dateEnd = "2024-05-01T00:00:00.000Z",
    },
  } = props;

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
              href={`/channels/${handle}?sortBy=${sortBy}&order=${order}&page=${Math.max(
                1,
                parseInt(page) - 1
              )}&search=${search}`}
              className={twMerge(
                className,
                page === "1"
                  ? "pointer-events-none cursor-not-allowed opacity-40"
                  : ""
              )}
            >
              <ArrowLeft size={12} />
              <span>Previous</span>
            </Link>
            <span className="text-sm font-mono">
              {page}/{pages}
            </span>
            <Link
              href={`/channels/${handle}?sortBy=${sortBy}&order=${order}&page=${Math.min(
                pages,
                parseInt(page) + 1
              )}&search=${search}`}
              className={twMerge(
                className,
                page === pages.toString()
                  ? "pointer-events-none cursor-not-allowed opacity-90"
                  : ""
              )}
            >
              <ArrowRight size={12} />
              <span>Next</span>
            </Link>
          </>
        ) : null}
        {videos.length > 0 ? (
          <>
            <Link
              className={twMerge(className)}
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
              className={twMerge(className)}
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
