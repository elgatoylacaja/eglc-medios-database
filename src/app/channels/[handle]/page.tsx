import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "react-feather";
import { twMerge } from "tailwind-merge";
import ChannelCard from "../../../components/ChannelCard";
import prisma from "../../../lib/prisma";
import Header from "./header";
import Videos, { VideosSkeleton } from "./videos";

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

export default async function Page({
  params: { handle },
  searchParams: {
    sortBy = "uploaded",
    order = "desc",
    page = "1",
    search = "",
  },
}: Props) {
  const props = {
    params: { handle },
    searchParams: { sortBy, order, page, search },
  };

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

      <Header
        {...{
          params: { handle },
          searchParams: { sortBy, order, page, search },
        }}
      />

      <Suspense
        fallback={<VideosSkeleton />}
        key={JSON.stringify(props.searchParams)}
      >
        <Videos {...props} channelId={channel.id} />
      </Suspense>
    </div>
  );
}
