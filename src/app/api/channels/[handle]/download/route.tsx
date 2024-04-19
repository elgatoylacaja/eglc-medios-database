import { NextResponse, type NextRequest } from "next/server";
import prisma from "../../../../../lib/prisma";
import { videosToJson, videosToTsv } from "../../../../../lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const sortBy = searchParams.get("sortBy") || "uploaded";
  const order = searchParams.get("order") || "asc";
  const search = searchParams.get("search") || "";
  const handle = searchParams.get("handle") || "";
  const channelId = searchParams.get("channelId") || "";
  const type = searchParams.get("type") || "json";

  if (!channelId) {
    return new Response("Missing channelId", { status: 500 });
  }

  const where = {
    channelId,
    title: { contains: search, mode: "insensitive" as const },
  };

  const orderBy = {
    uploaded: { publishedAt: order },
    views: { viewCount: order },
    likes: { likeCount: order },
    comments: { commentCount: order },
    likes_per_view: { likeCount: order },
    comments_per_view: { commentCount: order },
    duration: { duration: order },
  } as const;

  const videos = await prisma.video.findMany({
    where,
    // @ts-ignore
    orderBy: orderBy[sortBy],
  });

  const body = type === "json" ? videosToJson(videos) : videosToTsv(videos);

  return new NextResponse(body, {
    headers: {
      "content-type": type === "json" ? "application/json" : "text/plain",
      "Content-Disposition": `attachment; filename=${handle}-${searchParams.toString()}.${type}`,
    },
  });
}
