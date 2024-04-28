"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseAsIsoDateTime, useQueryState } from "nuqs";
import { useCallback, useTransition } from "react";
import { X } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function DateRange() {
  const [dateStart, setDateStart] = useQueryState(
    "date-start",
    parseAsIsoDateTime.withDefault(new Date("2020-01-01T00:00:00Z"))
  );
  const [dateEnd, setDateEnd] = useQueryState(
    "date-end",
    parseAsIsoDateTime.withDefault(new Date("2024-05-01T00:00:00Z"))
  );

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(() => {
    const searchParams = new URLSearchParams(params);
    searchParams.set("date-start", dateStart.toISOString());
    searchParams.set("date-end", dateEnd.toISOString());
    const nextRoute = `${pathname}?${searchParams.toString()}`;
    console.log(nextRoute);
    startTransition(() => {
      router.push(nextRoute);
    });
  }, [dateStart, dateEnd]);

  return (
    <div
      className={twMerge(
        "flex items-center gap-1.5",
        isPending ? "opacity-50" : ""
      )}
    >
      <div className="flex font-mono justify-between items-center w-full border border-gray-300 rounded px-1 py-0 leading-none text-xs self-stretch gap-2">
        <input
          type="date"
          className="w-24"
          name="start"
          id="start"
          min={"2020-01-01"}
          max={"2024-04-01"}
          value={dateStart.toISOString().split("T")[0]}
          onChange={(e) => {
            const date = e.target.valueAsDate;
            if (date !== null) {
              setDateStart(date);
            }
          }}
        />
        <span className="text-xs">to</span>
        <input
          type="date"
          className="w-24"
          name="end"
          id="end"
          min={"2020-01-01"}
          max={"2024-04-01"}
          value={dateEnd.toISOString().split("T")[0]}
          onChange={(e) => {
            const date = e.target.valueAsDate;
            console.log(date);
            if (date !== null) {
              setDateEnd(date);
            }
          }}
        />
        <button
          disabled={isPending}
          onClick={() => {
            setDateStart(new Date("2020-01-01T00:00:00Z"));
            setDateEnd(new Date("2024-04-01T00:00:00Z"));
          }}
        >
          <X size={16} />
        </button>
      </div>
      <button
        disabled={isPending}
        className="border border-gray-300 rounded p-1 text-xs"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  );
}
