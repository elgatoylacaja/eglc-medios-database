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

export default async function Header(props: Props) {
  const { params, searchParams } = props;
  const { handle } = params;
  const { sortBy = "uploaded", order = "desc", search = "" } = searchParams;

  const oppositeOrder = order === "asc" ? "desc" : "asc";

  return (
    <div className="flex flex-col gap-2">
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
    </div>
  );
}
