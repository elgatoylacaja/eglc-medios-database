import { describe, it, expect, vi } from "vitest";
import {
  chunkArray,
  executeSequentially,
  executeSequentiallyInChunks,
  keepUniqueBy,
  mapWithConcurrency,
  normalizeItem,
  videosToTsv,
} from "./utils";
import type { Video as PrismaVideo } from "@prisma/client";
import type { Item } from "./types";

function makeVideo(overrides: Partial<PrismaVideo> = {}): PrismaVideo {
  return {
    id: "v1",
    channelId: "ch1",
    title: "Test Video",
    description: "desc",
    publishedAt: new Date("2024-01-01"),
    thumbnail: "",
    duration: 120,
    viewCount: BigInt(1000),
    likeCount: 50,
    commentCount: 10,
    ...overrides,
  };
}

describe("chunkArray", () => {
  it("splits into equal chunks", () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("handles a remainder chunk", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it("chunk size larger than array returns single chunk", () => {
    expect(chunkArray([1, 2], 10)).toEqual([[1, 2]]);
  });
});

describe("keepUniqueBy", () => {
  it("removes duplicates by key fn", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "a" }];
    expect(keepUniqueBy((x) => x.id, items)).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("preserves order, keeps first occurrence", () => {
    const items = [{ v: 1 }, { v: 2 }, { v: 1 }];
    expect(keepUniqueBy((x) => String(x.v), items)).toEqual([{ v: 1 }, { v: 2 }]);
  });
});

describe("executeSequentially", () => {
  it("runs fns in order and collects results", async () => {
    const order: number[] = [];
    const fns = [1, 2, 3].map((n) => async () => {
      order.push(n);
      return n * 2;
    });
    const results = await executeSequentially(fns);
    expect(results).toEqual([2, 4, 6]);
    expect(order).toEqual([1, 2, 3]);
  });
});

describe("executeSequentiallyInChunks", () => {
  it("passes chunks to fn and flattens results", async () => {
    const received: number[][] = [];
    const fn = async (chunk: number[]) => {
      received.push(chunk);
      return chunk.map((x) => x * 2);
    };
    const result = await executeSequentiallyInChunks([1, 2, 3, 4, 5], 2, fn);
    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(received).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe("mapWithConcurrency", () => {
  it("returns results in input order regardless of completion order", async () => {
    const delays = [30, 10, 20];
    const fn = (ms: number) =>
      new Promise<number>((res) => setTimeout(() => res(ms), ms));
    const results = await mapWithConcurrency(delays, 3, fn);
    expect(results).toEqual([30, 10, 20]);
  });

  it("respects concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const fn = async (_: number) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 10));
      active--;
    };
    await mapWithConcurrency([1, 2, 3, 4, 5], 2, fn);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("calls onProgress with correct totals", async () => {
    const progress: number[] = [];
    await mapWithConcurrency([1, 2, 3], 1, async (x) => x, ({ completed }) =>
      progress.push(completed),
    );
    expect(progress).toEqual([1, 2, 3]);
  });

  it("handles empty array", async () => {
    const results = await mapWithConcurrency([], 2, async (x: number) => x);
    expect(results).toEqual([]);
  });
});

describe("videosToTsv", () => {
  it("returns empty string for empty array", () => {
    expect(videosToTsv([])).toBe("");
  });

  it("includes header row without description column", () => {
    const video = makeVideo();
    const tsv = videosToTsv([video]);
    const [header] = tsv.split("\n");
    expect(header).not.toContain("description");
    expect(header).toContain("title");
    expect(header).toContain("viewCount");
  });

  it("produces one data row per video", () => {
    const videos = [makeVideo({ id: "v1" }), makeVideo({ id: "v2" })];
    const lines = videosToTsv(videos).split("\n").filter(Boolean);
    expect(lines).toHaveLength(3); // header + 2 rows
  });
});

describe("normalizeItem", () => {
  it("deduplicates videos with the same id", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const item = {
      channel: { id: "ch1" } as Item["channel"],
      videos: [
        { id: "v1", comments: [] },
        { id: "v2", comments: [] },
        { id: "v1", comments: [] },
      ],
    } as unknown as Item;

    const result = normalizeItem(item);
    expect(result.videos).toHaveLength(2);
    expect(result.videos.map((v) => v.id)).toEqual(["v1", "v2"]);
    consoleSpy.mockRestore();
  });

  it("returns item unchanged when no duplicates", () => {
    const item = {
      channel: { id: "ch1" } as Item["channel"],
      videos: [{ id: "v1", comments: [] }, { id: "v2", comments: [] }],
    } as unknown as Item;

    const result = normalizeItem(item);
    expect(result.videos).toHaveLength(2);
  });
});
