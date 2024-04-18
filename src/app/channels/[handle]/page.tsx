import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  ThumbsUp,
} from "react-feather";
import { twMerge } from "tailwind-merge";
import ChannelCard from "../../../components/ChannelCard";
import VideoCard from "../../../components/VideoCard";
import prisma from "../../../lib/prisma";
import SearchBox from "./SearchBox";

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
  };
};

const className =
  "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-colors hover:bg-black/20";

const PAGE_SIZE = 48;

async function Videos(
  props: Required<Props["searchParams"] & Props["params"]> & {
    channelId: string;
  }
) {
  const { sortBy, order, page, channelId, handle } = props;

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
    OR: [
      { title: { contains: props.search, mode: "insensitive" as const } },
      // { description: { contains: props.search, mode: "insensitive" as const } },
    ],
  };

  const pages = await prisma.video
    .count({ where })
    .then((count) => Math.ceil(count / PAGE_SIZE));

  const videos = await prisma.video.findMany({
    where,
    take: PAGE_SIZE,
    skip: (parseInt(page) - 1) * PAGE_SIZE,
    orderBy: orderBy[sortBy],
  });

  return (
    <>
      <div className="grid grid-cols-12 gap-3">
        {videos.map((video) => (
          <VideoCard
            video={video}
            key={video.id}
            className="col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2"
          />
        ))}
      </div>
      {pages > 1 ? (
        <div className="flex flex-wrap gap-2 justify-center items-center">
          <Link
            href={`/channels/${handle}?sortBy=${sortBy}&order=${order}&page=${Math.max(
              1,
              parseInt(page) - 1
            )}`}
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
          <span className="text-sm">
            {page}/{pages}
          </span>
          <Link
            href={`/channels/${handle}?sortBy=${sortBy}&order=${order}&page=${Math.min(
              pages,
              parseInt(page) + 1
            )}`}
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
        </div>
      ) : null}
    </>
  );
}

export default async function Page(props: Props) {
  const { params, searchParams } = props;
  const { handle } = params;
  const {
    sortBy = "uploaded",
    order = "desc",
    page = "1",
    search = "",
  } = searchParams;

  const oppositeOrder = order === "asc" ? "desc" : "asc";

  const channel = await prisma.channel.findFirst({
    where: { handle: `@${handle}` },
  });

  if (channel === null) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-2">
      <Link href={`/channels`} key="uploaded" className={twMerge(className)}>
        <ArrowLeft size={12} />
        <span>Back</span>
      </Link>

      <ChannelCard channel={channel} />

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/channels/${handle}?sortBy=uploaded&order=${order}&search=${search}`}
          key="uploaded"
          className={twMerge(
            className,
            sortBy === "uploaded" ? "bg-black/30" : ""
          )}
        >
          <Calendar size={12} />
          <span>Uploaded</span>
        </Link>
        <Link
          href={`/channels/${handle}?sortBy=views&order=${order}&search=${search}`}
          key="views"
          className={twMerge(
            className,
            sortBy === "views" ? "bg-black/30" : ""
          )}
        >
          <Eye size={12} />
          <span>Views</span>
        </Link>
        <Link
          href={`/channels/${handle}?sortBy=likes&order=${order}&search=${search}`}
          key="likes"
          className={twMerge(
            className,
            sortBy === "likes" ? "bg-black/30" : ""
          )}
        >
          <ThumbsUp size={12} />
          <span>Likes</span>
        </Link>
        <Link
          href={`/channels/${handle}?sortBy=comments&order=${order}&search=${search}`}
          key="comments"
          className={twMerge(
            className,
            sortBy === "comments" ? "bg-black/30" : ""
          )}
        >
          <MessageCircle size={12} />
          <span>Comments</span>
        </Link>
        <Link
          href={`/channels/${handle}?sortBy=duration&order=${order}&search=${search}`}
          key="duration"
          className={twMerge(
            className,
            sortBy === "duration" ? "bg-black/30" : ""
          )}
        >
          <Clock size={12} />
          <span>Duration</span>
        </Link>

        <Link
          href={`/channels/${handle}?sortBy=likes_per_view&order=${order}&search=${search}`}
          key="likes_per_view"
          className={twMerge(
            className,
            sortBy === "likes_per_view" ? "bg-black/30" : ""
          )}
        >
          <ThumbsUp size={12} /> / <Eye size={12} />
          <span>Likes per view</span>
        </Link>
        <Link
          href={`/channels/${handle}?sortBy=comments_per_view&order=${order}&search=${search}`}
          key="comments_per_view"
          className={twMerge(
            className,
            sortBy === "comments_per_view" ? "bg-black/30" : ""
          )}
        >
          <MessageCircle size={12} /> / <Eye size={12} />
          <span>Comments per view</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className={twMerge(className, "hover:bg-black/5 cursor")}>
          {order === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>
            Ordenado de manera:{" "}
            {{ asc: "Ascendente", desc: "Descendente" }[order]}
          </span>
        </div>
        <Link
          href={`/channels/${handle}?sortBy=${sortBy}&order=${oppositeOrder}&search=${search}`}
          className={twMerge(className)}
        >
          Toggle
        </Link>
        <SearchBox />
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <Videos
          {...{ handle, sortBy, order, page, search }}
          channelId={channel.id}
        />
      </Suspense>
    </div>
  );
}
