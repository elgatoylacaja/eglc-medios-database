import prisma from "../src/lib/prisma";

async function main() {
  const handles = [
    "@olgaenvivo_",
    "@luzutv",
    "@vorterixoficial",
    "@estoesblender",
    "@somosgelatina",
    "@neuramedia",
    "@urbanaplayfm",
  ];

  const viewsPerChannel = await prisma.video.groupBy({
    by: ["channelId"],
    where: {
      channel: {
        handle: {
          in: handles,
        },
      },
      publishedAt: {
        gte: new Date(`2024-04-28T00:00:00.000Z`),
        lte: new Date(`2024-05-04T00:00:00.000Z`),
        // new Date(`2025-01-01T00:00:00.000Z`),
      },
    },
    _sum: {
      viewCount: true,
    },
  });

  const channels = await prisma.channel.findMany({
    where: {
      handle: {
        in: handles,
      },
    },
  });

  viewsPerChannel.forEach((channel) => {
    const channelData = channels.find((c) => c.id === channel.channelId);
    console.log(`${channelData?.handle}\t ${channel._sum.viewCount}`);
  });
  // console.log({ viewsPerChannel });
}

main();
