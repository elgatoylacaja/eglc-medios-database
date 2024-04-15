import { parse } from "iso8601-duration";
import Link from "next/link";
import { Calendar, Clock, Eye, MessageCircle, ThumbsUp } from "react-feather";
import { twMerge } from "tailwind-merge";
import { ChannelItem, VideoItem } from "../lib/types";
import { getThumbnail } from "../lib/utils";

export default function VideoCard(props: {
  channel?: ChannelItem;
  video: VideoItem;
  className?: string;
}) {
  const { channel, video, className } = props;
  const duration = parse(video.contentDetails.duration);
  const [hh, mm, ss] = [
    duration.hours?.toString().padStart(2, "0"),
    duration.minutes?.toString().padStart(2, "0"),
    duration.seconds?.toString().padStart(2, "0"),
  ];

  return (
    <Link
      key={video.id}
      className={twMerge(
        "col-span-4 flex flex-col gap-2 hover:bg-black/5 group rounded overflow-hidden transition-colors",
        className
      )}
      href={
        channel
          ? `/youtube/channels/${channel.snippet.customUrl.replace(
              "@",
              ""
            )}/videos/${video.id}`
          : `https://youtube.com/watch?v=${video.id}`
      }
      target="_blank"
    >
      <img
        className="group-hover:scale-105 transition-transform"
        src={getThumbnail(video.snippet.thumbnails)}
        alt=""
      />
      <div className="flex flex-col gap-1 p-1">
        <div className="text-sm">{video.snippet.title}</div>
        <p className="text-xs line-clamp-3">{video.snippet.description}</p>
        <div className="flex flex-wrap gap-1">
          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Calendar size={12} />
            <span>
              Uploaded:{" "}
              {new Date(video.snippet.publishedAt).toLocaleDateString("es-AR")}
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Clock size={12} />
            <span>
              Duration: {hh}:{mm}:{ss}
            </span>
          </div>

          {video.statistics.likeCount && (
            <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
              <ThumbsUp size={12} />
              <span>
                Likes:{" "}
                {parseInt(video.statistics.likeCount)
                  .toLocaleString()
                  .replace(",", ".")}
              </span>
            </div>
          )}

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <MessageCircle size={12} />
            <span>
              Comments:{" "}
              {parseInt(video.statistics.commentCount)
                .toLocaleString()
                .replace(",", ".")}
            </span>
          </div>

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Eye size={12} />
            <span>
              Views:{" "}
              {parseInt(video.statistics.viewCount)
                .toLocaleString()
                .replace(",", ".")}
            </span>
          </div>

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <MessageCircle size={12} /> / <Eye size={12} />
            <span>
              Comments per view:{" "}
              {(
                parseInt(video.statistics.commentCount) /
                parseInt(video.statistics.viewCount)
              ).toFixed(6)}
            </span>
          </div>

          {video.statistics.likeCount && (
            <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
              <ThumbsUp size={12} /> / <Eye size={12} />
              <span>
                Likes per view:{" "}
                {(
                  parseInt(video.statistics.likeCount) /
                  parseInt(video.statistics.viewCount)
                ).toFixed(6)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
