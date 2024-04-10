import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const channelId = req.query.id;

  if (typeof channelId === "string") {
    console.log(channelId);
    switch (req.method) {
      case "DELETE":
        return handleDELETE(channelId, res);

      default:
        throw new Error(
          `The HTTP ${req.method} method is not supported at this route.`
        );
    }
  }
}

async function handleDELETE(channelId: string, res: NextApiResponse<any>) {
  const [comments, videos, channel] = await prisma.$transaction([
    prisma.comment.deleteMany({ where: { video: { channelId: channelId } } }),
    prisma.video.deleteMany({ where: { channelId } }),
    prisma.channel.delete({ where: { id: channelId } }),
  ]);

  console.log({ comments, videos, channel });

  return res.json({
    comments,
    videos,
    channel,
  });
}
