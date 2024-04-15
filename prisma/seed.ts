import { PrismaClient } from "@prisma/client";
import { readFile, readdir } from "fs/promises";
import { Item } from "../src/lib/types";
import {
  executeSequentially,
  getThumbnail,
  isoToSeconds,
} from "../src/lib/utils";

const prisma = new PrismaClient();

function normalizeItem(item: Item): Item {
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

  await executeSequentially(
    handles.map((handle) => async () => {
      const channel = await readFile(`./channels/database-${handle}.json`, {
        encoding: "utf-8",
      })
        .then((data) => JSON.parse(data) as Item)
        .then(normalizeItem);

      const {
        channel: {
          id: channelId,
          snippet: { description, publishedAt, thumbnails },
          statistics: { subscriberCount, videoCount, viewCount },
        },

        name,
      } = channel;

      console.log(`Creating channel with id: ${channelId}`);
      await prisma.channel
        .create({
          data: {
            id: channelId,
            name,
            handle,
            description,
            publishedAt,
            thumbnail: getThumbnail(thumbnails) || "",

            videoCount: parseInt(videoCount) || 0,
            subscriberCount: parseInt(subscriberCount) || 0,
            viewCount: parseInt(viewCount) || 0,
          },
        })
        .then(() => console.log(`Channel with id: ${channelId} created.`));

      await prisma.video
        .createMany({
          data: channel.videos.map((video) => {
            const {
              id: videoId,
              snippet: { title, description, publishedAt, thumbnails },
              statistics: { viewCount, likeCount, commentCount },
              contentDetails: { duration },
            } = video;
            return {
              id: videoId,
              channelId,

              title,
              description,
              publishedAt,
              thumbnail: getThumbnail(thumbnails) || "",
              duration: isoToSeconds(duration) || 0,

              viewCount: parseInt(viewCount) || 0,
              likeCount: parseInt(likeCount || "") || 0,
              commentCount: parseInt(commentCount) || 0,
            };
          }),
          skipDuplicates: true,
        })
        .then((res) =>
          console.log(
            `Videos for channel: ${channelId} created. ${res.count} videos created.`
          )
        );

      await executeSequentially(
        channel.videos.map((video) => async () => {
          const comments = video.comments.map((comment) => {
            return {
              channelId: comment.channelId,
              videoId: comment.videoId,
              authorId: comment.authorChannelId.value,

              text: comment.textDisplay,
              publishedAt: comment.publishedAt,
              likeCount: parseInt(comment.likeCount.toString()) || 0,
            };
          });
          const authors = video.comments.map((comment) => {
            return {
              id: comment.authorChannelId.value,
              name: comment.authorDisplayName,
              avatar: comment.authorProfileImageUrl,
            };
          });

          await prisma.author.createMany({
            data: authors,
            skipDuplicates: true,
          });

          await prisma.comment.createMany({
            data: comments,
          });
        })
      ).then(() => console.log(`Comments for channel: ${channelId} created.`));
    })
  );

  // await prisma.channel.createMany({
  //   data: channels.map((item) => {
  //     const {
  //       channel: {
  //         id,
  //         snippet: { description, publishedAt, thumbnails },
  //         statistics: { subscriberCount, videoCount, viewCount },
  //       },

  //       name,
  //       handle,
  //     } = item;
  //     console.log(`Creating channel with id: ${id}`);
  //     return {
  //       id,

  //       name,
  //       handle,
  //       description,
  //       publishedAt,
  //       thumbnail: getThumbnail(thumbnails) || "",

  //       videoCount: parseInt(videoCount) || 0,
  //       subscriberCount: parseInt(subscriberCount) || 0,
  //       viewCount: parseInt(viewCount) || 0,
  //     };
  //   }),
  // });

  // await prisma.video.createMany({
  //   data: channels.flatMap((item) => {
  //     return item.videos.map((video) => {
  //       const {
  //         id,
  //         snippet: { title, description, publishedAt, thumbnails },
  //         statistics: { viewCount, likeCount, commentCount },
  //         contentDetails: { duration },
  //       } = video;
  //       return {
  //         id,
  //         channelId: item.channel.id,

  //         title,
  //         description,
  //         publishedAt,
  //         thumbnail: getThumbnail(thumbnails) || "",
  //         duration: isoToSeconds(duration) || 0,

  //         viewCount: parseInt(viewCount) || 0,
  //         likeCount: parseInt(likeCount || "") || 0,
  //         commentCount: parseInt(commentCount) || 0,
  //       };
  //     });
  //   }),
  // });

  // await executeSequentially(
  //   channels.flatMap((item) => {
  //     return item.videos.map((video) => {
  //       return async () => {
  //         const comments = video.comments.map((comment) => {
  //           return {
  //             channelId: comment.channelId,
  //             videoId: comment.videoId,
  //             authorId: comment.authorChannelId.value,

  //             text: comment.textDisplay,
  //             publishedAt: comment.publishedAt,
  //             likeCount: parseInt(comment.likeCount.toString()) || 0,
  //           };
  //         });

  //         const authors = video.comments.map((comment) => {
  //           return {
  //             id: comment.authorChannelId.value,
  //             name: comment.authorDisplayName,
  //             avatar: comment.authorProfileImageUrl,
  //           };
  //         });
  //         // await prisma.auth

  //         await prisma.comment.createMany({
  //           data: comments,
  //         });
  //       };
  //     });
  //   })
  // );

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
