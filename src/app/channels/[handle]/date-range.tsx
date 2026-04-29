"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseAsIsoDateTime, useQueryState } from "nuqs";
import { useCallback, useTransition } from "react";
import { X } from "react-feather";
import { twMerge } from "tailwind-merge";

const timeRange = {
  min: "2020-01-01T00:00:00Z",
  max: new Date().toISOString(),
};

export default function DateRange() {
  const [dateStart, setDateStart] = useQueryState(
    "date-start",
    parseAsIsoDateTime.withDefault(new Date(timeRange.min))
  );
  const [dateEnd, setDateEnd] = useQueryState(
    "date-end",
    parseAsIsoDateTime.withDefault(new Date(timeRange.max))
  );

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(() => {
    const searchParams = new URLSearchParams(params);
    searchParams.set("date-start", dateStart.toISOString());
    searchParams.set("date-end", dateEnd.toISOString());
    searchParams.delete("page");

    const nextRoute = `${pathname}?${searchParams.toString()}`;

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
          min={timeRange.min}
          max={dateEnd.toISOString().split("T")[0]}
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
          min={dateStart.toISOString().split("T")[0]}
          max={timeRange.max}
          value={dateEnd.toISOString().split("T")[0]}
          onChange={(e) => {
            const date = e.target.valueAsDate;
            if (date !== null) {
              setDateEnd(date);
            }
          }}
        />
        <button
          disabled={isPending}
          onClick={() => {
            setDateStart(new Date(timeRange.min));
            setDateEnd(new Date(timeRange.max));
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
