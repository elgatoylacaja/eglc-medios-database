import { mkdir, readdir, writeFile } from "fs/promises";
import PQueue from "p-queue";
import winston from "winston";
import yargs from "yargs";
import { fetchFromSheets } from "../src/lib/sheets";
import { Item, SheetsRow, VideoItem } from "../src/lib/types";
import {
  executeSecuentiallyInChunks,
  flattenCommentItem,
  isEligible,
} from "../src/lib/utils";
import { YoutubeAPI } from "../src/lib/youtube";
import { only_q1 } from "./0. common";

const Config = {
  maxVideosResults: 6_000,
  maxCommentsResults: 100_000,
  timeRange: {
    start: "2020-01-01T00:00:00Z",
    end: "2024-05-01T00:00:00Z",
  },
  videosToCommentsChunkSize: 1000,
};

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `./scripts/logs/logfile-${new Date().getTime()}.log`,
    }),
  ],
});

// Process command line arguments
const argv = yargs(process.argv.slice(2)).option("handle", {
  description: "Channel handle",
  type: "string",
  demandOption: false,
}).argv as { handle?: string };

// Initialize YouTube API and task queue
const API = new YoutubeAPI();
const queue = new PQueue({ concurrency: 1 });

async function run() {
  const files = await readdir("./scripts/json/channels");
  let rows = argv.handle
    ? [{ Handle: argv.handle, Canal: argv.handle, Url: "" }]
    : await fetchFromSheets().then((rows) =>
        rows.filter((row) => !files.includes(`${row.Handle}.json`))
      );

  logger.info(`Fetched ${rows.length} rows from the sheet`);

  for (const row of rows) {
    queue.add(async () => {
      await processRow(row);
    });
  }

  await queue.onIdle();
  logger.info("All tasks have been processed");
}

async function processRow(row: SheetsRow) {
  try {
    logger.info(`[${row.Handle}] - Fetching data for ${row.Canal}`);
    const channel = await API.fetchChannelData(row.Handle);

    if (!channel) {
      logger.warn(`[${row.Handle}] - Channel not found`);
      return;
    }

    logger.info(
      `[${row.Handle}] - Channel has ${channel.statistics.videoCount} videos in total`
    );

    const timeRange = only_q1.includes(row.Handle.toLowerCase().trim())
      ? {
          start: "2024-01-01T00:00:00Z",
          end: "2024-04-01T00:00:00Z",
        }
      : Config.timeRange;

    const playlistId = channel.contentDetails.relatedPlaylists.uploads;
    const playlistItems = await API.fetchPlaylistItems(playlistId, {
      maxResults: Config.maxVideosResults,
      timeRange,
    });
    logger.info(`[${row.Handle}] - Found ${playlistItems.length} videos`);

    const ids = playlistItems.map((item) => item.snippet.resourceId.videoId);

    const videos = (await executeVideosData(ids)).filter(isEligible);
    logger.info(`[${row.Handle}] - Found ${videos.length} eligible videos`);

    const videosWithComments = await fetchCommentsForVideos(videos);

    console.log(
      `[${row.Handle}] - Found ${videosWithComments.reduce(
        (acc, curr) => acc + curr.comments.length,
        0
      )} comments`
    );

    await saveData(row.Handle, { channel, videos: videosWithComments });
  } catch (error) {
    console.log(error);
    logger.error(`[${row.Handle}] - Error processing row: ${error}`);
  }
}

async function executeVideosData(videoIds: string[]) {
  return await executeSecuentiallyInChunks(videoIds, 50, API.fetchVideosData);
}

async function fetchCommentsForVideos(videos: VideoItem[]) {
  return await executeSecuentiallyInChunks(
    videos,
    Config.videosToCommentsChunkSize,
    async (videosChunk) =>
      Promise.all(
        videosChunk.map((video) =>
          API.fetchVideoComments(video.id, {
            maxResults: Config.maxCommentsResults,
          }).then((topComments) => ({
            ...video,
            comments: topComments.flatMap(flattenCommentItem),
          }))
        )
      )
  );
}

async function saveData(handle: string, data: Item) {
  const { channel, videos } = data;

  try {
    await writeFile(
      `./scripts/json/channels/${handle}.json`,
      JSON.stringify(data),
      {
        encoding: "utf-8",
      }
    ).then(() => {
      logger.info(`[${handle}] - Data saved`);
    });
  } catch (error) {
    logger.error(`[${handle}] - Error saving data`);
    await writeFile(
      `./scripts/json/channels/${handle}.json`,
      JSON.stringify({ channel, videos: [] })
    );
    logger.info(`[${handle}] - Channel data saved`);
    logger.info(`[${handle}] - Saving videos data`);
    mkdir(`./scripts/json/videos/${handle}`);
    await executeSecuentiallyInChunks(videos, 50, (chunk, i) =>
      writeFile(
        `./scripts/json/videos/${handle}/videos-${i}.json`,
        JSON.stringify(chunk)
      )
    );
    logger.info(`[${handle}] - Videos data saved`);
  }
  // await writeFile(filePath, JSON.stringify(data), { encoding: "utf-8" });
  // logger.info(`[${handle}] - Data saved to ${filePath}`);
}

run();
