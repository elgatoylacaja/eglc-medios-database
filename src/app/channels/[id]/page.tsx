import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";
import { ArrowLeft, Trash, Youtube } from "react-feather";
import Link from "next/link";

export default async function Page(props: {
  // receive route params
  params: { id: string };
}) {
  const where = props.params.id.startsWith("%40")
    ? { handle: props.params.id.replace("%40", "@") }
    : { id: props.params.id };

  console.log({ where });

  const channel = await prisma.channel.findFirst({
    where,
    include: {
      videos: {
        select: {
          title: true,
        },
      },
    },
  });

  if (channel !== null) {
    const comments = await prisma.comment.count({
      where: {
        video: {
          channelId: channel.id,
        },
      },
    });

    const oldestVideo = await prisma.video.findFirst({
      where: {
        channelId: channel.id,
      },
      orderBy: {
        publishedAt: "asc",
      },
    });

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <Link
            href="/"
            className="flex gap-1 justify-center items-center w-fit py-1 px-2 bg-gray-200 rounded"
          >
            <ArrowLeft size={16} /> <span>Back</span>
          </Link>
          <Link
            target="_blank"
            href={`https://youtube.com/channel/${channel.id}`}
            className="flex gap-1 justify-center items-center w-fit py-1 px-2 bg-gray-200 rounded"
          >
            <Youtube size={16} /> <span>Channel</span>
          </Link>
        </div>
        <div className="flex flex-col gap-0.5">
          <h1>{channel.handle}</h1>
          <p>
            Videos: {channel.videos.length} / {channel.videoCount} - (
            {((channel.videos.length / channel.videoCount) * 100).toFixed(2)}%)
          </p>
          <p>Comments: {comments}</p>
          {oldestVideo ? (
            <p>
              Oldest video:{" "}
              <Link
                target="_blank"
                href={`https://youtube.com/watch?v=${oldestVideo.id}`}
              >
                {oldestVideo.title}
              </Link>{" "}
              - {oldestVideo.publishedAt.toString()}
            </p>
          ) : null}
        </div>
      </div>
    );
  } else {
    notFound();
  }
}
