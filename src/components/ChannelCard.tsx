import { Channel } from "@prisma/client";
import { Calendar, MessageCircle, User, Video } from "react-feather";
import { twMerge } from "tailwind-merge";
import prisma from "@/lib/prisma";

export default async function ChannelCard(props: {
  channel: Channel;
  className?: string;
}) {
  const {
    channel: {
      id,
      thumbnail,
      name,
      handle,
      publishedAt,
      videoCount = 0,
      subscriberCount = 0,
    },
    className,
  } = props;

  const [savedVideoCount, commentCount, savedCommentCount] = await Promise.all([
    prisma.video.count({
      where: { channelId: id },
    }),
    prisma.video.aggregate({
      where: { channelId: id },
      _sum: { commentCount: true },
    }),
    prisma.comment.count({
      where: { channelId: id },
    }),
  ]);

  return (
    <div
      className={twMerge("relative rounded-lg w-fit bg-gray-200", className)}
    >
      <div className="flex flex-col gap-2 p-2 bottom-0 left-0 w-full">
        <div className="flex gap-2">
          <img className="w-12 h-12 rounded-full" src={thumbnail} />
          <div className="flex flex-col leading-none">
            <h1 className="text-xl">{name}</h1>
            <span className="text-xs">{handle}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <Video size={12} />
            <span>
              Videos: {savedVideoCount.toLocaleString().replace(",", ".")} /{" "}
              {videoCount.toLocaleString().replace(",", ".")} - (
              {((savedVideoCount / videoCount) * 100).toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <User size={12} />
            <span>
              Subscribers: {subscriberCount.toLocaleString().replace(",", ".")}
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <Calendar size={12} />
            <span>
              Created at: {new Date(publishedAt).toLocaleDateString("es-AR")}
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <MessageCircle size={12} />
            <span>
              Comments: {savedCommentCount.toLocaleString().replace(",", ".")} /{" "}
              {(commentCount._sum.commentCount || 0)
                .toLocaleString()
                .replace(",", ".")}{" "}
              - (
              {(
                (savedCommentCount / (commentCount._sum.commentCount || 1)) *
                100
              ).toFixed(2)}
              %)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
