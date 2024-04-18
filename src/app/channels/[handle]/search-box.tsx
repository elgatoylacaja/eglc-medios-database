"use client"
import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useTransition } from "react";
import { X } from "react-feather";
import { twMerge } from "tailwind-merge";

const SEARCH_DELAY = 500; // Tiempo de espera en milisegundos

export default function SearchBox() {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (query: string) => {
    const searchParams = new URLSearchParams(params);
    if (query !== "") {
      searchParams.set("search", query);
    } else {
      searchParams.delete("search");
    }
    searchParams.delete("page");
    const nextRoute = `${pathname}?${searchParams.toString()}`;
    startTransition(() => {
      router.push(nextRoute);
    });
  };

  const handleInputChange = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, SEARCH_DELAY);
  };

  const handleClearSearch = () => {
    setSearch("");
    handleSearch("");
  };

  return (
    <div
      className={twMerge(
        "flex items-center gap-1.5",
        isPending ? "opacity-50" : ""
      )}
    >
      <div className="flex justify-between items-center w-48 border border-gray-300 rounded px-1 py-0 leading-none text-xs self-stretch">
        <input
          // disabled={isPending}
          type="text"
          placeholder="Search"
          className="flex-1 w-full focus:outline-none"
          value={search}
          autoFocus
          onChange={(e) => handleInputChange(e.target.value)}
        />
        <button
          disabled={isPending}
          onClick={handleClearSearch}
        >
          <X size={16} />
        </button>
      </div>

      <button
        disabled={isPending}
        className="border border-gray-300 rounded p-1 text-xs"
        onClick={() => handleSearch(search)}
      >
        Search
      </button>
    </div>
  );
}

// "use client";

// import { usePathname, useRouter, useSearchParams } from "next/navigation";
// import { useQueryState } from "nuqs";
// import { useTransition } from "react";
// import { X } from "react-feather";
// import { twMerge } from "tailwind-merge";

// export default function SearchBox() {
//   const [search, setSearch] = useQueryState("search", { defaultValue: "" });
//   const router = useRouter();
//   const pathname = usePathname();
//   const params = useSearchParams();

//   const [isPending, startTransition] = useTransition();

//   const handleSearch = (query: string) => {
//     const searchParams = new URLSearchParams(params);
//     if (query !== "") {
//       searchParams.set("search", query);
//     } else {
//       searchParams.delete("search");
//     }
//     searchParams.delete("page");
//     const nextRoute = `${pathname}?${searchParams.toString()}`;
//     startTransition(() => {
//       router.push(nextRoute);
//     });
//   };

//   return (
//     <div
//       className={twMerge(
//         "flex items-center gap-1.5",
//         isPending ? "opacity-50" : ""
//       )}
//     >
//       <div className="flex justify-between items-center w-48 border border-gray-300 rounded px-1 py-0 leading-none text-xs self-stretch">
//         <input
//           disabled={isPending}
//           type="text"
//           placeholder="Search"
//           className="flex-1 w-full focus:outline-none"
//           value={search}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               handleSearch(search);
//             }
//           }}
//           onChange={(e) => {
//             setSearch(e.target.value);
//           }}
//         />
//         <button
//           disabled={isPending}
//           onClick={() => {
//             setSearch("");
//             handleSearch("");
//           }}
//         >
//           <X size={16} />
//         </button>
//       </div>

//       <button
//         disabled={isPending}
//         className="border border-gray-300 rounded p-1 text-xs"
//         onClick={() => {
//           handleSearch(search);
//         }}
//       >
//         Search
//       </button>
//     </div>
//   );
// }
