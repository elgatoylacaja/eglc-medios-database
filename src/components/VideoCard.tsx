import { Video } from "@prisma/client";
import Link from "next/link";
import { Calendar, Clock, Eye, MessageCircle, ThumbsUp } from "react-feather";
import { twMerge } from "tailwind-merge";
import { secondsToString } from "@/lib/utils";

export default function VideoCard(props: { video: Video; className?: string }) {
  const { video, className } = props;
  const duration = secondsToString(video.duration);

  return (
    <Link
      key={video.id}
      className={twMerge(
        "col-span-4 flex flex-col gap-2 hover:bg-black/5 group rounded overflow-hidden transition-colors",
        className
      )}
      href={`https://youtube.com/watch?v=${video.id}`}
      target="_blank"
    >
      <img
        className="group-hover:scale-105 transition-transform aspect-video"
        src={video.thumbnail}
        alt=""
      />
      <div className="flex flex-col gap-1 p-1">
        <div className="text-sm">{video.title}</div>
        <p className="text-xs line-clamp-3 hover:line-clamp-none">
          {video.description}
        </p>
        <div className="flex flex-wrap gap-1">
          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Calendar size={12} />
            <span>
              Uploaded:{" "}
              {new Date(video.publishedAt).toLocaleDateString("es-AR")}
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Clock size={12} />
            <span>Duration: {duration}</span>
          </div>

          {video.likeCount ? (
            <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
              <ThumbsUp size={12} />
              <span>
                Likes: {video.likeCount.toLocaleString().replace(",", ".")}
              </span>
            </div>
          ) : null}

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <MessageCircle size={12} />
            <span>
              Comments: {video.commentCount.toLocaleString().replace(",", ".")}
            </span>
          </div>

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Eye size={12} />
            <span>
              Views: {video.viewCount.toLocaleString().replace(",", ".")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
