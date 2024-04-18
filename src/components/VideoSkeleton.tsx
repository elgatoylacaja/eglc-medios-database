import { Calendar, Clock, Eye, MessageCircle } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function VideoSkeleton(props: { className?: string }) {
  const { className } = props;

  return (
    <div
      className={twMerge(
        "col-span-4 flex flex-col gap-2 rounded overflow-hidden animate-pulse pointer-events-none",
        className
      )}
    >
      <div className="aspect-video bg-gray-500" />
      <div className="flex flex-col gap-1 p-1">
        <div className="text-sm line-clamp-2 text-gray-500">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit.
        </div>
        <p className="text-xs line-clamp-3 text-gray-500">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Pariatur
          quisquam minima laborum suscipit ipsa quae! Sunt, officia ut.
          Consectetur fuga iusto fugit voluptates ratione praesentium a,
          veritatis dolorem doloribus omnis?
        </p>
        <div className="flex flex-wrap gap-1 animate-pulse">
          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Calendar size={12} />
            <span className="opacity-0">Uploaded: dd/mm/yyyy</span>
          </div>
          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Clock size={12} />
            <span className="opacity-0">Duration: hh:mm:ss</span>
          </div>

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <MessageCircle size={12} />
            <span className="opacity-0">Comments: 1.000</span>
          </div>

          <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
            <Eye size={12} />
            <span className="opacity-0">Views: 100.000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
