import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  ThumbsUp,
} from "react-feather";
import { twMerge } from "tailwind-merge";
import SearchBox from "./search-box";
import DateRange from "./date-range";

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

export default async function Header(props: Props) {
  const { params, searchParams } = props;
  const { handle } = params;
  const {
    sortBy = "uploaded",
    order = "desc",
    search = "",
    "date-start": dateStart = "2020-01-01T00:00:00.000Z",
    "date-end": dateEnd = "2024-05-01T00:00:00.000Z",
  } = searchParams;

  const oppositeOrder = order === "asc" ? "desc" : "asc";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/channels/${handle}?sortBy=uploaded&order=${order}&search=${search}&date-start=${dateStart}&date-end=${dateEnd}`}
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
          href={`/channels/${handle}?sortBy=views&order=${order}&search=${search}&date-start=${dateStart}&date-end=${dateEnd}`}
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
          href={`/channels/${handle}?sortBy=likes&order=${order}&search=${search}&date-start=${dateStart}&date-end=${dateEnd}`}
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
          href={`/channels/${handle}?sortBy=comments&order=${order}&search=${search}&date-start=${dateStart}&date-end=${dateEnd}`}
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
          href={`/channels/${handle}?sortBy=duration&order=${order}&search=${search}&date-start=${dateStart}&date-end=${dateEnd}`}
          key="duration"
          className={twMerge(
            className,
            sortBy === "duration" ? "bg-black/30" : ""
          )}
        >
          <Clock size={12} />
          <span>Duration</span>
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
          href={`/channels/${handle}?sortBy=${sortBy}&order=${oppositeOrder}&search=${search}&date-start=${dateStart}&date-end=${dateEnd}`}
          className={twMerge(className)}
        >
          Toggle
        </Link>
        <SearchBox />
      </div>
      <div className="flex flex-wrap gap-2">
        <DateRange />
      </div>
    </div>
  );
}
