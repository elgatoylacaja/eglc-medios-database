import "dotenv/config";
import { mkdir, readdir, writeFile } from "fs/promises";
import winston from "winston";
import { createLogger } from "./logger";
import yargs from "yargs";
import { fetchFromSheets } from "@/lib/sheets";
import { Item, SheetsRow } from "@/lib/types";
import {
  chunkArray,
  executeSequentiallyInChunks,
  isEligible,
  mapWithConcurrency,
} from "@/lib/utils";
import { YoutubeAPI } from "@/lib/youtube";

const Config = {
  maxVideosResults: 5,
  maxCommentsResults: 100_000,
  timeRange: {
    start: "2020-01-01T00:00:00Z",
    end: "2027-01-01T00:00:00Z",
  },
  videosDataChunkSize: 50, // This is the max number of videos that the YouTube API allows to fetch in a single request
  videosToCommentsChunkSize: 5,
};

const logger = createLogger([
  new winston.transports.File({
    filename: `./scripts/logs/logfile-${new Date().getTime()}.log`,
  }),
]);

const argv = yargs(process.argv.slice(2))
  .option("handle", {
    description: "Channel handle",
    type: "string",
    demandOption: false,
  })
  .parseSync();

const API = new YoutubeAPI();

async function run() {
  const files = await readdir("./scripts/json/channels");
  const rows: SheetsRow[] = argv.handle
    ? [{ Handle: argv.handle, Canal: argv.handle, Url: "" }]
    : (await fetchFromSheets()).filter(
        (row) => !files.includes(`${row.Handle}.json`),
      );

  logger.info(`Fetched ${rows.length} rows from the sheet`);

  for (const row of rows) {
    await processRow(row);
  }

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
      `[${row.Handle}] - Channel has ${channel.statistics.videoCount} videos in total`,
    );

    const playlistId = channel.contentDetails.relatedPlaylists.uploads;
    const playlistItems = await API.fetchPlaylistItems(playlistId, {
      maxResults: Config.maxVideosResults,
      timeRange: Config.timeRange,
    });

    logger.info(
      `[${row.Handle}] - Found ${playlistItems.length} videos in the uploads playlist`,
    );

    const ids = playlistItems.map((item) => item.snippet.resourceId.videoId);
    const videos = (
      await executeSequentiallyInChunks(
        ids,
        Config.videosDataChunkSize,
        API.fetchVideosData,
      )
    )
      .filter(isEligible)
      .map((video) => ({ ...video, comments: [] }));

    logger.info(`[${row.Handle}] - Found ${videos.length} eligible videos`);

    const videosWithComments = await mapWithConcurrency(
      videos,
      Config.videosToCommentsChunkSize,
      (video) =>
        API.fetchVideoCommentsViaYtDlp(video.id, channel.id).then(
          (comments) => ({ ...video, comments }),
        ),
      ({ completed, total, active }) =>
        logger.info(
          `[${row.Handle}] - Comments: ${completed}/${total} done, ${active} active`,
        ),
    );

    const totalComments = videosWithComments.reduce(
      (acc, curr) => acc + curr.comments.length,
      0,
    );
    logger.info(`[${row.Handle}] - Found ${totalComments} comments`);

    await saveData(row.Handle, { channel, videos: videosWithComments });
  } catch (error) {
    logger.error(`[${row.Handle}] - Error processing row: ${error}`);
  }
}

async function saveData(handle: string, data: Item) {
  const { channel, videos } = data;

  try {
    await writeFile(
      `./scripts/json/channels/${handle}.json`,
      JSON.stringify(data),
      { encoding: "utf-8" },
    );
    logger.info(`[${handle}] - Data saved`);
  } catch (error) {
    logger.error(`[${handle}] - Error saving full data: ${error}`);

    try {
      await writeFile(
        `./scripts/json/channels/${handle}.json`,
        JSON.stringify({ channel, videos: [] }),
      );
      logger.info(
        `[${handle}] - Channel skeleton saved, writing videos separately`,
      );

      await mkdir(`./scripts/json/videos/${handle}`, { recursive: true });
      const chunks = chunkArray(videos, 50);
      for (let i = 0; i < chunks.length; i++) {
        await writeFile(
          `./scripts/json/videos/${handle}/videos-${i}.json`,
          JSON.stringify(chunks[i]),
        );
      }
      logger.info(`[${handle}] - Videos data saved`);
    } catch (fallbackError) {
      logger.error(`[${handle}] - Fallback save also failed: ${fallbackError}`);
      throw fallbackError;
    }
  }
}

run();
