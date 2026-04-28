import "dotenv/config";
import { YoutubeAPI } from "../src/lib/youtube";

const api = new YoutubeAPI();

// Short video with comments enabled — change to any known video
const VIDEO_ID = process.argv[2] ?? "dQw4w9WgXcQ";
const CHANNEL_ID = process.argv[3] ?? "UCuAXFkgsw1L7xaCfnd5JJOw";

async function main() {
  console.log(`Fetching comments for video ${VIDEO_ID} via yt-dlp...`);
  const comments = await api.fetchVideoCommentsViaYtDlp(VIDEO_ID, CHANNEL_ID);
  console.log(`Fetched ${comments.length} comments`);
  if (comments.length > 0) {
    console.log("Sample comment:", JSON.stringify(comments[0], null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
