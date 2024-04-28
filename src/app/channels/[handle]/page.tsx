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
    "date-start": string;
    "date-end": string;
  };
};

const className =
  "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-colors hover:bg-black/20";

export default async function Page(initialProps: Props) {
  const {
    params: { handle },
    searchParams: {
      sortBy = "uploaded",
      order = "desc",
      page = "1",
      search = "",
      "date-start": dateStart = "2020-01-01T00:00:00.000Z",
      "date-end": dateEnd = "2024-05-01T00:00:00.000Z",
    },
  } = initialProps;

  const props = {
    params: { handle },
    searchParams: {
      sortBy,
      order,
      page,
      search,
      "date-start": dateStart,
      "date-end": dateEnd,
    },
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
          searchParams: {
            sortBy,
            order,
            page,
            search,
            "date-start": dateStart,
            "date-end": dateEnd,
          },
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
