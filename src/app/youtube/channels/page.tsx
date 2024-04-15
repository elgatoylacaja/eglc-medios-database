import Link from "next/link";
import { fetchFromSheets } from "../../../lib/sheets";

export default async function Page() {
  const rows = await fetchFromSheets();
  return (
    <div className="flex flex-col">
      {rows.map((row) => {
        return (
          <Link
            href={`/youtube/channels/${row.Handle.replace("@", "")}`}
            className="hover:underline hover:text-blue-500"
            key={row.Handle}
          >
            {row.Canal}
          </Link>
        );
      })}
    </div>
  );
}
