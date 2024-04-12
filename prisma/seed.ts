import { PrismaClient } from "@prisma/client";
import { readFile, readdir } from "fs/promises";
import { DatabaseItem } from "../src/lib/types";
import { executeSequentially, getThumbnail } from "../src/lib/utils";

const prisma = new PrismaClient();

function normalizeItem(item: DatabaseItem): DatabaseItem {
  return {
    ...item,
    // make sure that videos with certain id appear only once
    videos: item.videos.filter((video, index, self) => {
      const condition = self.findIndex((v) => v.id === video.id) === index;
      if (!condition) {
        console.log(
          `Video: ${video.id} of channel: ${item.channel.id} is duplicated. Skipping...`
        );
      }
      return condition;
    }),
  };
}

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
      })
        .then((data) => JSON.parse(data) as DatabaseItem)
        .then(normalizeItem)
    )
  );

  await prisma.channel.createMany({
    data: channels.map((item) => {
      const {
        channel: { id, subscriberCount, videoCount, viewCount },
        name,
        handle,
      } = item;
      console.log(`Creating channel with id: ${id}`);
      return {
        id,
        name,
        handle,
        videoCount: parseInt(videoCount) || 0,
        subscriberCount: parseInt(subscriberCount) || 0,
        viewCount: parseInt(viewCount) || 0,
      };
    }),
  });

  await prisma.video.createMany({
    data: channels.flatMap((item) => {
      return item.videos.map((video) => {
        const {
          id,
          title,
          publishedAt,
          viewCount,
          likeCount,
          commentCount,
          duration,
          thumbnails,
          description,
        } = video;
        return {
          id,
          title,
          publishedAt,
          viewCount: parseInt(viewCount) || 0,
          likeCount: parseInt(likeCount) || 0,
          commentCount: parseInt(commentCount) || 0,
          duration,
          thumbnail: getThumbnail(thumbnails) || "",
          description,
          channelId: item.channel.id,
        };
      });
    }),
  });

  await executeSequentially(
    channels.flatMap((item) => {
      return item.videos.map((video) => {
        return async () => {
          const comments = video.comments.map((comment) => {
            return {
              textDisplay: comment.textDisplay,
              authorChannelUrl: comment.authorChannelUrl,
              authorChannelId: comment.authorChannelId,
              videoId: video.id,
            };
          });

          await prisma.comment.createMany({
            data: comments,
          });
        };
      });
    })
  );

  // await prisma.comment.createMany({
  //   data: channels.flatMap((item) => {
  //     return item.videos.flatMap((video) => {
  //       return video.comments.map((comment) => {
  //         return {
  //           textDisplay: comment.textDisplay,
  //           authorChannelUrl: comment.authorChannelUrl,
  //           authorChannelId: comment.authorChannelId,
  //           videoId: video.id,
  //         };
  //       });
  //     });
  //   }),
  // });

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
