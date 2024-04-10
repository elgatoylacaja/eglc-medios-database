import { PrismaClient, Prisma } from "@prisma/client";
import { readFile, readdir } from "fs/promises";
import { DatabaseItem } from "../src/lib/types";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  const handles = await readdir("./channels").then((files) => {
    return files
      .filter((file) => file.startsWith("database-"))
      .map((file) => file.replace("database-", "").replace(".json", ""));
  });

  const channels = await Promise.all(
    handles.map((handle) =>
      readFile(`./channels/database-${handle}.json`, {
        encoding: "utf-8",
      }).then((data) => JSON.parse(data) as DatabaseItem)
    )
  );

  for (const channel of channels) {
    const channelData = await prisma.channel
      .create({
        data: {
          id: channel.channel.id,
          name: channel.name,
          handle: channel.handle,
          subscriberCount: parseInt(channel.channel.subscriberCount) || 0,
          videoCount: parseInt(channel.channel.videoCount) || 0,
          viewCount: parseInt(channel.channel.viewCount) || 0,
        },
      })
      .catch((e) => {
        console.error(e);
        console.log(channel.channel);
        return;
      });

    console.log(`Created channel with id: ${channel.handle}`);

    if (channelData) {
      for (const video of channel.videos) {
        const {
          id,
          title,
          publishedAt,
          viewCount,
          likeCount,
          commentCount,
          duration,
          comments,
        } = video;
        const videoData = await prisma.video.create({
          data: {
            id,
            title,
            publishedAt,
            viewCount: parseInt(viewCount) || 0,
            likeCount: parseInt(likeCount) || 0,
            commentCount: parseInt(commentCount) || 0,
            duration,
            channel: {
              connect: {
                id: channelData.id,
              },
            },
          },
        });

        for (const comment of comments) {
          const commentData = await prisma.comment.create({
            data: {
              textDisplay: comment.textDisplay,
              authorChannelUrl: comment.authorChannelUrl,
              authorChannelId: comment.authorChannelId,
              video: {
                connect: {
                  id: videoData.id,
                },
              },
            },
          });
        }
      }
    }
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
