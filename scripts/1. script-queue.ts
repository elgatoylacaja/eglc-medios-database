import "dotenv/config";
import { mkdir, readdir, writeFile } from "fs/promises";
import winston from "winston";
import { createLogger } from "./logger";
import yargs from "yargs";
import { fetchFromSheets } from "@/lib/sheets";
import { ChannelItem, SheetsRow, VideoWithComments } from "@/lib/types";
import {
  executeSequentiallyInChunks,
  isEligible,
  mapWithConcurrency,
} from "@/lib/utils";
import { YoutubeAPI } from "@/lib/youtube";

const Config = {
  maxVideosResults: 10_000,
  maxCommentsResults: 100_000,
  timeRange: {
    start: "2020-01-01T00:00:00Z",
    end: "2027-01-01T00:00:00Z",
  },
  videosDataChunkSize: 50, // This is the max number of videos that the YouTube API allows to fetch in a single request
  videosToCommentsChunkSize: 10,
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

async function getExistingChannelHandles(): Promise<Set<string>> {
  try {
    const files = await readdir("./scripts/json/channels");
    return new Set(files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")));
  } catch {
    return new Set();
  }
}

async function run() {
  const existingHandles = await getExistingChannelHandles();
  const rows: SheetsRow[] = argv.handle
    ? [{ Handle: argv.handle, Canal: argv.handle, Url: "" }]
    : (await fetchFromSheets()).filter((row) => !existingHandles.has(row.Handle));

  logger.info(`Fetched ${rows.length} rows from the sheet`);

  for (const row of rows) {
    await processRow(row);
  }

  logger.info("All tasks have been processed");
}

async function getExistingVideoIds(handle: string): Promise<Set<string>> {
  try {
    const files = await readdir(`./scripts/json/videos/${handle}`);
    return new Set(files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")));
  } catch {
    return new Set();
  }
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

    await saveChannelData(row.Handle, channel);

    const existingVideoIds = await getExistingVideoIds(row.Handle);
    const videosToFetch = videos.filter((v) => !existingVideoIds.has(v.id));

    logger.info(
      `[${row.Handle}] - ${videosToFetch.length} videos need comment fetching (${existingVideoIds.size} already saved)`,
    );

    await mapWithConcurrency(
      videosToFetch,
      Config.videosToCommentsChunkSize,
      async (video) => {
        const comments = await API.fetchVideoCommentsViaYtDlp(video.id, channel.id);
        await saveVideoData(row.Handle, { ...video, comments });
      },
      ({ completed, total, active }) =>
        logger.info(
          `[${row.Handle}] - Comments: ${completed}/${total} done, ${active} active`,
        ),
    );
  } catch (error) {
    logger.error(`[${row.Handle}] - Error processing row: ${error}`);
  }
}

async function saveChannelData(handle: string, channel: ChannelItem) {
  await writeFile(
    `./scripts/json/channels/${handle}.json`,
    JSON.stringify({ channel }),
    { encoding: "utf-8" },
  );
  logger.info(`[${handle}] - Channel data saved`);
}

async function saveVideoData(handle: string, video: VideoWithComments) {
  await mkdir(`./scripts/json/videos/${handle}`, { recursive: true });
  await writeFile(
    `./scripts/json/videos/${handle}/${video.id}.json`,
    JSON.stringify(video),
    { encoding: "utf-8" },
  );
}

run();
