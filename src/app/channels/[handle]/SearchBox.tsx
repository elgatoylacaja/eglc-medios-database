"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";

export default function SearchBox() {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const handleSearch = (query: string) => {
    const searchParams = new URLSearchParams(params);
    searchParams.set("search", query);
    searchParams.delete("page");
    const nextRoute = `${pathname}?${searchParams.toString()}`;
    router.push(nextRoute);
  };

  return (
    <div className="flex gap-1.5">
      <input
        type="text"
        placeholder="Search"
        className="w-48 border border-gray-300 rounded px-1 py-0 leading-none text-xs"
        value={search}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(search);
          }
        }}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      <button
        className="border border-gray-300 rounded p-1 text-xs"
        onClick={() => {
          handleSearch(search);
        }}
      >
        Search
      </button>
    </div>
  );
}
