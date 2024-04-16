import { PrismaClient } from "@prisma/client";
import { readFile, readdir } from "fs/promises";
import {
  createChannel,
  createVideoComments,
  createVideos,
} from "../scripts/db/utils";
import { Item, VideoWithComments } from "../src/lib/types";
import { executeSequentially, flat, normalizeItem } from "../src/lib/utils";

const prisma = new PrismaClient();

function isJson(file: string) {
  return file.endsWith(".json");
}

async function main() {
  const handles = await readdir("./scripts/json/channels").then((files) =>
    files.filter(isJson).map((file) => file.replace(".json", ""))
  );

  await executeSequentially(
    handles.map((handle) => async () => {
      const channel = await readFile(`./scripts/json/channels/${handle}.json`, {
        encoding: "utf-8",
      })
        .then((data) => JSON.parse(data) as Item)
        .then(normalizeItem);

      await createChannel(channel);

      if (channel.videos.length === 0) {
        console.log(`No videos found for ${handle}. Looking for video files.`);
        const videos = await readdir(`./scripts/json/videos/${handle}`).then(
          (files) =>
            Promise.all(
              files.filter(isJson).map((file) =>
                readFile(`./scripts/json/videos/${handle}/${file}`, {
                  encoding: "utf-8",
                }).then((data) => JSON.parse(data) as VideoWithComments[])
              )
            ).then(flat)
        );
        console.log(`Found ${videos.length} videos for ${handle}.`);
        await createVideos(videos);
        await executeSequentially(
          videos.map((video) => async () => {
            await createVideoComments(video);
          })
        );
      } else {
        await createVideos(channel.videos);
        await executeSequentially(
          channel.videos.map((video) => async () => {
            await createVideoComments(video);
          })
        );
      }
    })
  );

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
